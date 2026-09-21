package vn.coopfood.kph.catalog;

import java.time.Instant;
import java.util.UUID;

record CatalogImportBatchResponse(
        UUID id,
        String checksumSha256,
        String originalFilename,
        long fileSizeBytes,
        CatalogImportStatus status,
        int rowCount,
        int validRowCount,
        int errorRowCount,
        ActorSnapshot createdBy,
        Instant createdAt) {

    record ActorSnapshot(UUID id, String displayName) {
    }
}
