-- P03: bounded scheduling for store/region deactivation only. Execution stays
-- explicit; this table is not a generic job queue and no target is hard-deleted.

CREATE TABLE lifecycle_deactivation_schedules (
    id UUID PRIMARY KEY,
    target_type VARCHAR(16) NOT NULL
        CHECK (target_type IN ('REGION', 'STORE')),
    target_id UUID NOT NULL,
    region_target_id UUID GENERATED ALWAYS AS
        (CASE WHEN target_type = 'REGION' THEN target_id END) STORED REFERENCES regions (id),
    store_target_id UUID GENERATED ALWAYS AS
        (CASE WHEN target_type = 'STORE' THEN target_id END) STORED REFERENCES stores (id),
    effective_date DATE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'CANCELLED', 'EXECUTED')),
    reason TEXT NOT NULL
        CHECK (reason = btrim(reason) AND char_length(reason) BETWEEN 1 AND 500),
    created_by UUID NOT NULL REFERENCES app_users (id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_by UUID NOT NULL REFERENCES app_users (id),
    updated_at TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    CONSTRAINT lifecycle_schedule_terminal_timestamp CHECK (
        (status = 'SCHEDULED' AND cancelled_at IS NULL AND executed_at IS NULL)
        OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND executed_at IS NULL)
        OR (status = 'EXECUTED' AND cancelled_at IS NULL AND executed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX lifecycle_schedule_one_pending_target_idx
    ON lifecycle_deactivation_schedules (target_type, target_id)
    WHERE status = 'SCHEDULED';

CREATE INDEX lifecycle_schedule_effective_idx
    ON lifecycle_deactivation_schedules (status, effective_date, created_at);

CREATE INDEX lifecycle_schedule_target_history_idx
    ON lifecycle_deactivation_schedules (target_type, target_id, created_at DESC);
