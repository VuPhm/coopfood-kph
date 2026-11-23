CREATE TABLE date_reports (
 id UUID PRIMARY KEY,
 store_id UUID NOT NULL REFERENCES stores(id),
 actor_user_id UUID NOT NULL REFERENCES app_users(id),
 idempotency_key VARCHAR(128) NOT NULL,
 request_hash VARCHAR(64) NOT NULL,
 title VARCHAR(120) NOT NULL CHECK(btrim(title)<>''),
 as_of DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL,
 snapshot_store_code VARCHAR(128) NOT NULL,
 snapshot_store_name VARCHAR(512) NOT NULL,
 snapshot_actor_name VARCHAR(255) NOT NULL,
 row_count INTEGER NOT NULL CHECK(row_count BETWEEN 1 AND 1000),
 period_start DATE NOT NULL,
 period_end DATE NOT NULL CHECK(period_start<=as_of AND as_of<=period_end),
 total_ea NUMERIC NOT NULL,
 total_kg NUMERIC NOT NULL,
 UNIQUE(actor_user_id,idempotency_key)
);
CREATE INDEX date_reports_store_history_idx ON date_reports(store_id,created_at DESC,id DESC);
CREATE TABLE date_report_rows (
 report_id UUID NOT NULL REFERENCES date_reports(id),
 ordinal INTEGER NOT NULL CHECK(ordinal>0),
 lot_id UUID NOT NULL REFERENCES date_lots(id),
 snapshot JSONB NOT NULL,
 PRIMARY KEY(report_id,ordinal),
 UNIQUE(report_id,lot_id)
);
