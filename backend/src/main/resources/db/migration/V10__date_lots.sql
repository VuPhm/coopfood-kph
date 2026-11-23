CREATE TABLE date_lots (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id),
    lot_code TEXT,
    barcode TEXT,
    lookup_status TEXT NOT NULL CHECK (lookup_status IN ('MANUAL', 'FOUND', 'NOT_FOUND')),
    sku_code TEXT NOT NULL CHECK (btrim(sku_code) <> ''),
    product_name TEXT NOT NULL CHECK (btrim(product_name) <> ''),
    catalog_version_id UUID,
    product_id UUID,
    supplier_code TEXT,
    supplier_name TEXT,
    manufactured_on DATE,
    expires_on DATE NOT NULL CHECK (manufactured_on IS NULL OR expires_on > manufactured_on),
    tracked_quantity NUMERIC NOT NULL CHECK (tracked_quantity > 0),
    unit TEXT NOT NULL CHECK (unit IN ('EA', 'kg') AND (unit <> 'EA' OR tracked_quantity = trunc(tracked_quantity))),
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_by UUID NOT NULL REFERENCES app_users(id),
    created_by_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by UUID NOT NULL REFERENCES app_users(id),
    updated_by_name TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (product_id, catalog_version_id) REFERENCES products(id, catalog_version_id),
    CHECK ((lookup_status = 'MANUAL') = (barcode IS NULL)),
    CHECK ((lookup_status = 'FOUND') = (product_id IS NOT NULL)),
    CHECK ((product_id IS NULL) = (catalog_version_id IS NULL))
);

CREATE INDEX date_lots_store_expiry_idx ON date_lots(store_id, expires_on, id);
CREATE INDEX date_lots_store_sku_idx ON date_lots(store_id, sku_code, updated_at DESC);

CREATE TABLE date_lot_create_receipts (
    store_id UUID NOT NULL REFERENCES stores(id),
    actor_id UUID NOT NULL REFERENCES app_users(id),
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    lot_id UUID NOT NULL REFERENCES date_lots(id),
    response JSONB NOT NULL,
    PRIMARY KEY (store_id, actor_id, idempotency_key)
);
