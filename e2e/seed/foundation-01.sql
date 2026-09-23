-- Synthetic local-only seed for Foundation-01 browser acceptance.
-- This file is applied only by e2e/scripts/seed-foundation-01.sh, which refuses
-- database URLs outside the documented loopback E2E database.
--
-- Passwords are intentionally development credentials and are not application
-- defaults. The backend has no production bootstrap user.

BEGIN;

TRUNCATE TABLE app_users, regions, stores, catalog_import_batches CASCADE;

INSERT INTO app_users (
    id, username, password_hash, display_name, active, created_at, updated_at
) VALUES
    (
        '10000000-0000-4000-8000-000000000001',
        'manager.e2e',
        '$2y$10$TQDEalnScZ/u4pHkxmVkVe3jCVwfX41AS.2VbyMKL9P2jGfFt9Oh6',
        'Quản lý E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '10000000-0000-4000-8000-000000000002',
        'employee.e2e',
        '$2y$10$laKn7o3F0BsWpulpBBLup.ihAuy0hW5Upd4LGaO.E8ZCT.XEa6OOO',
        'Nhân viên E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '10000000-0000-4000-8000-000000000004',
        'region-manager.e2e',
        '$2y$10$TQDEalnScZ/u4pHkxmVkVe3jCVwfX41AS.2VbyMKL9P2jGfFt9Oh6',
        'Quản lý vùng E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '10000000-0000-4000-8000-000000000003',
        'chain-admin.e2e',
        '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6',
        'Chain admin E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    );

INSERT INTO user_roles (user_id, role)
VALUES ('10000000-0000-4000-8000-000000000003', 'CHAIN_ADMIN');

INSERT INTO regions (
    id, region_code, region_name, active, created_at, updated_at
) VALUES
    (
        '21000000-0000-4000-8000-000000000001',
        'E2E-A',
        'Vùng A E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '21000000-0000-4000-8000-000000000002',
        'E2E-B',
        'Vùng B E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    );

INSERT INTO stores (
    id, region_id, store_code, store_name, active, created_at, updated_at
) VALUES
    (
        '20000000-0000-4000-8000-000000000001',
        '21000000-0000-4000-8000-000000000001',
        '0001',
        'Nguyễn Kiệm E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        '21000000-0000-4000-8000-000000000001',
        '0002',
        'Store Hai E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '20000000-0000-4000-8000-000000000003',
        '21000000-0000-4000-8000-000000000002',
        '0003',
        'Store Ngoài Scope E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    );

INSERT INTO store_memberships (
    user_id, store_id, role, active, created_at, updated_at
) VALUES
    (
        '10000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000001',
        'STORE_MANAGER',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '10000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000002',
        'STORE_MANAGER',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '10000000-0000-4000-8000-000000000002',
        '20000000-0000-4000-8000-000000000001',
        'EMPLOYEE',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    );

INSERT INTO user_region_assignments (
    user_id, region_id, active, created_at, updated_at
) VALUES (
    '10000000-0000-4000-8000-000000000004',
    '21000000-0000-4000-8000-000000000001',
    TRUE,
    '2026-09-09 00:00:00+07',
    '2026-09-09 00:00:00+07'
);

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
        'SKU-E2E-0001',
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
        'NCC-E2E-01',
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
    md5('foundation-paging-record-' || g)::uuid,
    '20000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    'TPTS', DATE '2026-09-01' + (g % 5), NULL, 1000 + g, 'EA',
    'BRUISED_WATERLOGGED', NULL, 'CANCEL', NULL,
    '9900000' || lpad(g::text, 6, '0'), 'NOT_FOUND',
    'Phiếu phân trang E2E ' || lpad(g::text, 2, '0'),
    'NCC phân trang E2E', 'SUBMITTED',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second',
    '0001', 'Nguyễn Kiệm E2E', 'Quản lý E2E', 'PENDING'
FROM generate_series(1, 30) AS g;

INSERT INTO kph_photos (
    id, kph_record_id, ordinal, original_storage_key, stamped_storage_key,
    content_type, original_size_bytes, stamped_size_bytes,
    original_sha256, stamped_sha256, captured_at, created_at
)
SELECT
    md5('foundation-paging-photo-' || g)::uuid,
    md5('foundation-paging-record-' || g)::uuid,
    1,
    'foundation-paging/' || g || '.original.jpg',
    'foundation-paging/' || g || '.stamped.jpg',
    'image/jpeg', 219, 219,
    'fd52e2f512959df53ee49dc1e93ea6a4436190bfe55cd7bfc1a7a3f737326608',
    'fd52e2f512959df53ee49dc1e93ea6a4436190bfe55cd7bfc1a7a3f737326608',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second',
    TIMESTAMPTZ '2026-09-10 08:00:00+07' + g * interval '1 second'
FROM generate_series(1, 30) AS g;

COMMIT;
