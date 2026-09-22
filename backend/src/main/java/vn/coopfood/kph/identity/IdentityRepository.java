package vn.coopfood.kph.identity;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.name;
import static org.jooq.impl.DSL.table;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
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
    private static final Field<Long> CREDENTIAL_VERSION = field(name("u", "credential_version"), Long.class);

    private final DSLContext database;

    IdentityRepository(DSLContext database) {
        this.database = database;
    }

    Optional<UserCredentials> findActiveCredentials(String username) {
        return database.select(USER_ID, PASSWORD_HASH, CREDENTIAL_VERSION)
                .from(table(name("app_users")).as("u"))
                .where(USERNAME.eq(username).and(field(name("u", "active"), Boolean.class).isTrue()))
                .fetchOptional(record -> new UserCredentials(
                        record.get(USER_ID), record.get(PASSWORD_HASH), record.get(CREDENTIAL_VERSION)));
    }

    Optional<UserCredentials> lockActiveCredentials(UUID userId) {
        return database.select(USER_ID, PASSWORD_HASH, CREDENTIAL_VERSION)
                .from(table(name("app_users")).as("u"))
                .where(USER_ID.eq(userId).and(field(name("u", "active"), Boolean.class).isTrue()))
                .forUpdate()
                .fetchOptional(record -> new UserCredentials(
                        record.get(USER_ID), record.get(PASSWORD_HASH), record.get(CREDENTIAL_VERSION)));
    }

    Optional<Long> findActiveCredentialVersion(UUID userId) {
        return database.select(CREDENTIAL_VERSION)
                .from(table(name("app_users")).as("u"))
                .where(USER_ID.eq(userId).and(field(name("u", "active"), Boolean.class).isTrue()))
                .fetchOptional(CREDENTIAL_VERSION);
    }

    void updatePassword(
            UUID userId,
            long expectedVersion,
            String passwordHash,
            long nextVersion,
            Instant now) {
        int updated = database.execute("""
                UPDATE app_users
                SET password_hash = ?, credential_version = ?, updated_at = ?
                WHERE id = ? AND active = TRUE AND credential_version = ?
                """, passwordHash, nextVersion, Timestamp.from(now), userId, expectedVersion);
        if (updated != 1) {
            throw new IllegalStateException("Credential changed concurrently.");
        }
    }

    void insertCredentialChangedAudit(UUID actorId, long credentialVersion, Instant now) {
        database.execute("""
                INSERT INTO audit_events (
                    id, actor_user_id, action, target_type, target_id, metadata, occurred_at)
                VALUES (?, ?, 'CREDENTIAL_CHANGED', 'USER', ?,
                    jsonb_build_object('credentialVersion', ?), ?)
                """, UUID.randomUUID(), actorId, actorId, credentialVersion, Timestamp.from(now));
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

    record UserCredentials(UUID userId, String passwordHash, long credentialVersion) {
    }
}
