ALTER TABLE kph_records
    ADD COLUMN approval_status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
        CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    ADD COLUMN reviewed_by UUID REFERENCES app_users (id),
    ADD COLUMN reviewed_at TIMESTAMPTZ,
    ADD COLUMN snapshot_reviewer_display_name TEXT,
    ADD CONSTRAINT kph_records_review_consistency CHECK (
        (approval_status = 'PENDING'
            AND reviewed_by IS NULL
            AND reviewed_at IS NULL
            AND snapshot_reviewer_display_name IS NULL)
        OR
        (approval_status IN ('APPROVED', 'REJECTED')
            AND reviewed_by IS NOT NULL
            AND reviewed_at IS NOT NULL
            AND snapshot_reviewer_display_name IS NOT NULL
            AND btrim(snapshot_reviewer_display_name) <> '')
    );

CREATE INDEX kph_records_store_detected_idx
    ON kph_records (store_id, detected_date DESC, created_at DESC);

CREATE TABLE kph_approval_history (
    id UUID PRIMARY KEY,
    kph_record_id UUID NOT NULL REFERENCES kph_records (id),
    from_status VARCHAR(16) NOT NULL
        CHECK (from_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    to_status VARCHAR(16) NOT NULL
        CHECK (to_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    changed_by UUID NOT NULL REFERENCES app_users (id),
    snapshot_reviewer_display_name TEXT NOT NULL
        CHECK (btrim(snapshot_reviewer_display_name) <> ''),
    changed_at TIMESTAMPTZ NOT NULL,
    CHECK (from_status <> to_status)
);

CREATE INDEX kph_approval_history_record_idx
    ON kph_approval_history (kph_record_id, changed_at);
