CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type_created_at ON events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_account_id_created_at ON events (account_id, created_at DESC);
