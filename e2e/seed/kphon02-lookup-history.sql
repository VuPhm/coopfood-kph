-- Synthetic only. Additive fixture for the freshly created KPHON02 acceptance container.
-- Apply admin03-membership.sql first. Refuse existing catalog/history; never truncate.
BEGIN;
DO $$ BEGIN
 IF current_database() <> 'coopfood_kph_admin03_acceptance' OR EXISTS (SELECT 1 FROM catalog_versions) OR EXISTS (SELECT 1 FROM kph_records) THEN
  RAISE EXCEPTION 'KPHON02 requires an empty synthetic catalog/history database';
 END IF;
END $$;
INSERT INTO catalog_import_batches (
    id, checksum_sha256, original_filename, content_type, file_size_bytes,
    status, validation_error_count, created_at, updated_at, published_at
) VALUES (
    '30000000-0000-4000-8000-000000000001',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'foundation-01-synthetic.csv',
    'text/csv',
    512,
    'PUBLISHED',
    0,
    '2026-09-09 00:00:00+07',
    '2026-09-09 00:00:00+07',
    '2026-09-09 00:00:00+07'
);

INSERT INTO catalog_versions (
    id, source_batch_id, status, is_current, created_at, published_at
) VALUES (
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'PUBLISHED',
    TRUE,
    '2026-09-09 00:00:00+07',
    '2026-09-09 00:00:00+07'
);

INSERT INTO products (
    id, catalog_version_id, sku_code, product_name, active
) VALUES
    (
        '30000000-0000-4000-8000-000000000011',
        '30000000-0000-4000-8000-000000000002',
        '000042',
        'Sản phẩm E2E FOUND',
        TRUE
    ),
    (
        '30000000-0000-4000-8000-000000000012',
        '30000000-0000-4000-8000-000000000002',
        'SKU-E2E-0002',
        'Sản phẩm E2E thứ hai',
        TRUE
    );

INSERT INTO product_barcodes (
    product_id, catalog_version_id, barcode, active
) VALUES
    (
        '30000000-0000-4000-8000-000000000011',
        '30000000-0000-4000-8000-000000000002',
        '0890123456789',
        TRUE
    ),
    (
        '30000000-0000-4000-8000-000000000012',
        '30000000-0000-4000-8000-000000000002',
        '0890123456790',
        TRUE
    );

INSERT INTO suppliers (
    id, catalog_version_id, supplier_code, supplier_name
) VALUES
    (
        '30000000-0000-4000-8000-000000000021',
        '30000000-0000-4000-8000-000000000002',
        '000007',
        'NCC E2E chính'
    ),
    (
        '30000000-0000-4000-8000-000000000022',
        '30000000-0000-4000-8000-000000000002',
        'NCC-E2E-02',
        'NCC E2E phụ'
    );

INSERT INTO product_suppliers (
    product_id, supplier_id, catalog_version_id, is_primary
) VALUES
    (
        '30000000-0000-4000-8000-000000000011',
        '30000000-0000-4000-8000-000000000021',
        '30000000-0000-4000-8000-000000000002',
        TRUE
    ),
    (
        '30000000-0000-4000-8000-000000000012',
        '30000000-0000-4000-8000-000000000022',
        '30000000-0000-4000-8000-000000000002',
        TRUE
    );

-- Keep enough valid synthetic TPTS history to exercise real server paging in
-- both browser viewports. Each record has one evidence-photo metadata row; the
-- browser acceptance checks paging/state, not media delivery for these rows.
INSERT INTO kph_records (
    id, store_id, created_by, type, detected_date, processed_date,
    quantity, unit, condition_code, condition_detail, resolution_code,
    resolution_detail, scanned_barcode, catalog_lookup_status,
    snapshot_product_name, snapshot_supplier_name, lifecycle_state,
    created_at, updated_at, snapshot_store_code, snapshot_store_name,
    snapshot_actor_display_name, approval_status
)
SELECT
    md5('kphon02-paging-record-' || g)::uuid,
    '73000000-0000-4000-8000-000000000001'::uuid,
    '71000000-0000-4000-8000-000000000004'::uuid,
    'TPTS', DATE '2026-09-01' + (g % 5), NULL, 1000 + g, 'EA',
    'BRUISED_WATERLOGGED', NULL, 'CANCEL', NULL,
    '9900000' || lpad(g::text, 6, '0'), 'NOT_FOUND',
    'Phiếu phân trang E2E ' || lpad(g::text, 2, '0'),
    'NCC phân trang E2E', 'SUBMITTED',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second',
    '001', 'Cửa hàng An Phú mẫu', 'Quản lý cửa hàng mẫu', 'PENDING'
FROM generate_series(1, 30) AS g;

INSERT INTO kph_photos (
    id, kph_record_id, ordinal, original_storage_key, stamped_storage_key,
    content_type, original_size_bytes, stamped_size_bytes,
    original_sha256, stamped_sha256, captured_at, created_at
)
SELECT
    md5('kphon02-paging-photo-' || g)::uuid,
    md5('kphon02-paging-record-' || g)::uuid,
    1,
    'kphon02-paging/' || g || '.original.jpg',
    'kphon02-paging/' || g || '.stamped.jpg',
    'image/jpeg', 219, 219,
    'fd52e2f512959df53ee49dc1e93ea6a4436190bfe55cd7bfc1a7a3f737326608',
    'fd52e2f512959df53ee49dc1e93ea6a4436190bfe55cd7bfc1a7a3f737326608',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second'
FROM generate_series(1, 30) AS g;

COMMIT;
