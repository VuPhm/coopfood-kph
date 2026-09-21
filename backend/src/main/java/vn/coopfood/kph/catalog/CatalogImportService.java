package vn.coopfood.kph.catalog;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;

@Service
class CatalogImportService {

    static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private final CatalogImportRepository repository;
    private final CatalogCsvParser parser = new CatalogCsvParser();
    private final Clock clock;

    CatalogImportService(CatalogImportRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    List<CatalogImportBatchResponse> list(Authentication authentication) {
        requireCatalogAdmin(authentication);
        return repository.listBatches();
    }

    @Transactional(readOnly = true)
    CatalogImportDetailResponse detail(UUID batchId, int offset, int limit, Authentication authentication) {
        requireCatalogAdmin(authentication);
        if (offset < 0 || limit < 1 || limit > 500) {
            throw problem(HttpStatus.BAD_REQUEST, "CATALOG_PAGE_INVALID",
                    "offset must be non-negative and limit must be from 1 to 500.");
        }
        CatalogImportBatchResponse batch = repository.findBatch(batchId)
                .orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "CATALOG_IMPORT_NOT_FOUND",
                        "The catalog import batch does not exist."));
        return new CatalogImportDetailResponse(batch, repository.listRows(batchId, offset, limit),
                repository.countRows(batchId), offset, limit);
    }

    @Transactional
    CatalogImportUploadResponse upload(MultipartFile file, Authentication authentication) {
        SessionPrincipal actor = requireCatalogAdmin(authentication);
        byte[] bytes = readFile(file);
        String checksum = checksum(bytes);
        var existing = repository.findBatchByChecksum(checksum);
        if (existing.isPresent()) return new CatalogImportUploadResponse(existing.orElseThrow(), true);

        CatalogCsvParser.ParsedBatch parsed = parser.parse(bytes);
        UUID batchId = UUID.randomUUID();
        Instant now = clock.instant();
        int inserted = repository.insertBatch(batchId, checksum, safeFilename(file.getOriginalFilename()),
                normalizeContentType(file.getContentType()), bytes.length, actor.userId(), now);
        if (inserted == 0) {
            return new CatalogImportUploadResponse(repository.findBatchByChecksum(checksum).orElseThrow(), true);
        }
        parsed.rows().forEach(row -> repository.insertRow(batchId, row));
        CatalogImportStatus status = parsed.errorRowCount() == 0
                ? CatalogImportStatus.VALIDATED : CatalogImportStatus.REJECTED;
        repository.finishBatch(batchId, status, parsed.errorRowCount(), now);
        repository.insertAudit(actor.userId(), batchId, status, checksum,
                parsed.rows().size(), parsed.errorRowCount(), now);
        return new CatalogImportUploadResponse(repository.findBatch(batchId).orElseThrow(), false);
    }

    private SessionPrincipal requireCatalogAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw problem(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
        }
        if (!repository.hasCatalogAdmin(principal.userId())) {
            throw problem(HttpStatus.FORBIDDEN, "CATALOG_ADMIN_REQUIRED",
                    "An active CATALOG_ADMIN role is required.");
        }
        return principal;
    }

    private byte[] readFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "CATALOG_FILE_EMPTY",
                    "A non-empty catalog CSV file is required.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw problem(HttpStatus.PAYLOAD_TOO_LARGE, "CATALOG_FILE_TOO_LARGE",
                    "Catalog CSV cannot exceed 5 MiB.");
        }
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length > MAX_FILE_SIZE_BYTES) {
                throw problem(HttpStatus.PAYLOAD_TOO_LARGE, "CATALOG_FILE_TOO_LARGE",
                        "Catalog CSV cannot exceed 5 MiB.");
            }
            return bytes;
        } catch (IOException exception) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "CATALOG_FILE_UNREADABLE",
                    "Catalog CSV could not be read.");
        }
    }

    private String checksum(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime.", exception);
        }
    }

    private String safeFilename(String filename) {
        String candidate = filename == null ? "catalog.csv" : filename.replace('\\', '/');
        candidate = candidate.substring(candidate.lastIndexOf('/') + 1).trim();
        if (candidate.isEmpty()) candidate = "catalog.csv";
        return candidate.length() <= 255 ? candidate : candidate.substring(candidate.length() - 255);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) return null;
        String normalized = contentType.trim();
        return normalized.length() <= 255 ? normalized : normalized.substring(0, 255);
    }

    private ApiProblemException problem(HttpStatus status, String code, String detail) {
        return new ApiProblemException(status, code, detail);
    }
}
