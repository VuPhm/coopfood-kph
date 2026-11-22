package vn.coopfood.kph.identity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Repository;

/** Active chain and regional assignments shared by read-only KPH oversight and store administration. */
@Repository
public class ManagementStoreScope {
    private final DSLContext database;

    ManagementStoreScope(DSLContext database) {
        this.database = database;
    }

    public SessionPrincipal requireActor(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal actor)) {
            throw new IdentityAdminException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
        }
        if (!hasCapability(actor)) {
            throw new IdentityAdminException(HttpStatus.FORBIDDEN, "MEMBERSHIP_ADMIN_REQUIRED", "Active chain or regional management scope is required.");
        }
        return actor;
    }

    private boolean hasCapability(SessionPrincipal actor) {
        return Boolean.TRUE.equals(database.fetchValue("""
                SELECT EXISTS (
                    SELECT 1 FROM app_users u
                    WHERE u.id = ? AND u.active AND u.credential_version = ?
                    AND (EXISTS (SELECT 1 FROM user_roles ur
                                 WHERE ur.user_id = u.id AND ur.role = 'CHAIN_ADMIN')
                        OR EXISTS (SELECT 1 FROM user_region_assignments a
                                   JOIN regions r ON r.id = a.region_id AND r.active
                                   WHERE a.user_id = u.id AND a.active))
                )
                """, actor.userId(), actor.credentialVersion()));
    }

    public static final String STORE_PROJECTION = """
            SELECT s.id, s.store_code, s.store_name, r.id AS region_id, r.region_code, r.region_name
            FROM stores s JOIN regions r ON r.id = s.region_id
            WHERE s.active AND r.active
            AND (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = ? AND ur.role = 'CHAIN_ADMIN')
                 OR EXISTS (SELECT 1 FROM user_region_assignments a
                            WHERE a.user_id = ? AND a.region_id = r.id AND a.active))
            """;

    List<MembershipStoreResponse> listStores(UUID actorId) {
        return database.fetch(STORE_PROJECTION + " ORDER BY r.region_code, s.store_code, s.id",
                actorId, actorId).map(this::store);
    }

    public Optional<MembershipStoreResponse> findStore(UUID actorId, UUID storeId) {
        return database.fetchOptional(STORE_PROJECTION + " AND s.id = ?", actorId, actorId, storeId)
                .map(this::store);
    }

    private MembershipStoreResponse store(Record row) {
        return new MembershipStoreResponse(row.get("id", UUID.class), row.get("store_code", String.class),
                row.get("store_name", String.class), row.get("region_id", UUID.class),
                row.get("region_code", String.class), row.get("region_name", String.class));
    }
}
