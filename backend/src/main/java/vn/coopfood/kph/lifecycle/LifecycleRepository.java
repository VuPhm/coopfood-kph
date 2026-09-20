package vn.coopfood.kph.lifecycle;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

@Repository
class LifecycleRepository {

    private final DSLContext database;

    LifecycleRepository(DSLContext database) {
        this.database = database;
    }

    boolean hasLifecycleCapability(UUID actorId) {
        return Boolean.TRUE.equals(database.fetchValue("""
                SELECT EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = ? AND role = 'CHAIN_ADMIN'
                ) OR EXISTS (
                    SELECT 1
                    FROM user_region_assignments ura
                    JOIN regions r ON r.id = ura.region_id AND r.active
                    WHERE ura.user_id = ? AND ura.active
                )
                """, actorId, actorId));
    }

    List<LifecycleTargetResponse> listAuthorizedTargets(UUID actorId) {
        List<LifecycleTargetResponse> targets = new ArrayList<>();
        boolean chainAdmin = isChainAdmin(actorId);
        if (chainAdmin) {
            targets.addAll(database.fetch("""
                    SELECT id, region_code, region_name
                    FROM regions
                    WHERE active
                    ORDER BY region_code, id
                    """).map(row -> new LifecycleTargetResponse(
                            LifecycleTargetType.REGION,
                            row.get("id", UUID.class),
                            row.get("region_code", String.class),
                            row.get("region_name", String.class),
                            null,
                            null,
                            null)));
        }
        targets.addAll(database.fetch("""
                SELECT s.id, s.store_code, s.store_name,
                       r.id AS region_id, r.region_code, r.region_name
                FROM stores s
                JOIN regions r ON r.id = s.region_id AND r.active
                WHERE s.active
                  AND (? OR EXISTS (
                      SELECT 1
                      FROM user_region_assignments ura
                      WHERE ura.user_id = ?
                        AND ura.region_id = r.id
                        AND ura.active
                  ))
                ORDER BY r.region_code, s.store_code, s.id
                """, chainAdmin, actorId).map(row -> new LifecycleTargetResponse(
                        LifecycleTargetType.STORE,
                        row.get("id", UUID.class),
                        row.get("store_code", String.class),
                        row.get("store_name", String.class),
                        row.get("region_id", UUID.class),
                        row.get("region_code", String.class),
                        row.get("region_name", String.class))));
        targets.sort(Comparator.comparing(LifecycleTargetResponse::type)
                .thenComparing(LifecycleTargetResponse::code)
                .thenComparing(LifecycleTargetResponse::id));
        return List.copyOf(targets);
    }

    List<LifecycleScheduleResponse> listAuthorizedSchedules(UUID actorId) {
        boolean chainAdmin = isChainAdmin(actorId);
        return mapSchedules(database.fetch(scheduleProjection() + """
                WHERE ? OR (
                    sched.target_type = 'STORE'
                    AND r.active
                    AND EXISTS (
                        SELECT 1
                        FROM user_region_assignments ura
                        WHERE ura.user_id = ?
                          AND ura.region_id = r.id
                          AND ura.active
                    )
                )
                ORDER BY sched.created_at DESC, sched.id
                """, chainAdmin, actorId));
    }

    Optional<TargetRecord> findAuthorizedTarget(
            UUID actorId, LifecycleTargetType targetType, UUID targetId) {
        if (targetType == LifecycleTargetType.REGION) {
            return database.fetchOptional("""
                    SELECT r.id, r.region_code AS code, r.region_name AS name,
                           r.active, r.id AS region_id, r.active AS region_active,
                           r.region_code, r.region_name
                    FROM regions r
                    WHERE r.id = ?
                      AND EXISTS (
                          SELECT 1 FROM user_roles
                          WHERE user_id = ? AND role = 'CHAIN_ADMIN'
                      )
                    FOR UPDATE OF r
                    """, targetId, actorId).map(row -> mapTarget(targetType, row));
        }
        return database.fetchOptional("""
                SELECT s.id, s.store_code AS code, s.store_name AS name,
                       s.active, r.id AS region_id, r.active AS region_active,
                       r.region_code, r.region_name
                FROM stores s
                JOIN regions r ON r.id = s.region_id
                WHERE s.id = ?
                  AND (
                      EXISTS (
                          SELECT 1 FROM user_roles
                          WHERE user_id = ? AND role = 'CHAIN_ADMIN'
                      )
                      OR (
                          r.active AND EXISTS (
                              SELECT 1
                              FROM user_region_assignments ura
                              WHERE ura.user_id = ?
                                AND ura.region_id = r.id
                                AND ura.active
                          )
                      )
                  )
                FOR UPDATE OF s, r
                """, targetId, actorId, actorId).map(row -> mapTarget(targetType, row));
    }

    boolean targetExists(LifecycleTargetType targetType, UUID targetId) {
        String table = targetType == LifecycleTargetType.REGION ? "regions" : "stores";
        return Boolean.TRUE.equals(database.fetchValue(
                "SELECT EXISTS (SELECT 1 FROM " + table + " WHERE id = ?)", targetId));
    }

    Optional<LifecycleScheduleResponse> findSchedule(UUID scheduleId) {
        return mapSchedules(database.fetch(scheduleProjection() + " WHERE sched.id = ?", scheduleId))
                .stream().findFirst();
    }

    Optional<LifecycleScheduleResponse> lockSchedule(UUID scheduleId) {
        return mapSchedules(database.fetch(scheduleProjection() + " WHERE sched.id = ? FOR UPDATE OF sched", scheduleId))
                .stream().findFirst();
    }

    void insertSchedule(UUID id, LifecycleTargetType targetType, UUID targetId,
            LocalDate effectiveDate, String reason, UUID actorId, Instant now) {
        database.execute("""
                INSERT INTO lifecycle_deactivation_schedules
                    (id, target_type, target_id, effective_date, status, reason,
                     created_by, created_at, updated_by, updated_at)
                VALUES (?, ?, ?, ?, 'SCHEDULED', ?, ?, ?, ?, ?)
                """, id, targetType.name(), targetId, effectiveDate, reason,
                actorId, toTimestamp(now), actorId, toTimestamp(now));
    }

    void reschedule(UUID id, LocalDate effectiveDate, String reason, UUID actorId, Instant now) {
        database.execute("""
                UPDATE lifecycle_deactivation_schedules
                SET effective_date = ?, reason = ?, updated_by = ?, updated_at = ?
                WHERE id = ? AND status = 'SCHEDULED'
                """, effectiveDate, reason, actorId, toTimestamp(now), id);
    }

    void cancel(UUID id, String reason, UUID actorId, Instant now) {
        database.execute("""
                UPDATE lifecycle_deactivation_schedules
                SET status = 'CANCELLED', reason = ?, updated_by = ?, updated_at = ?, cancelled_at = ?
                WHERE id = ? AND status = 'SCHEDULED'
                """, reason, actorId, toTimestamp(now), toTimestamp(now), id);
    }

    void markExecuted(UUID id, String reason, UUID actorId, Instant now) {
        database.execute("""
                UPDATE lifecycle_deactivation_schedules
                SET status = 'EXECUTED', reason = ?, updated_by = ?, updated_at = ?, executed_at = ?
                WHERE id = ? AND status = 'SCHEDULED'
                """, reason, actorId, toTimestamp(now), toTimestamp(now), id);
    }

    void deactivateStore(UUID storeId, Instant now) {
        database.execute("UPDATE stores SET active = FALSE, updated_at = ? WHERE id = ? AND active",
                toTimestamp(now), storeId);
    }

    void deactivateRegion(UUID regionId, Instant now) {
        database.execute("UPDATE regions SET active = FALSE, updated_at = ? WHERE id = ? AND active",
                toTimestamp(now), regionId);
    }

    int countActiveStores(UUID regionId) {
        Integer count = database.fetchOne(
                "SELECT count(*) FROM stores WHERE region_id = ? AND active", regionId)
                .get(0, Integer.class);
        return count == null ? 0 : count;
    }

    int countActiveStoreManagers(UUID storeId) {
        return database.fetch("""
                SELECT sm.user_id
                FROM store_memberships sm
                JOIN app_users u ON u.id = sm.user_id AND u.active
                WHERE sm.store_id = ?
                  AND sm.active
                  AND sm.role = 'STORE_MANAGER'
                FOR SHARE OF sm, u
                """, storeId).size();
    }

    void insertAudit(UUID actorId, String action, LifecycleTargetType targetType,
            UUID targetId, UUID storeId, UUID scheduleId, LocalDate effectiveDate,
            String reason, Instant now) {
        database.execute("""
                INSERT INTO audit_events
                    (id, actor_user_id, action, target_type, target_id, store_id, metadata, occurred_at)
                VALUES (?, ?, ?, ?, ?, ?,
                    jsonb_build_object(
                        'scheduleId', ?,
                        'effectiveDate', ?,
                        'reason', ?), ?)
                """, UUID.randomUUID(), actorId, action, targetType.name(), targetId, storeId,
                scheduleId.toString(), effectiveDate.toString(), reason, toTimestamp(now));
    }

    private boolean isChainAdmin(UUID actorId) {
        return Boolean.TRUE.equals(database.fetchValue("""
                SELECT EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = ? AND role = 'CHAIN_ADMIN'
                )
                """, actorId));
    }

    private TargetRecord mapTarget(LifecycleTargetType type, Record row) {
        return new TargetRecord(
                new LifecycleTargetResponse(
                        type,
                        row.get("id", UUID.class),
                        row.get("code", String.class),
                        row.get("name", String.class),
                        type == LifecycleTargetType.STORE ? row.get("region_id", UUID.class) : null,
                        type == LifecycleTargetType.STORE ? row.get("region_code", String.class) : null,
                        type == LifecycleTargetType.STORE ? row.get("region_name", String.class) : null),
                Boolean.TRUE.equals(row.get("active", Boolean.class)),
                Boolean.TRUE.equals(row.get("region_active", Boolean.class)));
    }

    private List<LifecycleScheduleResponse> mapSchedules(List<? extends Record> rows) {
        return rows.stream().map(row -> new LifecycleScheduleResponse(
                row.get("schedule_id", UUID.class),
                new LifecycleTargetResponse(
                        LifecycleTargetType.valueOf(row.get("target_type", String.class)),
                        row.get("target_id", UUID.class),
                        row.get("target_code", String.class),
                        row.get("target_name", String.class),
                        row.get("region_id", UUID.class),
                        row.get("region_code", String.class),
                        row.get("region_name", String.class)),
                row.get("effective_date", LocalDate.class),
                LifecycleScheduleStatus.valueOf(row.get("status", String.class)),
                row.get("reason", String.class),
                new LifecycleScheduleResponse.ActorSnapshot(
                        row.get("created_by", UUID.class), row.get("created_by_name", String.class)),
                toInstant(row.get("created_at")),
                new LifecycleScheduleResponse.ActorSnapshot(
                        row.get("updated_by", UUID.class), row.get("updated_by_name", String.class)),
                toInstant(row.get("updated_at")),
                nullableInstant(row.get("cancelled_at")),
                nullableInstant(row.get("executed_at"))))
                .toList();
    }

    private String scheduleProjection() {
        return """
                SELECT sched.id AS schedule_id, sched.target_type, sched.target_id,
                       CASE WHEN sched.target_type = 'REGION' THEN target_region.region_code ELSE s.store_code END AS target_code,
                       CASE WHEN sched.target_type = 'REGION' THEN target_region.region_name ELSE s.store_name END AS target_name,
                       CASE WHEN sched.target_type = 'STORE' THEN r.id END AS region_id,
                       CASE WHEN sched.target_type = 'STORE' THEN r.region_code END AS region_code,
                       CASE WHEN sched.target_type = 'STORE' THEN r.region_name END AS region_name,
                       sched.effective_date, sched.status, sched.reason,
                       sched.created_by, creator.display_name AS created_by_name, sched.created_at,
                       sched.updated_by, updater.display_name AS updated_by_name, sched.updated_at,
                       sched.cancelled_at, sched.executed_at
                FROM lifecycle_deactivation_schedules sched
                LEFT JOIN regions target_region
                  ON sched.target_type = 'REGION' AND target_region.id = sched.target_id
                LEFT JOIN stores s
                  ON sched.target_type = 'STORE' AND s.id = sched.target_id
                LEFT JOIN regions r ON r.id = s.region_id
                JOIN app_users creator ON creator.id = sched.created_by
                JOIN app_users updater ON updater.id = sched.updated_by
                """;
    }

    private static Instant nullableInstant(Object value) {
        return value == null ? null : toInstant(value);
    }

    private static Instant toInstant(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof OffsetDateTime offsetDateTime) return offsetDateTime.toInstant();
        if (value instanceof Timestamp timestamp) return timestamp.toInstant();
        throw new IllegalStateException("Unsupported timestamp value: " + value);
    }

    private static Timestamp toTimestamp(Instant value) {
        return Timestamp.from(value);
    }

    record TargetRecord(LifecycleTargetResponse response, boolean active, boolean regionActive) {
    }
}
