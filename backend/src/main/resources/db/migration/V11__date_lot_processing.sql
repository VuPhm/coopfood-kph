ALTER TABLE date_lots
    ADD COLUMN processed_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (processed_quantity >= 0),
    ADD COLUMN kph_type TEXT CHECK (kph_type IN ('TPCN', 'TPTS')),
    ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (processing_status IN ('OPEN', 'RESOLVED')),
    ADD CONSTRAINT date_lot_processed_within_tracked CHECK (processed_quantity <= tracked_quantity),
    ADD CONSTRAINT date_lot_resolved_exact CHECK ((processing_status = 'RESOLVED') = (processed_quantity = tracked_quantity)),
    ADD CONSTRAINT date_lots_store_id_unique UNIQUE (store_id, id);
ALTER TABLE kph_records ADD CONSTRAINT kph_records_store_id_unique UNIQUE (store_id, id);

CREATE TABLE date_lot_processing_links (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id),
    lot_id UUID NOT NULL REFERENCES date_lots(id),
    kph_record_id UUID NOT NULL UNIQUE REFERENCES kph_records(id),
    actor_id UUID NOT NULL REFERENCES app_users(id),
    actor_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (unit IN ('EA', 'kg')),
    source_version BIGINT NOT NULL CHECK (source_version > 0),
    resulting_version BIGINT NOT NULL CHECK (resulting_version > source_version),
    remaining_after NUMERIC NOT NULL CHECK (remaining_after >= 0),
    processed_at TIMESTAMPTZ NOT NULL,
    source_snapshot JSONB NOT NULL,
    UNIQUE (lot_id, source_version),
    FOREIGN KEY (store_id, lot_id) REFERENCES date_lots(store_id, id)
    ,FOREIGN KEY (store_id, kph_record_id) REFERENCES kph_records(store_id, id)
);
CREATE INDEX date_lot_processing_history_idx ON date_lot_processing_links(lot_id, source_version);

CREATE TABLE date_lot_process_receipts (
    store_id UUID NOT NULL REFERENCES stores(id),
    lot_id UUID NOT NULL REFERENCES date_lots(id),
    actor_id UUID NOT NULL REFERENCES app_users(id),
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    kph_record_id UUID NOT NULL REFERENCES kph_records(id),
    response JSONB NOT NULL,
    PRIMARY KEY (store_id, lot_id, actor_id, idempotency_key)
);
