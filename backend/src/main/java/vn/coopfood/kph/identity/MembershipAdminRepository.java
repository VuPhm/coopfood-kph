package vn.coopfood.kph.identity;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

@Repository
class MembershipAdminRepository {
    private final DSLContext database;

    MembershipAdminRepository(DSLContext database) {
        this.database = database;
    }

    void lockStore(UUID storeId) {
        // User target -> store. Region activity is protected by the active-store FK.
        // Scope is read again in a separate statement after this lock is acquired.
        database.fetch("SELECT id FROM stores WHERE id = ? FOR UPDATE", storeId);
    }

    List<StoreMembershipResponse> listMemberships(UUID storeId) {
        return database.fetch("""
                SELECT sm.user_id, u.username, u.display_name, u.active AS user_active, sm.role, sm.active
                FROM store_memberships sm JOIN app_users u ON u.id = sm.user_id
                WHERE sm.store_id = ? ORDER BY u.username, sm.user_id
                """, storeId).map(this::membership);
    }

    Optional<StoreMembershipResponse> findMembership(UUID storeId, UUID userId) {
        return database.fetchOptional("""
                SELECT sm.user_id, u.username, u.display_name, u.active AS user_active, sm.role, sm.active
                FROM store_memberships sm JOIN app_users u ON u.id = sm.user_id
                WHERE sm.store_id = ? AND sm.user_id = ?
                """, storeId, userId).map(this::membership);
    }

    Optional<MembershipLookupUserResponse> lookup(String username) {
        return database.fetchOptional("SELECT id, username, display_name FROM app_users WHERE username = ? AND active",
                username).map(row -> new MembershipLookupUserResponse(row.get("id", UUID.class),
                        row.get("username", String.class), row.get("display_name", String.class)));
    }

    void upsert(UUID storeId, UUID userId, StoreRole role, Instant now) {
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, ?, ?)
                ON CONFLICT (user_id, store_id) DO UPDATE
                SET role = EXCLUDED.role, active = TRUE, updated_at = EXCLUDED.updated_at
                """, userId, storeId, role.name(), Timestamp.from(now), Timestamp.from(now));
    }

    void revoke(UUID storeId, UUID userId, Instant now) {
        database.execute("UPDATE store_memberships SET active = FALSE, updated_at = ? WHERE user_id = ? AND store_id = ?",
                Timestamp.from(now), userId, storeId);
    }

    void audit(UUID actorId, MembershipStoreResponse store, UUID userId, String action,
            StoreMembershipResponse previous, StoreRole role, boolean active, String reason, Instant now) {
        database.execute("""
                INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, store_id, metadata, occurred_at)
                VALUES (?, ?, ?, 'STORE_MEMBERSHIP', ?, ?, jsonb_build_object(
                    'regionId', CAST(? AS text), 'reason', CAST(? AS text),
                    'previousRole', CAST(? AS text), 'newRole', CAST(? AS text),
                    'previousActive', CAST(? AS boolean), 'newActive', CAST(? AS boolean)), ?)
                """, UUID.randomUUID(), actorId, action, userId, store.id(), store.regionId().toString(), reason,
                previous == null ? null : previous.role().name(), role.name(),
                previous == null ? null : previous.active(), active, Timestamp.from(now));
    }

    private StoreMembershipResponse membership(Record row) {
        return new StoreMembershipResponse(row.get("user_id", UUID.class), row.get("username", String.class),
                row.get("display_name", String.class), Boolean.TRUE.equals(row.get("user_active", Boolean.class)),
                StoreRole.valueOf(row.get("role", String.class)), Boolean.TRUE.equals(row.get("active", Boolean.class)));
    }
}
