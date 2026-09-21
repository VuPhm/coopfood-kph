package vn.coopfood.kph.identity;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.name;
import static org.jooq.impl.DSL.table;

import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.springframework.stereotype.Repository;

@Repository
class IdentityRepository {

    private static final Field<UUID> USER_ID = field(name("u", "id"), UUID.class);
    private static final Field<String> USERNAME = field(name("u", "username"), String.class);
    private static final Field<String> PASSWORD_HASH = field(name("u", "password_hash"), String.class);
    private static final Field<String> DISPLAY_NAME = field(name("u", "display_name"), String.class);

    private final DSLContext database;

    IdentityRepository(DSLContext database) {
        this.database = database;
    }

    Optional<UserCredentials> findActiveCredentials(String username) {
        return database.select(USER_ID, PASSWORD_HASH)
                .from(table(name("app_users")).as("u"))
                .where(USERNAME.eq(username).and(field(name("u", "active"), Boolean.class).isTrue()))
                .fetchOptional(record -> new UserCredentials(record.get(USER_ID), record.get(PASSWORD_HASH)));
    }

    Optional<SessionUser> findActiveUser(UUID userId) {
        var user = database.select(USER_ID, USERNAME, DISPLAY_NAME)
                .from(table(name("app_users")).as("u"))
                .where(USER_ID.eq(userId).and(field(name("u", "active"), Boolean.class).isTrue()))
                .fetchOptional();
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Set<GlobalRole> globalRoles = new LinkedHashSet<>(database
                .select(field(name("ur", "role"), String.class))
                .from(table(name("user_roles")).as("ur"))
                .where(field(name("ur", "user_id"), UUID.class).eq(userId))
                .orderBy(field(name("ur", "role"), String.class))
                .fetch(record -> GlobalRole.valueOf(record.value1())));

        List<StoreContext> stores = database
                .select(
                        field(name("s", "id"), UUID.class),
                        field(name("s", "store_code"), String.class),
                        field(name("s", "store_name"), String.class),
                        field(name("sm", "role"), String.class))
                .from(table(name("store_memberships")).as("sm"))
                .join(table(name("stores")).as("s"))
                .on(field(name("s", "id"), UUID.class).eq(field(name("sm", "store_id"), UUID.class)))
                .join(table(name("regions")).as("r"))
                .on(field(name("r", "id"), UUID.class).eq(field(name("s", "region_id"), UUID.class)))
                .where(field(name("sm", "user_id"), UUID.class).eq(userId)
                        .and(field(name("sm", "active"), Boolean.class).isTrue())
                        .and(field(name("s", "active"), Boolean.class).isTrue())
                        .and(field(name("r", "active"), Boolean.class).isTrue()))
                .orderBy(field(name("s", "store_code"), String.class), field(name("s", "id"), UUID.class))
                .fetch(record -> new StoreContext(
                        record.value1(),
                        record.value2(),
                        record.value3(),
                        StoreRole.valueOf(record.value4())));

        var row = user.orElseThrow();
        return Optional.of(new SessionUser(
                row.get(USER_ID),
                row.get(USERNAME),
                row.get(DISPLAY_NAME),
                globalRoles,
                stores));
    }

    boolean isActiveChainAdmin(UUID userId) {
        return Boolean.TRUE.equals(database.fetchValue("""
                SELECT EXISTS (
                    SELECT 1
                    FROM app_users u
                    JOIN user_roles ur ON ur.user_id = u.id
                    WHERE u.id = ? AND u.active AND ur.role = 'CHAIN_ADMIN'
                )
                """, userId));
    }

    List<AdminUserResponse> listAdminUsers() {
        Map<UUID, AdminUserBuilder> users = new LinkedHashMap<>();
        database.fetch("""
                SELECT u.id, u.username, u.display_name, u.active, ur.role
                FROM app_users u
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                ORDER BY u.username, u.id, ur.role
                """).forEach(row -> {
            UUID id = row.get("id", UUID.class);
            AdminUserBuilder builder = users.computeIfAbsent(id, ignored -> new AdminUserBuilder(
                    id,
                    row.get("username", String.class),
                    row.get("display_name", String.class),
                    Boolean.TRUE.equals(row.get("active", Boolean.class))));
            String role = row.get("role", String.class);
            if (role != null) builder.globalRoles().add(GlobalRole.valueOf(role));
        });
        return users.values().stream().map(AdminUserBuilder::response).toList();
    }

    List<UUID> lockActiveChainAdminIds() {
        return database.fetch("""
                SELECT u.id
                FROM app_users u
                JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'CHAIN_ADMIN'
                WHERE u.active
                ORDER BY u.id
                FOR UPDATE OF u
                """).getValues("id", UUID.class);
    }

    Optional<TargetUser> lockUser(UUID userId) {
        return database.fetchOptional("""
                SELECT id, username, display_name, active
                FROM app_users
                WHERE id = ?
                FOR UPDATE
                """, userId).map(row -> new TargetUser(
                        row.get("id", UUID.class),
                        row.get("username", String.class),
                        row.get("display_name", String.class),
                Boolean.TRUE.equals(row.get("active", Boolean.class))));
    }

    List<UUID> lockActiveStoresManagedBy(UUID userId) {
        return database.fetch("""
                SELECT s.id
                FROM stores s
                JOIN regions r ON r.id = s.region_id AND r.active
                JOIN store_memberships sm
                  ON sm.store_id = s.id
                 AND sm.user_id = ?
                 AND sm.active
                 AND sm.role = 'STORE_MANAGER'
                WHERE s.active
                ORDER BY s.id
                FOR UPDATE OF s, sm
                """, userId).getValues("id", UUID.class);
    }

    List<UUID> lockActiveStoreManagerIds(UUID storeId) {
        return database.fetch("""
                SELECT sm.user_id
                FROM store_memberships sm
                JOIN app_users u ON u.id = sm.user_id AND u.active
                WHERE sm.store_id = ?
                  AND sm.active
                  AND sm.role = 'STORE_MANAGER'
                ORDER BY sm.user_id
                FOR UPDATE OF sm, u
                """, storeId).getValues("user_id", UUID.class);
    }

    AdminUserResponse findAdminUser(UUID userId) {
        return listAdminUsers().stream()
                .filter(user -> user.id().equals(userId))
                .findFirst()
                .orElseThrow();
    }

    int deactivateUser(UUID userId, java.time.Instant now) {
        return database.execute(
                "UPDATE app_users SET active = FALSE, updated_at = ? WHERE id = ? AND active",
                java.sql.Timestamp.from(now), userId);
    }

    void insertUserDeactivatedAudit(UUID actorId, UUID targetId, String reason, java.time.Instant now) {
        database.execute("""
                INSERT INTO audit_events
                    (id, actor_user_id, action, target_type, target_id, metadata, occurred_at)
                VALUES (?, ?, 'USER_DEACTIVATED', 'USER', ?,
                    jsonb_build_object(
                        'reason', ?,
                        'previousActive', true,
                        'newActive', false), ?)
                """, UUID.randomUUID(), actorId, targetId, reason, java.sql.Timestamp.from(now));
    }

    private record AdminUserBuilder(
            UUID id,
            String username,
            String displayName,
            boolean active,
            Set<GlobalRole> globalRoles) {

        AdminUserBuilder(UUID id, String username, String displayName, boolean active) {
            this(id, username, displayName, active, new LinkedHashSet<>());
        }

        AdminUserResponse response() {
            return new AdminUserResponse(id, username, displayName, active, globalRoles);
        }
    }

    record TargetUser(UUID id, String username, String displayName, boolean active) {
    }

    record UserCredentials(UUID userId, String passwordHash) {
    }
}
