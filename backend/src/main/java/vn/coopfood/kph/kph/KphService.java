package vn.coopfood.kph.kph;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import tools.jackson.databind.ObjectMapper;
import vn.coopfood.kph.catalog.CatalogService;
import vn.coopfood.kph.foundation.time.TimeConfiguration;
import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.StoreContext;
import vn.coopfood.kph.store.StoreAccessService;

@Service
class KphService {

    private final KphRepository repository;
    private final CatalogService catalog;
    private final StoreAccessService storeAccess;
    private final LocalPrivateMediaStorage media;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    KphService(KphRepository repository, CatalogService catalog, StoreAccessService storeAccess,
            LocalPrivateMediaStorage media, Clock clock, ObjectMapper objectMapper) {
        this.repository = repository;
        this.catalog = catalog;
        this.storeAccess = storeAccess;
        this.media = media;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    @Transactional
    KphRecordResponse create(UUID storeId, KphCreateRequest request, List<MultipartFile> photos,
            String idempotencyKey, Authentication authentication) {
        StoreContext store = storeAccess.requireMembership(storeId, authentication);
        UUID actorId = ((vn.coopfood.kph.identity.SessionPrincipal) authentication.getPrincipal()).userId();
        validateIdempotencyKey(idempotencyKey);
        String requestHash = fingerprint(request, photos);

        repository.lockIdempotency(actorId, idempotencyKey);
        var existing = repository.findIdempotency(actorId, idempotencyKey);
        if (existing.isPresent()) {
            if (!existing.orElseThrow().requestHash().equals(requestHash)) {
                throw problem(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED",
                        "The idempotency key was already used for a different request.");
            }
            return repository.findOne(storeId, existing.orElseThrow().recordId())
                    .orElseThrow(() -> problem(HttpStatus.CONFLICT, "IDEMPOTENCY_RECORD_UNAVAILABLE",
                            "The idempotent record is no longer available."));
        }

        validateBusiness(request, photos);
        String barcode = normalize(request.barcode());
        KphRepository.CatalogValues catalogValues;
        String lookupStatus;
        if (barcode != null) {
            var resolved = catalog.resolveCurrent(barcode);
            if (resolved.isPresent()) {
                var value = resolved.orElseThrow();
                lookupStatus = "FOUND";
                catalogValues = new KphRepository.CatalogValues(value.catalogVersionId(), value.productId(),
                        value.skuCode(), value.productName(), value.supplierCode(), value.supplierName());
            } else {
                lookupStatus = "NOT_FOUND";
                catalogValues = KphRepository.CatalogValues.manual(request);
            }
        } else {
            lookupStatus = "MANUAL";
            catalogValues = KphRepository.CatalogValues.manual(request);
        }

        UUID recordId = UUID.randomUUID();
        Instant createdAt = Instant.now(clock);
        List<String> storedKeys = new ArrayList<>();
        try {
            List<StoredMedia> stored = new ArrayList<>();
            for (int index = 0; index < photos.size(); index++) {
                Instant capturedAt = request.photoLastModified() != null && index < request.photoLastModified().size()
                        && request.photoLastModified().get(index) != null
                                ? request.photoLastModified().get(index)
                                : createdAt;
                KphRepository.StoredPhoto storedPhoto = media.store(recordId, index + 1, photos.get(index), store, capturedAt);
                stored.add(new StoredMedia(storedPhoto, capturedAt));
                storedKeys.add(storedPhoto.originalStorageKey());
                storedKeys.add(storedPhoto.stampedStorageKey());
            }

            repository.insertRecord(recordId, storeId, actorId, request, barcode, lookupStatus, catalogValues, createdAt,
                    store.code(), store.name(), ((vn.coopfood.kph.identity.SessionPrincipal) authentication.getPrincipal()).user().displayName());
            for (int index = 0; index < stored.size(); index++) {
                StoredMedia photo = stored.get(index);
                repository.insertPhoto(UUID.randomUUID(), recordId, index + 1, photo.photo(), photo.capturedAt(), createdAt);
            }
            repository.insertAudit(actorId, recordId, storeId, createdAt);
            repository.insertIdempotency(actorId, idempotencyKey, requestHash, recordId, createdAt);
            return repository.findOne(storeId, recordId).orElseThrow();
        } catch (RuntimeException exception) {
            storedKeys.forEach(media::delete);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    List<KphRecordResponse> list(UUID storeId, KphType type, Authentication authentication) {
        storeAccess.requireMembership(storeId, authentication);
        return repository.findAll(storeId, type);
    }

    @Transactional(readOnly = true)
    byte[] stampedPhoto(UUID storeId, UUID recordId, int ordinal, Authentication authentication) {
        storeAccess.requireMembership(storeId, authentication);
        if (ordinal < 1 || ordinal > 3) {
            throw problem(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND", "The evidence photo does not exist.");
        }
        String storageKey = repository.findPhoto(storeId, recordId, ordinal)
                .orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND", "The evidence photo does not exist."))
                .value();
        return media.readStamped(storageKey);
    }

    private void validateBusiness(KphCreateRequest request, List<MultipartFile> photos) {
        if (!request.detectedDate().equals(LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE)))) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "BUSINESS_DATE_MISMATCH",
                    "detectedDate must be the current Asia/Ho_Chi_Minh business date.");
        }
        if (request.unit() == KphUnit.EA && request.quantity().stripTrailingZeros().scale() > 0) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "WHOLE_UNIT_REQUIRED",
                    "EA quantity must be a positive whole number.");
        }
        if ((request.type() == KphType.TPCN && (request.condition() == KphCondition.BRUISED_WATERLOGGED
                || request.condition() == KphCondition.ROTTEN_MOLDY))
                || (request.type() == KphType.TPTS && (request.condition() == KphCondition.TORN_PACKAGING
                || request.condition() == KphCondition.VACUUM_LEAK))) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "CONDITION_NOT_ALLOWED",
                    "The selected condition is not allowed for this KPH type.");
        }
        if (request.type() == KphType.TPTS
                && request.resolution() != KphResolution.CANCEL && request.resolution() != KphResolution.OTHER) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "RESOLUTION_NOT_ALLOWED",
                    "The selected resolution is not allowed for TPTS.");
        }
        if (normalize(request.barcode()) == null && normalize(request.manualSkuCode()) == null
                && normalize(request.manualProductName()) == null) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "PRODUCT_INPUT_REQUIRED",
                    "At least one of barcode, manualSkuCode or manualProductName is required.");
        }
        if (photos == null || photos.size() < 1 || photos.size() > 3) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "PHOTO_COUNT_INVALID",
                    "A KPH record requires between one and three evidence photos.");
        }
        validateLength(request.manualSkuCode(), 50, "manualSkuCode");
        validateLength(request.manualProductName(), 200, "manualProductName");
        validateLength(request.manualSupplierName(), 150, "manualSupplierName");
        validateLength(request.note(), 255, "note");
    }

    private String fingerprint(KphCreateRequest request, List<MultipartFile> photos) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(objectMapper.writeValueAsBytes(request));
            if (photos != null) {
                for (MultipartFile photo : photos) {
                    byte[] bytes = photo.getBytes();
                    digest.update((byte) 0);
                    digest.update(Long.toString(bytes.length).getBytes(StandardCharsets.UTF_8));
                    digest.update((byte) 0);
                    digest.update(bytes);
                }
            }
            return java.util.HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException | java.io.IOException exception) {
            throw new IllegalStateException("Could not fingerprint KPH request.", exception);
        }
    }

    private static void validateIdempotencyKey(String key) {
        if (key == null || key.length() < 16 || key.length() > 128 || key.isBlank() || !key.equals(key.trim())) {
            throw problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Idempotency-Key must contain between 16 and 128 non-whitespace characters.");
        }
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static void validateLength(String value, int max, String field) {
        if (value != null && value.length() > max) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "FIELD_TOO_LONG",
                    field + " must contain at most " + max + " characters.");
        }
    }

    private static ApiProblemException problem(HttpStatus status, String code, String detail) {
        return new ApiProblemException(status, code, detail);
    }

    private record StoredMedia(KphRepository.StoredPhoto photo, Instant capturedAt) {
    }
}
