-- Keep the store and actor presentation values that were visible at creation
-- time; current profile tables remain the authorization source.
ALTER TABLE kph_records
    ADD COLUMN snapshot_store_code TEXT,
    ADD COLUMN snapshot_store_name TEXT,
    ADD COLUMN snapshot_actor_display_name TEXT;

UPDATE kph_records r
SET snapshot_store_code = s.store_code,
    snapshot_store_name = s.store_name,
    snapshot_actor_display_name = u.display_name
FROM stores s, app_users u
WHERE s.id = r.store_id
  AND u.id = r.created_by;

ALTER TABLE kph_records
    ALTER COLUMN snapshot_store_code SET NOT NULL,
    ALTER COLUMN snapshot_store_name SET NOT NULL,
    ALTER COLUMN snapshot_actor_display_name SET NOT NULL,
    ADD CONSTRAINT kph_records_snapshot_store_code_check CHECK (btrim(snapshot_store_code) <> ''),
    ADD CONSTRAINT kph_records_snapshot_store_name_check CHECK (btrim(snapshot_store_name) <> ''),
    ADD CONSTRAINT kph_records_snapshot_actor_name_check CHECK (btrim(snapshot_actor_display_name) <> '');
