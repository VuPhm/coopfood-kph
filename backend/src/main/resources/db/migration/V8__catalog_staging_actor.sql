-- C01 records the authenticated catalog operator for every new staging batch.
-- Existing foundation/demo batches remain nullable because their actor cannot be
-- reconstructed safely during an upgrade.

ALTER TABLE catalog_import_batches
    ADD COLUMN created_by UUID REFERENCES app_users (id);

CREATE INDEX catalog_import_batches_created_idx
    ON catalog_import_batches (created_at DESC, id DESC);
