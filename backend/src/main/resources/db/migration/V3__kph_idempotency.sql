-- Idempotency is scoped to the authenticated actor. The record reference is
-- written in the same transaction as the KPH record and evidence metadata.
CREATE TABLE kph_idempotency_keys (
    actor_user_id UUID NOT NULL REFERENCES app_users (id),
    idempotency_key VARCHAR(128) NOT NULL
        CHECK (btrim(idempotency_key) = idempotency_key AND btrim(idempotency_key) <> ''),
    request_hash VARCHAR(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
    kph_record_id UUID NOT NULL REFERENCES kph_records (id),
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (actor_user_id, idempotency_key)
);
