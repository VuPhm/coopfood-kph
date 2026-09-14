package vn.coopfood.kph.kph;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

@Repository
class KphRepository {

    private final DSLContext database;

    KphRepository(DSLContext database) {
        this.database = database;
    }

    void lockIdempotency(UUID actorId, String key) {
        database.resultQuery(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))",
                actorId + ":" + key)
                .fetchOne(0, Long.class);
    }

    Optional<IdempotencyEntry> findIdempotency(UUID actorId, String key) {
        return database.fetchOptional(
                "SELECT request_hash, kph_record_id FROM kph_idempotency_keys "
                        + "WHERE actor_user_id = ? AND idempotency_key = ?",
                actorId,
                key).map(row -> new IdempotencyEntry(
                        row.get("request_hash", String.class),
                        row.get("kph_record_id", UUID.class)));
    }

    void insertRecord(
            UUID id,
            UUID storeId,
            UUID actorId,
            KphCreateRequest request,
            String barcode,
            String lookupStatus,
            CatalogValues catalog,
            Instant createdAt,
            String storeCode,
            String storeName,
            String actorDisplayName) {
        database.execute("""
                INSERT INTO kph_records (
                    id, store_id, created_by, type, detected_date, processed_date,
                    quantity, unit, condition_code, condition_detail,
                    resolution_code, resolution_detail, scanned_barcode,
                    catalog_lookup_status, catalog_product_id, catalog_version_id,
                    snapshot_sku_code, snapshot_product_name, snapshot_supplier_code,
                    snapshot_supplier_name, snapshot_store_code, snapshot_store_name,
                    snapshot_actor_display_name, note, lifecycle_state, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)
                """,
                id, storeId, actorId, request.type().name(), request.detectedDate(), request.processedDate(),
                request.quantity(), request.unit().name(), request.condition().name(), normalize(request.conditionDetail()),
                request.resolution().name(), normalize(request.resolutionDetail()), barcode, lookupStatus,
                catalog.productId(), catalog.catalogVersionId(), catalog.skuCode(), catalog.productName(),
                catalog.supplierCode(), catalog.supplierName(), storeCode, storeName, actorDisplayName,
                normalize(request.note()), toTimestamp(createdAt), toTimestamp(createdAt));
    }

    void insertPhoto(UUID id, UUID recordId, int ordinal, StoredPhoto photo, Instant capturedAt, Instant createdAt) {
        database.execute("""
                INSERT INTO kph_photos (
                    id, kph_record_id, ordinal, original_storage_key, stamped_storage_key,
                    content_type, original_size_bytes, stamped_size_bytes,
                    original_sha256, stamped_sha256, captured_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id, recordId, ordinal, photo.originalStorageKey(), photo.stampedStorageKey(),
                photo.contentType(), photo.originalSizeBytes(), photo.stampedSizeBytes(),
                photo.originalSha256(), photo.stampedSha256(), toTimestamp(capturedAt), toTimestamp(createdAt));
    }

    void insertIdempotency(UUID actorId, String key, String requestHash, UUID recordId, Instant createdAt) {
        database.execute("""
                INSERT INTO kph_idempotency_keys
                    (actor_user_id, idempotency_key, request_hash, kph_record_id, created_at)
                VALUES (?, ?, ?, ?, ?)
                """, actorId, key, requestHash, recordId, toTimestamp(createdAt));
    }

    void insertAudit(UUID actorId, UUID recordId, UUID storeId, Instant occurredAt) {
        database.execute("""
                INSERT INTO audit_events
                    (id, actor_user_id, action, target_type, target_id, store_id, metadata, occurred_at)
                VALUES (?, ?, 'KPH_CREATED', 'KPH_RECORD', ?, ?, '{}'::jsonb, ?)
                """, UUID.randomUUID(), actorId, recordId, storeId, toTimestamp(occurredAt));
    }

    List<KphRecordResponse> findAll(UUID storeId, KphType type, LocalDate detectedFrom, LocalDate detectedTo) {
        String sql = """
                SELECT r.*, r.snapshot_store_code AS store_code, r.snapshot_store_name AS store_name,
                       r.snapshot_actor_display_name AS display_name,
                       r.snapshot_reviewer_display_name AS reviewer_display_name,
                       p.ordinal AS photo_ordinal, p.stamped_storage_key, p.captured_at
                FROM kph_records r
                JOIN stores s ON s.id = r.store_id
                JOIN app_users u ON u.id = r.created_by
                JOIN kph_photos p ON p.kph_record_id = r.id
                WHERE r.store_id = ?
                """ + (type == null ? "" : " AND r.type = ? ")
                + (detectedFrom == null ? "" : " AND r.detected_date >= ? ")
                + (detectedTo == null ? "" : " AND r.detected_date <= ? ")
                + " ORDER BY r.created_at DESC, r.id, p.ordinal";
        List<Object> params = new ArrayList<>();
        params.add(storeId);
        if (type != null) {
            params.add(type.name());
        }
        if (detectedFrom != null) {
            params.add(detectedFrom);
        }
        if (detectedTo != null) {
            params.add(detectedTo);
        }
        return mapRows(database.fetch(sql, params.toArray()));
    }

    List<KphRecordResponse> findAllByIds(UUID storeId, KphType type, List<UUID> recordIds) {
        String placeholders = String.join(", ", java.util.Collections.nCopies(recordIds.size(), "?"));
        String sql = """
                SELECT r.*, r.snapshot_store_code AS store_code, r.snapshot_store_name AS store_name,
                       r.snapshot_actor_display_name AS display_name,
                       r.snapshot_reviewer_display_name AS reviewer_display_name,
                       p.ordinal AS photo_ordinal, p.stamped_storage_key, p.captured_at
                FROM kph_records r
                JOIN stores s ON s.id = r.store_id
                JOIN app_users u ON u.id = r.created_by
                JOIN kph_photos p ON p.kph_record_id = r.id
                WHERE r.store_id = ? AND r.type = ? AND r.id IN (
                """ + placeholders + ") ORDER BY r.created_at DESC, r.id, p.ordinal FOR SHARE OF r";
        List<Object> params = new ArrayList<>();
        params.add(storeId);
        params.add(type.name());
        params.addAll(recordIds);
        return mapRows(database.fetch(sql, params.toArray()));
    }

    Optional<KphRecordResponse> findOne(UUID storeId, UUID recordId) {
        String sql = """
                SELECT r.*, r.snapshot_store_code AS store_code, r.snapshot_store_name AS store_name,
                       r.snapshot_actor_display_name AS display_name,
                       r.snapshot_reviewer_display_name AS reviewer_display_name,
                       p.ordinal AS photo_ordinal, p.stamped_storage_key, p.captured_at
                FROM kph_records r
                JOIN stores s ON s.id = r.store_id
                JOIN app_users u ON u.id = r.created_by
                JOIN kph_photos p ON p.kph_record_id = r.id
                WHERE r.store_id = ? AND r.id = ?
                ORDER BY p.ordinal
                """;
        List<KphRecordResponse> records = mapRows(database.fetch(sql, storeId, recordId));
        return records.stream().findFirst();
    }

    Optional<ReviewState> lockReviewState(UUID storeId, UUID recordId) {
        return database.fetchOptional("""
                SELECT approval_status, lifecycle_state
                FROM kph_records
                WHERE store_id = ? AND id = ?
                FOR UPDATE
                """, storeId, recordId).map(row -> new ReviewState(
                        KphApprovalStatus.valueOf(row.get("approval_status", String.class)),
                        row.get("lifecycle_state", String.class)));
    }

    void updateReview(UUID recordId, KphApprovalStatus status, UUID actorId, String actorDisplayName, Instant reviewedAt) {
        if (status == KphApprovalStatus.PENDING) {
            database.execute("""
                    UPDATE kph_records
                    SET approval_status = 'PENDING', reviewed_by = NULL, reviewed_at = NULL,
                        snapshot_reviewer_display_name = NULL, updated_at = ?
                    WHERE id = ?
                    """, toTimestamp(reviewedAt), recordId);
            return;
        }
        database.execute("""
                UPDATE kph_records
                SET approval_status = ?, reviewed_by = ?, reviewed_at = ?,
                    snapshot_reviewer_display_name = ?, updated_at = ?
                WHERE id = ?
                """, status.name(), actorId, toTimestamp(reviewedAt), actorDisplayName,
                toTimestamp(reviewedAt), recordId);
    }

    void insertApprovalHistory(UUID recordId, KphApprovalStatus from, KphApprovalStatus to,
            UUID actorId, String actorDisplayName, Instant changedAt) {
        database.execute("""
                INSERT INTO kph_approval_history
                    (id, kph_record_id, from_status, to_status, changed_by,
                     snapshot_reviewer_display_name, changed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), recordId, from.name(), to.name(), actorId,
                actorDisplayName, toTimestamp(changedAt));
    }

    void insertApprovalAudit(UUID actorId, UUID recordId, UUID storeId,
            KphApprovalStatus from, KphApprovalStatus to, Instant occurredAt) {
        database.execute("""
                INSERT INTO audit_events
                    (id, actor_user_id, action, target_type, target_id, store_id, metadata, occurred_at)
                VALUES (?, ?, 'KPH_REVIEWED', 'KPH_RECORD', ?, ?,
                    jsonb_build_object('fromStatus', ?, 'toStatus', ?), ?)
                """, UUID.randomUUID(), actorId, recordId, storeId, from.name(), to.name(), toTimestamp(occurredAt));
    }

    void insertExportAudit(UUID actorId, UUID exportId, UUID storeId, String metadataJson, Instant occurredAt) {
        database.execute("""
                INSERT INTO audit_events
                    (id, actor_user_id, action, target_type, target_id, store_id, metadata, occurred_at)
                VALUES (?, ?, 'KPH_EXPORTED', 'KPH_EXPORT', ?, ?, ?::jsonb, ?)
                """, UUID.randomUUID(), actorId, exportId, storeId, metadataJson, toTimestamp(occurredAt));
    }

    Optional<PhotoStorageKey> findPhoto(UUID storeId, UUID recordId, int ordinal) {
        return database.fetchOptional("""
                SELECT p.stamped_storage_key
                FROM kph_photos p
                JOIN kph_records r ON r.id = p.kph_record_id
                WHERE r.store_id = ? AND r.id = ? AND p.ordinal = ?
                """, storeId, recordId, ordinal)
                .map(row -> new PhotoStorageKey(row.get("stamped_storage_key", String.class)));
    }

    private List<KphRecordResponse> mapRows(List<? extends Record> rows) {
        List<KphRecordResponse> records = new ArrayList<>();
        UUID currentId = null;
        KphRecordResponse.Builder builder = null;
        for (Record row : rows) {
            UUID id = row.get("id", UUID.class);
            if (!id.equals(currentId)) {
                if (builder != null) {
                    records.add(builder.build());
                }
                currentId = id;
                builder = new KphRecordResponse.Builder(
                        id,
                        KphType.valueOf(row.get("type", String.class)),
                        row.get("detected_date", LocalDate.class),
                        row.get("processed_date", LocalDate.class),
                        row.get("quantity", BigDecimal.class),
                        KphUnit.valueOf(row.get("unit", String.class)),
                        KphCondition.valueOf(row.get("condition_code", String.class)),
                        row.get("condition_detail", String.class),
                        KphResolution.valueOf(row.get("resolution_code", String.class)),
                        row.get("resolution_detail", String.class),
                        row.get("scanned_barcode", String.class),
                        row.get("catalog_lookup_status", String.class),
                        new KphRecordResponse.CatalogSnapshot(
                                row.get("snapshot_sku_code", String.class),
                                row.get("snapshot_product_name", String.class),
                                row.get("snapshot_supplier_code", String.class),
                                row.get("snapshot_supplier_name", String.class)),
                        row.get("lifecycle_state", String.class),
                        KphApprovalStatus.valueOf(row.get("approval_status", String.class)),
                        row.get("reviewed_by", UUID.class) == null ? null : new KphRecordResponse.ActorSnapshot(
                                row.get("reviewed_by", UUID.class),
                                row.get("reviewer_display_name", String.class)),
                        row.get("reviewed_at") == null ? null : toInstant(row.get("reviewed_at")),
                        row.get("note", String.class),
                        new KphRecordResponse.StoreSnapshot(
                                row.get("store_id", UUID.class),
                                row.get("store_code", String.class),
                                row.get("store_name", String.class)),
                        new KphRecordResponse.ActorSnapshot(
                                row.get("created_by", UUID.class),
                                row.get("display_name", String.class)),
                        toInstant(row.get("created_at")));
            }
            builder.photo(new KphRecordResponse.Photo(
                    row.get("photo_ordinal", Integer.class),
                    "/api/v1/stores/" + row.get("store_id", UUID.class)
                            + "/kph/" + id + "/photos/" + row.get("photo_ordinal", Integer.class),
                    toInstant(row.get("captured_at"))));
        }
        if (builder != null) {
            records.add(builder.build());
        }
        return records;
    }

    private static Instant toInstant(Object value) {
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime.toInstant();
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant();
        }
        throw new IllegalStateException("Unsupported timestamp value: " + value);
    }

    private static Timestamp toTimestamp(Instant value) {
        return Timestamp.from(value);
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    record IdempotencyEntry(String requestHash, UUID recordId) {
    }

    record CatalogValues(UUID catalogVersionId, UUID productId, String skuCode, String productName,
            String supplierCode, String supplierName) {
        static CatalogValues manual(KphCreateRequest request) {
            return new CatalogValues(null, null, normalize(request.manualSkuCode()),
                    normalize(request.manualProductName()), null, normalize(request.manualSupplierName()));
        }
    }

    record StoredPhoto(String originalStorageKey, String stampedStorageKey, String contentType,
            long originalSizeBytes, long stampedSizeBytes, String originalSha256, String stampedSha256) {
    }

    record PhotoStorageKey(String value) {
    }

    record ReviewState(KphApprovalStatus approvalStatus, String lifecycleState) {
    }
}
