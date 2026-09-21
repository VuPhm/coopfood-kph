package vn.coopfood.kph.catalog;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import tools.jackson.databind.ObjectMapper;

@Repository
class CatalogImportRepository {

    private final DSLContext database;
    private final ObjectMapper objectMapper;

    CatalogImportRepository(DSLContext database, ObjectMapper objectMapper) {
        this.database = database;
        this.objectMapper = objectMapper;
    }

    boolean hasCatalogAdmin(UUID actorId) {
        return Boolean.TRUE.equals(database.fetchValue("""
                SELECT EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = ? AND role = 'CATALOG_ADMIN'
                )
                """, actorId));
    }

    List<CatalogImportBatchResponse> listBatches() {
        return database.fetch(batchProjection() + " ORDER BY b.created_at DESC, b.id DESC LIMIT 50")
                .map(this::mapBatch);
    }

    Optional<CatalogImportBatchResponse> findBatch(UUID batchId) {
        return database.fetch(batchProjection() + " HAVING b.id = ?", batchId).stream()
                .findFirst().map(this::mapBatch);
    }

    Optional<CatalogImportBatchResponse> findBatchByChecksum(String checksum) {
        return database.fetch(batchProjection() + " HAVING b.checksum_sha256 = ?", checksum).stream()
                .findFirst().map(this::mapBatch);
    }

    List<CatalogImportRowResponse> listRows(UUID batchId, int offset, int limit) {
        return database.fetch("""
                SELECT row_number, status, raw_payload, normalized_payload, validation_messages
                FROM catalog_import_rows
                WHERE batch_id = ?
                ORDER BY row_number
                LIMIT ? OFFSET ?
                """, batchId, limit, offset).map(row -> new CatalogImportRowResponse(
                        row.get("row_number", Integer.class),
                        CatalogImportRowStatus.valueOf(row.get("status", String.class)),
                        objectMapper.readValue(row.get("raw_payload").toString(), CatalogRowValues.class),
                        objectMapper.readValue(row.get("normalized_payload").toString(), CatalogRowValues.class),
                        List.copyOf(Arrays.asList(objectMapper.readValue(
                                row.get("validation_messages").toString(), CatalogValidationMessage[].class)))));
    }

    int countRows(UUID batchId) {
        return ((Number) database.fetchValue(
                "SELECT count(*) FROM catalog_import_rows WHERE batch_id = ?", batchId)).intValue();
    }

    int insertBatch(UUID batchId, String checksum, String filename, String contentType,
            long fileSize, UUID actorId, Instant now) {
        return database.execute("""
                INSERT INTO catalog_import_batches (
                    id, checksum_sha256, original_filename, content_type, file_size_bytes,
                    status, validation_error_count, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'STAGED', 0, ?, ?, ?)
                ON CONFLICT (checksum_sha256) DO NOTHING
                """, batchId, checksum, filename, contentType, fileSize, actorId,
                Timestamp.from(now), Timestamp.from(now));
    }

    void insertRow(UUID batchId, CatalogCsvParser.ParsedRow row) {
        database.execute("""
                INSERT INTO catalog_import_rows (
                    batch_id, row_number, raw_payload, normalized_payload,
                    validation_messages, status)
                VALUES (?, ?, CAST(? AS jsonb), CAST(? AS jsonb), CAST(? AS jsonb), ?)
                """, batchId, row.rowNumber(), objectMapper.writeValueAsString(row.raw()),
                objectMapper.writeValueAsString(row.normalized()),
                objectMapper.writeValueAsString(row.validationMessages()), row.status().name());
    }

    void finishBatch(UUID batchId, CatalogImportStatus status, int errorRowCount, Instant now) {
        database.execute("""
                UPDATE catalog_import_batches
                SET status = ?, validation_error_count = ?, updated_at = ?
                WHERE id = ? AND status = 'STAGED'
                """, status.name(), errorRowCount, Timestamp.from(now), batchId);
    }

    void insertAudit(UUID actorId, UUID batchId, CatalogImportStatus status,
            String checksum, int rowCount, int errorRowCount, Instant now) {
        database.execute("""
                INSERT INTO audit_events (
                    id, actor_user_id, action, target_type, target_id, metadata, occurred_at)
                VALUES (?, ?, ?, 'CATALOG_IMPORT_BATCH', ?,
                    jsonb_build_object(
                        'checksumSha256', ?,
                        'rowCount', ?,
                        'errorRowCount', ?), ?)
                """, UUID.randomUUID(), actorId, "CATALOG_IMPORT_" + status.name(), batchId,
                checksum, rowCount, errorRowCount, Timestamp.from(now));
    }

    private String batchProjection() {
        return """
                SELECT b.id, b.checksum_sha256, b.original_filename, b.file_size_bytes,
                       b.status, b.created_by, u.display_name AS created_by_name, b.created_at,
                       count(r.row_number) AS row_count,
                       count(r.row_number) FILTER (WHERE r.status = 'VALID') AS valid_row_count,
                       count(r.row_number) FILTER (WHERE r.status = 'ERROR') AS error_row_count
                FROM catalog_import_batches b
                LEFT JOIN app_users u ON u.id = b.created_by
                LEFT JOIN catalog_import_rows r ON r.batch_id = b.id
                GROUP BY b.id, u.display_name
                """;
    }

    private CatalogImportBatchResponse mapBatch(Record row) {
        UUID actorId = row.get("created_by", UUID.class);
        return new CatalogImportBatchResponse(
                row.get("id", UUID.class),
                row.get("checksum_sha256", String.class),
                row.get("original_filename", String.class),
                ((Number) row.get("file_size_bytes")).longValue(),
                CatalogImportStatus.valueOf(row.get("status", String.class)),
                ((Number) row.get("row_count")).intValue(),
                ((Number) row.get("valid_row_count")).intValue(),
                ((Number) row.get("error_row_count")).intValue(),
                actorId == null ? null : new CatalogImportBatchResponse.ActorSnapshot(
                        actorId, row.get("created_by_name", String.class)),
                toInstant(row.get("created_at")));
    }

    private static Instant toInstant(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof OffsetDateTime offsetDateTime) return offsetDateTime.toInstant();
        if (value instanceof Timestamp timestamp) return timestamp.toInstant();
        throw new IllegalStateException("Unsupported timestamp value: " + value);
    }
}
