package vn.coopfood.kph.store;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import vn.coopfood.kph.identity.StoreRole;

@Repository
class StoreAccessRepository {

    private final DSLContext database;

    StoreAccessRepository(DSLContext database) {
        this.database = database;
    }

    private static final String ACTIVE_ACCESS_SQL = """
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
                WHERE s.active
                """;

    Optional<AccessSnapshot> findActiveAccess(UUID userId, UUID storeId) {
        return database.fetchOptional(ACTIVE_ACCESS_SQL + " AND s.id = ?",
                userId, userId, userId, storeId).map(this::snapshot);
    }

    List<AccessSnapshot> findAllActiveAccess(UUID userId) {
        return database.fetch("""
                SELECT * FROM (
                """ + ACTIVE_ACCESS_SQL + """
                ) access
                WHERE role IS NOT NULL OR region_manager OR chain_admin
                ORDER BY store_code COLLATE "C", id
                """, userId, userId, userId).map(this::snapshot);
    }

    private AccessSnapshot snapshot(Record row) {
        return new AccessSnapshot(
                row.get("id", UUID.class),
                row.get("store_code", String.class),
                row.get("store_name", String.class),
                row.get("role", String.class) == null
                        ? null
                        : StoreRole.valueOf(row.get("role", String.class)),
                Boolean.TRUE.equals(row.get("region_manager", Boolean.class)),
                Boolean.TRUE.equals(row.get("chain_admin", Boolean.class)));
    }

    record AccessSnapshot(
            UUID storeId,
            String storeCode,
            String storeName,
            StoreRole membershipRole,
            boolean regionManager,
            boolean chainAdmin) {
        boolean canViewCreate() {
            return membershipRole != null || regionManager || chainAdmin;
        }

        boolean canReviewExport() {
            return membershipRole == StoreRole.STORE_MANAGER || regionManager || chainAdmin;
        }
    }
}
