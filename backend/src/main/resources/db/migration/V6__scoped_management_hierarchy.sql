-- P02 first slice: make the store -> region relationship and regional manager
-- assignment explicit. Existing stores are backfilled into one restrictive
-- synthetic region per store so an upgrade never broadens regional access.

CREATE TABLE regions (
    id UUID PRIMARY KEY,
    region_code TEXT NOT NULL
        CHECK (region_code = btrim(region_code)
            AND char_length(region_code) BETWEEN 1 AND 32),
    region_name TEXT NOT NULL
        CHECK (region_name = btrim(region_name)
            AND char_length(region_name) BETWEEN 1 AND 160),
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (region_code)
);

ALTER TABLE stores
    ADD COLUMN region_id UUID REFERENCES regions (id);

DO $$
DECLARE
    existing_store RECORD;
    migrated_region_id UUID;
BEGIN
    FOR existing_store IN
        SELECT id, store_code, store_name, active, created_at, updated_at
        FROM stores
        ORDER BY id
    LOOP
        migrated_region_id := existing_store.id;
        INSERT INTO regions (
            id, region_code, region_name, active, created_at, updated_at)
        VALUES (
            migrated_region_id,
            replace(existing_store.id::text, '-', ''),
            left('Vùng chuyển tiếp ' || existing_store.store_code || ' - ' || existing_store.store_name, 160),
            existing_store.active,
            existing_store.created_at,
            existing_store.updated_at);
        UPDATE stores
        SET region_id = migrated_region_id
        WHERE id = existing_store.id;
    END LOOP;
END $$;

ALTER TABLE stores
    ALTER COLUMN region_id SET NOT NULL;

CREATE INDEX stores_region_idx
    ON stores (region_id, active);

CREATE TABLE user_region_assignments (
    user_id UUID NOT NULL REFERENCES app_users (id),
    region_id UUID NOT NULL REFERENCES regions (id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, region_id)
);

CREATE INDEX user_region_assignments_region_idx
    ON user_region_assignments (region_id, active);

-- A generated nullable key expresses the conditional invariant without a
-- check-then-act trigger. PostgreSQL foreign-key locking serializes store
-- activation against region deactivation across concurrent transactions.
ALTER TABLE regions
    ADD CONSTRAINT regions_id_active_key UNIQUE (id, active);

ALTER TABLE stores
    ADD COLUMN required_region_active BOOLEAN
        GENERATED ALWAYS AS (CASE WHEN active THEN TRUE ELSE NULL END) STORED,
    ADD CONSTRAINT stores_active_region_required
        FOREIGN KEY (region_id, required_region_active)
        REFERENCES regions (id, active);
