-- Run only in the disposable, seeded coopfood_kph_e2e database.
-- Temporary tables preserve record/photo widths and indexes without touching app rows.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'coopfood_kph_e2e' THEN
    RAISE EXCEPTION 'Synthetic acceptance database required';
  END IF;
END $$;
BEGIN;
CREATE TEMP TABLE bench_records (LIKE kph_records INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE bench_photos (LIKE kph_photos INCLUDING ALL) ON COMMIT DROP;
INSERT INTO bench_records
SELECT (jsonb_populate_record(NULL::kph_records, to_jsonb(seed) || jsonb_build_object(
  'id', gen_random_uuid(), 'quantity', n, 'created_at', timestamptz '2026-09-23 00:00:00+07' + n * interval '1 second'
))).*
FROM (SELECT * FROM kph_records WHERE type = 'TPTS' LIMIT 1) seed
CROSS JOIN generate_series(1, 20000) n;
INSERT INTO bench_photos
SELECT (jsonb_populate_record(NULL::kph_photos, to_jsonb(seed) || jsonb_build_object(
  'id', gen_random_uuid(), 'kph_record_id', r.id, 'ordinal', n,
  'original_storage_key', 'synthetic-bench/' || r.id || '/' || n || '/original',
  'stamped_storage_key', 'synthetic-bench/' || r.id || '/' || n || '/stamped'
))).*
FROM (SELECT * FROM kph_photos LIMIT 1) seed
CROSS JOIN bench_records r CROSS JOIN generate_series(1, 2) n;
DO $$ BEGIN
  IF (SELECT count(*) FROM bench_records) <> 20000 OR (SELECT count(*) FROM bench_photos) <> 40000 THEN
    RAISE EXCEPTION 'Seed must contain a TPTS record and photo';
  END IF;
END $$;
ANALYZE bench_records;
ANALYZE bench_photos;
SELECT count(*) AS records FROM bench_records;
SELECT count(*) AS photos FROM bench_photos;
\echo Old join-all shape
EXPLAIN (ANALYZE, BUFFERS)
SELECT r.*, r.snapshot_store_code AS store_code, r.snapshot_store_name AS store_name,
 r.snapshot_actor_display_name AS display_name, r.snapshot_reviewer_display_name AS reviewer_display_name,
 p.ordinal AS photo_ordinal, p.stamped_storage_key, p.captured_at
FROM bench_records r JOIN bench_photos p ON p.kph_record_id = r.id
WHERE r.store_id = (SELECT store_id FROM bench_records LIMIT 1)
ORDER BY r.created_at DESC, r.id, p.ordinal;
\echo D01 count
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM bench_records r WHERE r.store_id = (SELECT store_id FROM bench_records LIMIT 1) AND r.type = 'TPTS';
\echo D01 type totals
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FILTER (WHERE type = 'TPCN'), count(*) FILTER (WHERE type = 'TPTS')
FROM bench_records r WHERE r.store_id = (SELECT store_id FROM bench_records LIMIT 1);
\echo D01 record-first page with photo fan-out afterward
EXPLAIN (ANALYZE, BUFFERS)
WITH page_records AS (
 SELECT r.* FROM bench_records r
 WHERE r.store_id = (SELECT store_id FROM bench_records LIMIT 1) AND r.type = 'TPTS'
 ORDER BY r.created_at DESC, r.id DESC LIMIT 25 OFFSET 0
)
SELECT r.*, r.snapshot_store_code AS store_code, r.snapshot_store_name AS store_name,
 r.snapshot_actor_display_name AS display_name, r.snapshot_reviewer_display_name AS reviewer_display_name,
 p.ordinal AS photo_ordinal, p.stamped_storage_key, p.captured_at
FROM page_records r JOIN bench_photos p ON p.kph_record_id = r.id
ORDER BY r.created_at DESC, r.id DESC, p.ordinal;
ROLLBACK;
