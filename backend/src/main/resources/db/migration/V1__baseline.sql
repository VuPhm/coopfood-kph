-- Clean baseline for the new product. PostgreSQL owns relational integrity;
-- application services still own authorization and state-transition policy.

-- Identity and stores -------------------------------------------------------

CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL CHECK (username = btrim(username) AND username <> ''),
    password_hash TEXT NOT NULL CHECK (btrim(password_hash) <> ''),
    display_name TEXT NOT NULL CHECK (btrim(display_name) <> ''),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (username)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES app_users (id),
    role VARCHAR(32) NOT NULL CHECK (role IN ('CATALOG_ADMIN', 'CHAIN_ADMIN')),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE stores (
    id UUID PRIMARY KEY,
    store_code TEXT NOT NULL CHECK (store_code = btrim(store_code) AND store_code <> ''),
    store_name TEXT NOT NULL CHECK (btrim(store_name) <> ''),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (store_code)
);

CREATE TABLE store_memberships (
    user_id UUID NOT NULL REFERENCES app_users (id),
    store_id UUID NOT NULL REFERENCES stores (id),
    role VARCHAR(32) NOT NULL CHECK (role IN ('EMPLOYEE', 'STORE_MANAGER')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, store_id)
);

CREATE INDEX store_memberships_store_idx
    ON store_memberships (store_id, active);

-- Catalog staging and published versions ----------------------------------

CREATE TABLE catalog_import_batches (
    id UUID PRIMARY KEY,
    checksum_sha256 VARCHAR(64) NOT NULL UNIQUE
        CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
    original_filename TEXT NOT NULL CHECK (btrim(original_filename) <> ''),
    content_type TEXT,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    status VARCHAR(16) NOT NULL
        CHECK (status IN ('STAGED', 'VALIDATED', 'PUBLISHED', 'REJECTED')),
    validation_error_count INTEGER NOT NULL DEFAULT 0
        CHECK (validation_error_count >= 0),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ
);

CREATE TABLE catalog_import_rows (
    batch_id UUID NOT NULL REFERENCES catalog_import_batches (id),
    row_number INTEGER NOT NULL CHECK (row_number > 0),
    raw_payload JSONB NOT NULL,
    normalized_payload JSONB,
    validation_messages JSONB NOT NULL DEFAULT '[]'::JSONB
        CHECK (jsonb_typeof(validation_messages) = 'array'),
    status VARCHAR(16) NOT NULL CHECK (status IN ('VALID', 'WARNING', 'ERROR')),
    PRIMARY KEY (batch_id, row_number)
);

CREATE TABLE catalog_versions (
    id UUID PRIMARY KEY,
    version_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    source_batch_id UUID NOT NULL UNIQUE REFERENCES catalog_import_batches (id),
    status VARCHAR(16) NOT NULL CHECK (status IN ('PUBLISHED', 'RETIRED')),
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    CHECK (status = 'PUBLISHED' OR NOT is_current)
);

CREATE UNIQUE INDEX catalog_versions_one_current_idx
    ON catalog_versions (is_current)
    WHERE is_current;

CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    catalog_version_id UUID NOT NULL REFERENCES catalog_versions (id),
    supplier_code TEXT NOT NULL
        CHECK (supplier_code = btrim(supplier_code) AND supplier_code <> ''),
    supplier_name TEXT NOT NULL CHECK (btrim(supplier_name) <> ''),
    UNIQUE (catalog_version_id, id),
    UNIQUE (catalog_version_id, supplier_code)
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    catalog_version_id UUID NOT NULL REFERENCES catalog_versions (id),
    sku_code TEXT NOT NULL CHECK (sku_code = btrim(sku_code) AND sku_code <> ''),
    product_name TEXT NOT NULL CHECK (btrim(product_name) <> ''),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (catalog_version_id, id),
    UNIQUE (catalog_version_id, sku_code)
);

CREATE TABLE product_suppliers (
    product_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    catalog_version_id UUID NOT NULL REFERENCES catalog_versions (id),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, supplier_id),
    FOREIGN KEY (product_id, catalog_version_id)
        REFERENCES products (id, catalog_version_id),
    FOREIGN KEY (supplier_id, catalog_version_id)
        REFERENCES suppliers (id, catalog_version_id)
);

CREATE UNIQUE INDEX product_suppliers_one_primary_idx
    ON product_suppliers (product_id)
    WHERE is_primary;

CREATE TABLE product_barcodes (
    product_id UUID NOT NULL,
    catalog_version_id UUID NOT NULL REFERENCES catalog_versions (id),
    barcode TEXT NOT NULL CHECK (barcode = btrim(barcode) AND barcode <> ''),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (product_id, barcode),
    FOREIGN KEY (product_id, catalog_version_id)
        REFERENCES products (id, catalog_version_id)
);

-- Historical mappings can remain, but lookup can resolve an active barcode to
-- at most one active mapping in a given published catalog version.
CREATE UNIQUE INDEX product_barcodes_one_active_idx
    ON product_barcodes (catalog_version_id, barcode)
    WHERE active;

-- KPH records and evidence --------------------------------------------------

CREATE TABLE kph_records (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores (id),
    created_by UUID NOT NULL REFERENCES app_users (id),
    type VARCHAR(8) NOT NULL CHECK (type IN ('TPCN', 'TPTS')),
    detected_date DATE NOT NULL,
    processed_date DATE,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(8) NOT NULL CHECK (unit IN ('EA', 'KG')),
    condition_code VARCHAR(32) NOT NULL
        CHECK (condition_code IN ('DAMAGED', 'NEAR_EXPIRY', 'EXPIRED', 'OTHER')),
    condition_detail TEXT,
    resolution_code VARCHAR(32) NOT NULL
        CHECK (resolution_code IN ('CANCEL', 'EXCHANGE', 'RETURN', 'OTHER')),
    resolution_detail TEXT,
    scanned_barcode TEXT
        CHECK (scanned_barcode IS NULL OR (scanned_barcode = btrim(scanned_barcode) AND scanned_barcode <> '')),
    catalog_lookup_status VARCHAR(16) NOT NULL
        CHECK (catalog_lookup_status IN ('FOUND', 'NOT_FOUND', 'MANUAL')),
    catalog_product_id UUID,
    catalog_version_id UUID,
    snapshot_sku_code TEXT,
    snapshot_product_name TEXT,
    snapshot_supplier_code TEXT,
    snapshot_supplier_name TEXT,
    note TEXT,
    lifecycle_state VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (lifecycle_state IN ('SUBMITTED', 'INVALIDATED')),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (catalog_product_id, catalog_version_id)
        REFERENCES products (id, catalog_version_id),
    CHECK (
        (type = 'TPCN'
            AND condition_code IN ('NEAR_EXPIRY', 'EXPIRED', 'OTHER')
            AND resolution_code IN ('CANCEL', 'EXCHANGE', 'RETURN', 'OTHER'))
        OR
        (type = 'TPTS'
            AND condition_code IN ('DAMAGED', 'NEAR_EXPIRY', 'EXPIRED', 'OTHER')
            AND resolution_code IN ('CANCEL', 'OTHER'))
    ),
    CHECK (
        scanned_barcode IS NOT NULL
        OR snapshot_sku_code IS NOT NULL
        OR snapshot_product_name IS NOT NULL
    ),
    CHECK (
        (catalog_lookup_status = 'FOUND'
            AND catalog_product_id IS NOT NULL
            AND catalog_version_id IS NOT NULL
            AND snapshot_sku_code IS NOT NULL
            AND snapshot_product_name IS NOT NULL
            AND snapshot_supplier_code IS NOT NULL
            AND snapshot_supplier_name IS NOT NULL
            AND btrim(snapshot_sku_code) <> ''
            AND btrim(snapshot_product_name) <> ''
            AND btrim(snapshot_supplier_code) <> ''
            AND btrim(snapshot_supplier_name) <> '')
        OR
        (catalog_lookup_status IN ('NOT_FOUND', 'MANUAL')
            AND catalog_product_id IS NULL
            AND catalog_version_id IS NULL)
    )
);

CREATE INDEX kph_records_store_created_idx
    ON kph_records (store_id, created_at DESC);

CREATE INDEX kph_records_creator_idx
    ON kph_records (created_by, created_at DESC);

CREATE TABLE kph_photos (
    id UUID PRIMARY KEY,
    kph_record_id UUID NOT NULL REFERENCES kph_records (id),
    ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 1 AND 3),
    original_storage_key TEXT NOT NULL UNIQUE CHECK (btrim(original_storage_key) <> ''),
    stamped_storage_key TEXT NOT NULL UNIQUE CHECK (btrim(stamped_storage_key) <> ''),
    content_type VARCHAR(64) NOT NULL CHECK (content_type = 'image/jpeg'),
    original_size_bytes BIGINT NOT NULL CHECK (original_size_bytes > 0),
    stamped_size_bytes BIGINT NOT NULL CHECK (stamped_size_bytes > 0),
    original_sha256 VARCHAR(64) NOT NULL CHECK (original_sha256 ~ '^[0-9a-f]{64}$'),
    stamped_sha256 VARCHAR(64) NOT NULL CHECK (stamped_sha256 ~ '^[0-9a-f]{64}$'),
    captured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE (kph_record_id, ordinal)
);

CREATE TABLE kph_status_history (
    id UUID PRIMARY KEY,
    kph_record_id UUID NOT NULL REFERENCES kph_records (id),
    from_state VARCHAR(16) CHECK (from_state IN ('SUBMITTED', 'INVALIDATED')),
    to_state VARCHAR(16) NOT NULL CHECK (to_state IN ('SUBMITTED', 'INVALIDATED')),
    changed_by UUID NOT NULL REFERENCES app_users (id),
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL,
    CHECK (
        (from_state IS NULL AND to_state = 'SUBMITTED')
        OR
        (from_state = 'SUBMITTED' AND to_state = 'INVALIDATED'
            AND reason IS NOT NULL AND btrim(reason) <> '')
    )
);

CREATE INDEX kph_status_history_record_idx
    ON kph_status_history (kph_record_id, changed_at);

-- Append-only application audit trail. Authorization remains a service-layer
-- concern; metadata must never contain passwords, sessions or full image data.
CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor_user_id UUID REFERENCES app_users (id),
    action VARCHAR(64) NOT NULL CHECK (btrim(action) <> ''),
    target_type VARCHAR(64) NOT NULL CHECK (btrim(target_type) <> ''),
    target_id UUID NOT NULL,
    store_id UUID REFERENCES stores (id),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB
        CHECK (jsonb_typeof(metadata) = 'object'),
    occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX audit_events_target_idx
    ON audit_events (target_type, target_id, occurred_at);

CREATE INDEX audit_events_actor_idx
    ON audit_events (actor_user_id, occurred_at);
