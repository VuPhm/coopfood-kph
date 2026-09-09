-- Synthetic local-only seed for Foundation-01 browser acceptance.
-- This file is applied only by e2e/scripts/seed-foundation-01.sh, which refuses
-- database URLs outside the documented loopback E2E database.
--
-- Passwords are intentionally development credentials and are not application
-- defaults. The backend has no production bootstrap user.

BEGIN;

TRUNCATE TABLE app_users, stores, catalog_import_batches CASCADE;

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

INSERT INTO stores (
    id, store_code, store_name, active, created_at, updated_at
) VALUES
    (
        '20000000-0000-4000-8000-000000000001',
        '0001',
        'Nguyễn Kiệm E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        '0002',
        'Store Hai E2E',
        TRUE,
        '2026-09-09 00:00:00+07',
        '2026-09-09 00:00:00+07'
    ),
    (
        '20000000-0000-4000-8000-000000000003',
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

COMMIT;
