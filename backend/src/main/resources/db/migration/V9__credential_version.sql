-- Sessions carry the version observed at login. Any credential mutation bumps
-- this value so every previously issued session is rejected on its next request.
ALTER TABLE app_users
    ADD COLUMN credential_version BIGINT NOT NULL DEFAULT 1
        CHECK (credential_version > 0);

