package vn.coopfood.kph.store;

import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import vn.coopfood.kph.identity.StoreRole;

@Repository
class StoreAccessRepository {

    private final DSLContext database;

    StoreAccessRepository(DSLContext database) {
        this.database = database;
    }

    Optional<AccessSnapshot> findActiveAccess(UUID userId, UUID storeId) {
        return database.fetchOptional("""
                SELECT s.id, s.store_code, s.store_name, sm.role,
                       EXISTS (
                           SELECT 1
                           FROM user_roles ur
                           WHERE ur.user_id = ?
                             AND ur.role = 'CHAIN_ADMIN'
                       ) AS chain_admin,
                       EXISTS (
                           SELECT 1
                           FROM user_region_assignments ura
                           WHERE ura.user_id = ?
                             AND ura.region_id = s.region_id
                             AND ura.active
                       ) AS region_manager
                FROM stores s
                JOIN regions r ON r.id = s.region_id AND r.active
                LEFT JOIN store_memberships sm
                  ON sm.store_id = s.id
                 AND sm.user_id = ?
                 AND sm.active
                WHERE s.id = ?
                  AND s.active
                """, userId, userId, userId, storeId)
                .map(row -> new AccessSnapshot(
                        row.get("id", UUID.class),
                        row.get("store_code", String.class),
                        row.get("store_name", String.class),
                        row.get("role", String.class) == null
                                ? null
                                : StoreRole.valueOf(row.get("role", String.class)),
                        Boolean.TRUE.equals(row.get("region_manager", Boolean.class)),
                        Boolean.TRUE.equals(row.get("chain_admin", Boolean.class))));
    }

    record AccessSnapshot(
            UUID storeId,
            String storeCode,
            String storeName,
            StoreRole membershipRole,
            boolean regionManager,
            boolean chainAdmin) {
    }
}
