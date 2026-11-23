package vn.coopfood.kph.date;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import vn.coopfood.kph.catalog.CatalogService;
import vn.coopfood.kph.date.DateLotRepository.Product;
import vn.coopfood.kph.foundation.time.TimeConfiguration;
import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;
import vn.coopfood.kph.store.DateStoreAccessPolicy;
import vn.coopfood.kph.kph.KphService;
import vn.coopfood.kph.kph.KphCreateRequest;
import vn.coopfood.kph.kph.KphDateSource;

@Service
class DateLotService {
    private final DateLotRepository lots;
    private final DateStoreAccessPolicy access;
    private final CatalogService catalog;
    private final ObjectMapper json;
    private final Clock clock;
    private final KphService kph;

    DateLotService(DateLotRepository lots, DateStoreAccessPolicy access, CatalogService catalog,
            ObjectMapper json, Clock clock, KphService kph) {
        this.lots = lots;
        this.access = access;
        this.catalog = catalog;
        this.json = json;
        this.clock = clock;
        this.kph = kph;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    DateLot.Page list(UUID store, String q, String phase, boolean attention, String sort, int page, int size,
            Authentication auth) {
        access.requireAccess(store,auth);
        if (phase != null && !Set.of("SAFE","WARNING","DANGER","EXPIRED","BEFORE_NSX","MISSING").contains(phase)
                || !Set.of("default","expiry","name","notification").contains(sort) || page < 1 || size < 1 || size > 100) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid DATE list parameters.");
        }
        LocalDate businessDate = LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE));
        return lots.page(store,businessDate,query(q),phase,attention,sort,page,size);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    DateLot get(UUID store, UUID id, Authentication auth) {
        access.requireAccess(store,auth);
        return entry(store,id,false).lot().withReminderState(LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE)));
    }

    @Transactional
    DateLot scheduleReminder(UUID store, UUID id, ObjectNode body, Authentication auth) {
        access.requireRemind(store,auth);
        if (body == null || body.propertyNames().stream().anyMatch(name -> !Set.of("expectedVersion","afterDays").contains(name)))
            throw new ApiProblemException(HttpStatus.BAD_REQUEST,"MALFORMED_REQUEST","Invalid reminder request.");
        var expected = body.get("expectedVersion");
        var afterDays = body.get("afterDays");
        if (expected == null || !expected.isIntegralNumber() || !expected.canConvertToLong() || expected.asLong()<1)
            throw DateLotInput.invalid("A positive expectedVersion is required.");
        if (afterDays == null || !afterDays.isIntegralNumber() || !afterDays.canConvertToInt()
                || (afterDays.asInt()!=1 && afterDays.asInt()!=7))
            throw DateLotInput.invalid("Reminder must be scheduled after 1 or 7 days.");
        var current = entry(store,id,true).lot();
        if (current.version()!=expected.asLong())
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_VERSION_CONFLICT","Reload the lot before scheduling a reminder.");
        if (!"OPEN".equals(current.processingStatus()) || new BigDecimal(current.remainingQuantity()).signum()<=0)
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_LOT_RESOLVED","Resolved DATE lots cannot be scheduled.");
        LocalDate today = LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE));
        LocalDate remindOn = today.plusDays(afterDays.asInt());
        var updated = lots.scheduleReminder(store,id,remindOn,(SessionPrincipal)auth.getPrincipal(),clock.instant());
        lots.audit("DATE_LOT_REMINDER_SCHEDULED",updated,json.writeValueAsString(Map.of(
                "before",Map.of("remindOn",current.remindOn()==null?"":current.remindOn().toString(),"version",current.version()),
                "after",Map.of("remindOn",remindOn.toString(),"version",updated.version()))));
        return updated.withReminderState(today);
    }

    @Transactional(readOnly = true)
    List<DateLot.Suggestion> suggestions(UUID store, String q, Authentication auth) {
        access.requireAccess(store,auth);
        return lots.suggest(store,query(q));
    }

    @Transactional
    DateLot.WriteResult create(UUID store, String key, ObjectNode body, Authentication auth) {
        access.requireAccess(store,auth);
        var actor = (SessionPrincipal) auth.getPrincipal();
        if (key.length()<16 || key.length()>128 || key.isBlank() || !key.equals(key.strip())) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Invalid Idempotency-Key.");
        }
        var input = DateLotInput.parse(body,false);
        String hash = fingerprint(input);
        lots.lockCreate(store, actor.userId(), key);
        var receipt = lots.receipt(store,actor.userId(),key);
        if (receipt.isPresent()) {
            if (!receipt.get().hash().equals(hash)) {
                throw new ApiProblemException(HttpStatus.CONFLICT,"IDEMPOTENCY_KEY_REUSED","This key identifies a different create.");
            }
            return json.readValue(receipt.get().response(),DateLot.WriteResult.class);
        }

        Product product = resolve(input);
        lots.lockDuplicateCheck(store, product.sku());
        var lot = lots.insert(store, UUID.randomUUID(), input, product, actor, clock.instant());
        var result = new DateLot.WriteResult(lot,lots.duplicate(lot));
        lots.audit("DATE_LOT_CREATED",lot,json.writeValueAsString(new Change(null,AuditSnapshot.from(lot),null)));
        lots.saveReceipt(store,actor.userId(),key,hash,lot.id(),json.writeValueAsString(result));
        return result;
    }

    @Transactional
    DateLot.WriteResult update(UUID store, UUID id, ObjectNode body, Authentication auth) {
        access.requireUpdate(store,auth);
        var current = entry(store,id,true);
        var input = DateLotInput.parse(body,true);
        var expected = body.get("expectedVersion");
        if (expected == null || !expected.isIntegralNumber() || !expected.canConvertToLong() || expected.asLong()<1) {
            throw DateLotInput.invalid("A positive expectedVersion is required.");
        }
        String reason = DateLotInput.text(body,"reason",500,false);
        if (current.lot().version() != expected.asLong()) {
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_VERSION_CONFLICT","Reload the lot before editing.");
        }
        if (!"OPEN".equals(current.lot().processingStatus())) {
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_LOT_RESOLVED","Resolved DATE lots are read-only.");
        }
        if (input.trackedQuantity().compareTo(new BigDecimal(current.lot().processedQuantity())) <= 0) {
            throw DateLotInput.invalid("Tracked quantity must remain greater than processed quantity.");
        }
        if (!current.lot().processingHistory().isEmpty() && (!current.lot().skuCode().equals(input.skuCode())
                || !current.lot().productName().equals(input.productName())
                || !current.lot().unit().equals(input.unit()) || !current.lot().lookupStatus().equals(input.lookupStatus())
                || !Objects.equals(current.lot().barcode(),input.barcode())))
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_IDENTITY_LOCKED","Product identity and unit are locked after processing starts.");
        boolean sameIdentity = current.lot().lookupStatus().equals(input.lookupStatus())
                && Objects.equals(current.lot().barcode(),input.barcode())
                && current.lot().skuCode().equals(input.skuCode()) && current.lot().productName().equals(input.productName());
        Product product = sameIdentity ? current.product() : resolve(input);
        lots.lockDuplicateCheck(store, product.sku());
        var updated = lots.update(store,id,input,product,(SessionPrincipal)auth.getPrincipal(),clock.instant());
        lots.audit("DATE_LOT_UPDATED",updated,json.writeValueAsString(new Change(AuditSnapshot.from(current.lot()),
                AuditSnapshot.from(updated),reason)));
        return new DateLot.WriteResult(updated.withReminderState(LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE))),lots.duplicate(updated));
    }

    @Transactional
    DateLotProcessingReceipt process(UUID store, UUID id, String key, ObjectNode body,
            List<MultipartFile> photos, Authentication auth) {
        access.requireProcess(store, auth);
        if (key == null || key.length() < 16 || key.length() > 128 || !key.equals(key.strip())) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Invalid Idempotency-Key.");
        }
        var principal = (SessionPrincipal) auth.getPrincipal();
        var request = DateLotProcessingRequest.parse(body,json);
        String hash = kph.fingerprintDateRequest(store,id,principal.userId(),key,body,photos);
        lots.lockProcess(store,id,principal.userId(),key);
        var prior = lots.processReceipt(store,id,principal.userId(),key);
        if (prior.isPresent()) {
            if (!prior.get().hash().equals(hash)) {
                throw new ApiProblemException(HttpStatus.CONFLICT,"IDEMPOTENCY_KEY_REUSED","This key identifies a different processing request.");
            }
            return json.readValue(prior.get().response(),DateLotProcessingReceipt.class);
        }
        var entry = entry(store,id,true);
        var lot = entry.lot();
        if (!"OPEN".equals(lot.processingStatus())) {
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_LOT_RESOLVED","This DATE lot is already resolved.");
        }
        if (lot.version() != request.expectedVersion()) {
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_VERSION_CONFLICT","Reload the lot before processing.");
        }
        request.validate(lot);
        KphCreateRequest payload = withSourceIdentity(request.kph(),lot);
        var source = new KphDateSource(lot.lookupStatus(),lot.barcode(),entry.product().versionId(),entry.product().productId(),
                lot.skuCode(),lot.productName(),lot.supplierCode(),lot.supplierName());
        var record = kph.createFromDate(store,payload,photos,auth,source);
        Instant now = clock.instant();
        DateLot after = lots.applyProcessing(store,id,payload.quantity(),payload.type().name(),principal,now);
        String snapshot = json.writeValueAsString(Map.of("skuCode",lot.skuCode(),"productName",lot.productName(),
                "barcode",lot.barcode()==null?"":lot.barcode(),"lookupStatus",lot.lookupStatus(),"unit",lot.unit(),
                "lotCode",lot.lotCode()==null?"":lot.lotCode(),"manufacturedOn",lot.manufacturedOn()==null?"":lot.manufacturedOn().toString(),
                "expiresOn",lot.expiresOn().toString(),"trackedQuantity",lot.trackedQuantity(),"kphType",payload.type().name()));
        lots.insertProcessing(UUID.randomUUID(),lot,after,record.id(),payload.quantity(),principal,now,snapshot);
        lots.audit("DATE_LOT_PROCESSED",after,json.writeValueAsString(Map.of("sourceVersion",lot.version(),
                "resultingVersion",after.version(),"kphRecordId",record.id(),"quantity",payload.quantity().toPlainString())));
        var receipt = new DateLotProcessingReceipt(record.id(),payload.quantity().toPlainString(),lot.unit(),lot.version(),
                after.version(),after.remainingQuantity(),now,new DateLot.Actor(principal.userId(),principal.user().displayName()));
        lots.saveProcessReceipt(store,id,principal.userId(),key,hash,record.id(),json.writeValueAsString(receipt));
        return receipt;
    }

    private static KphCreateRequest withSourceIdentity(KphCreateRequest r, DateLot lot) {
        return new KphCreateRequest(r.type(), r.detectedDate(), r.processedDate(), r.quantity(), r.unit(),
                r.condition(), r.conditionDetail(), r.resolution(), r.resolutionDetail(), null, lot.skuCode(),
                lot.productName(), lot.supplierName(), r.note(), r.photoLastModified());
    }

    private DateLotRepository.Entry entry(UUID store, UUID id, boolean lock) {
        return lots.find(store,id,lock).orElseThrow(() ->
                new ApiProblemException(HttpStatus.NOT_FOUND,"DATE_LOT_NOT_FOUND","No such lot in this store."));
    }

    private Product resolve(DateLotInput input) {
        if (input.barcode() != null) {
            var resolved = catalog.resolveCurrent(input.barcode());
            if (resolved.isPresent() != input.lookupStatus().equals("FOUND")) {
                throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_CATALOG_CHANGED","Look up the barcode again.");
            }
            if (resolved.isPresent()) {
                var value = resolved.get();
                return new Product(value.skuCode(),value.productName(),value.productId(),value.catalogVersionId(),
                        value.supplierCode(),value.supplierName());
            }
        }
        return new Product(input.skuCode(),input.productName(),null,null,null,null);
    }

    private String fingerprint(DateLotInput input) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(input)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String query(String q) {
        String term = q == null ? "" : q.strip();
        if (term.codePointCount(0,term.length())>200) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Search term is too long.");
        }
        return term;
    }

    private record AuditSnapshot(String lookupStatus, String barcode, String skuCode, String productName,
            String lotCode, LocalDate manufacturedOn, LocalDate expiresOn, String unit,
            String trackedQuantity, long version) {
        static AuditSnapshot from(DateLot lot) {
            return new AuditSnapshot(lot.lookupStatus(), lot.barcode(), lot.skuCode(), lot.productName(),
                    lot.lotCode(), lot.manufacturedOn(), lot.expiresOn(), lot.unit(), lot.trackedQuantity(), lot.version());
        }
    }

    private record Change(AuditSnapshot before, AuditSnapshot after, String reason) {}
}
