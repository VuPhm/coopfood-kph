package vn.coopfood.kph.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.time.Duration;
import java.sql.Connection;
import javax.sql.DataSource;

import org.junit.jupiter.api.Timeout;

import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MembershipAdminHttpIntegrationTest {

    private static final UUID ADMIN = id(1);
    private static final UUID REGIONAL = id(2);
    private static final UUID TARGET = id(3);
    private static final UUID MANAGER_A = id(4);
    private static final UUID MANAGER_B = id(5);
    private static final UUID CATALOG = id(6);
    private static final UUID SOUTH = id(11);
    private static final UUID NORTH = id(12);
    private static final UUID STORE = id(21);
    private static final UUID OTHER_STORE = id(22);
    private static final String BASE = "/api/v1/admin/stores/";
    private static final String REASON = "{\"reason\":\"  Synthetic assignment change  \"}";

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_membership_test").withUsername("kph_test").withPassword("kph_test");

    @LocalServerPort private int port;
    @Autowired private DSLContext database;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private DataSource dataSource;

    private static String syntheticPasswordHash;

    @BeforeEach
    void seed() {
        if (syntheticPasswordHash == null) syntheticPasswordHash = passwordEncoder.encode("correct-password");
        database.execute("TRUNCATE TABLE app_users, regions, stores CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-11-09T02:00:00Z"));
        insertUser(ADMIN, "admin.demo", "Quản trị tổng hợp", now);
        insertUser(REGIONAL, "region.demo", "Quản lý vùng tổng hợp", now);
        insertUser(TARGET, "target.demo", "Nhân viên tổng hợp", now);
        insertUser(MANAGER_A, "manager.a", "Quản lý A tổng hợp", now);
        insertUser(MANAGER_B, "manager.b", "Quản lý B tổng hợp", now);
        insertUser(CATALOG, "catalog.demo", "Catalog tổng hợp", now);
        database.execute("INSERT INTO user_roles (user_id, role) VALUES (?, 'CHAIN_ADMIN'), (?, 'CATALOG_ADMIN')", ADMIN, CATALOG);
        database.execute("""
                INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
                VALUES (?, '01', 'South synthetic', TRUE, ?, ?), (?, '02', 'North synthetic', TRUE, ?, ?)
                """, SOUTH, now, now, NORTH, now, now);
        database.execute("""
                INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at)
                VALUES (?, ?, '001', 'South store synthetic', TRUE, ?, ?), (?, ?, '002', 'North store synthetic', TRUE, ?, ?)
                """, STORE, SOUTH, now, now, OTHER_STORE, NORTH, now, now);
        database.execute("""
                INSERT INTO user_region_assignments (user_id, region_id, active, created_at, updated_at)
                VALUES (?, ?, TRUE, ?, ?)
                """, REGIONAL, SOUTH, now, now);
        membership(MANAGER_A, STORE, "STORE_MANAGER");
        membership(MANAGER_B, STORE, "STORE_MANAGER");
        membership(MANAGER_B, OTHER_STORE, "STORE_MANAGER");
    }

    @Test
    void regionalLookupFindsExactOutsideRegionUserWithoutDirectoryData() throws Exception {
        var actor = login("region.demo");
        var stores = body(get(actor, "/api/v1/admin/membership-stores"), 200);
        assertThat(stores).hasSize(1);
        assertThat(stores.get(0).path("code").asText()).isEqualTo("001");
        assertThat(stores.get(0).path("regionCode").asText()).isEqualTo("01");
        // Target has neither memberships nor region assignment; lookup is an explicit owner decision.
        var found = body(post(actor, lookupPath(STORE), "{\"username\":\"  TARGET.DEMO  \"}"), 200);
        assertThat(post(actor, lookupPath(STORE), "{\"username\":\" TARGET.DEMO \"}").statusCode()).isEqualTo(200);
        assertThat(found.size()).isEqualTo(3);
        assertThat(found.path("id").asText()).isEqualTo(TARGET.toString());
        assertThat(found.path("username").asText()).isEqualTo("target.demo");
        assertThat(get(actor, "/api/v1/admin/users").statusCode()).isEqualTo(403);
        assertThat(post(actor, lookupPath(STORE), "{\"username\":\"target\"}").statusCode()).isEqualTo(404);
        assertThat(post(actor, lookupPath(STORE), "{\"username\":\"missing.demo\"}").statusCode()).isEqualTo(404);
        database.execute("UPDATE app_users SET active = FALSE WHERE id = ?", TARGET);
        assertThat(post(actor, lookupPath(STORE), "{\"username\":\"target.demo\"}").statusCode()).isEqualTo(404);
        assertThat(auditCount()).isZero();
    }

    @Test
    void everyActionDeniesValidCrossRegionIdsAndUnprivilegedRoles() throws Exception {
        var regional = login("region.demo");
        assertDenied(regional, OTHER_STORE);
        assertDenied(regional, id(999));
        for (String username : List.of("target.demo", "manager.a", "catalog.demo")) {
            var actor = login(username);
            assertThat(get(actor, "/api/v1/admin/membership-stores").statusCode()).isEqualTo(403);
            assertDenied(actor, STORE);
        }
        assertThat(auditCount()).isZero();
        assertThat(database.fetchValue("SELECT count(*) FROM store_memberships")).isEqualTo(3L);
    }

    @Test
    void chainSeesAllStoresAndRevokedAccountAndMembershipStatesStayIndependent() throws Exception {
        var actor = login("admin.demo");
        assertThat(body(get(actor, "/api/v1/admin/membership-stores"), 200)).hasSize(2);
        membership(TARGET, STORE, "EMPLOYEE");
        database.execute("UPDATE app_users SET active = FALSE WHERE id = ?", TARGET);
        var list = body(get(actor, membershipsPath(STORE)), 200);
        var target = java.util.stream.StreamSupport.stream(list.spliterator(), false)
                .filter(row -> row.path("userId").asText().equals(TARGET.toString())).findFirst().orElseThrow();
        assertThat(target.path("userActive").asBoolean()).isFalse();
        assertThat(target.path("active").asBoolean()).isTrue();
        var revoked = body(post(actor, revokePath(STORE, TARGET), REASON), 200);
        assertThat(revoked.path("userActive").asBoolean()).isFalse();
        assertThat(revoked.path("active").asBoolean()).isFalse();
        assertThat(post(actor, revokePath(STORE, TARGET), REASON).statusCode()).isEqualTo(409);
        assertThat(auditCount()).isEqualTo(1L);
    }

    @Test
    void grantRevokeChangesKphAuthorityOnTheNextRequestInTheExistingStoreSession() throws Exception {
        var admin = login("region.demo");
        var target = login("target.demo");
        String kph = "/api/v1/stores/" + STORE + "/kph";
        assertThat(get(target, kph).statusCode()).isEqualTo(403);
        assertThat(put(admin, memberPath(STORE, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(200);
        assertThat(get(target, kph).statusCode()).isEqualTo(200);
        assertThat(get(target, "/api/v1/stores/" + OTHER_STORE + "/kph").statusCode()).isEqualTo(403);
        assertThat(post(admin, revokePath(STORE, TARGET), REASON).statusCode()).isEqualTo(200);
        assertThat(get(target, kph).statusCode()).isEqualTo(403);
        assertThat(get(target, "/api/v1/auth/session").statusCode()).isEqualTo(200);
        assertThat(auditCount()).isEqualTo(2L);
    }

    @Test
    void revokeDoesNotRemoveInheritedRegionalOrChainAuthority() throws Exception {
        var admin = login("admin.demo");
        for (String username : List.of("admin.demo", "region.demo")) {
            UUID userId = username.equals("admin.demo") ? ADMIN : REGIONAL;
            var target = login(username);
            assertThat(put(admin, memberPath(STORE, userId), grant("EMPLOYEE")).statusCode()).isEqualTo(200);
            assertThat(post(admin, revokePath(STORE, userId), REASON).statusCode()).isEqualTo(200);
            assertThat(get(target, "/api/v1/stores/" + STORE + "/kph").statusCode()).isEqualTo(200);
        }
    }

    @Test
    void upsertNoOpRoleChangeAndReactivationAuditOnlyRealChanges() throws Exception {
        var admin = login("region.demo");
        assertThat(put(admin, memberPath(STORE, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(200);
        assertThat(put(admin, memberPath(STORE, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(200);
        assertThat(auditCount()).isEqualTo(1L);
        assertThat(put(admin, memberPath(STORE, TARGET), grant("STORE_MANAGER")).statusCode()).isEqualTo(200);
        assertThat(post(admin, revokePath(STORE, TARGET), REASON).statusCode()).isEqualTo(200);
        assertThat(put(admin, memberPath(STORE, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(200);
        assertThat(auditCount()).isEqualTo(4L);
        var audits = database.fetch("SELECT actor_user_id, target_id, store_id, metadata::text AS metadata FROM audit_events ORDER BY occurred_at");
        for (var audit : audits) {
            assertThat(audit.get("actor_user_id", UUID.class)).isEqualTo(REGIONAL);
            assertThat(audit.get("target_id", UUID.class)).isEqualTo(TARGET);
            assertThat(audit.get("store_id", UUID.class)).isEqualTo(STORE);
            var metadata = objectMapper.readTree(audit.get("metadata", String.class));
            assertThat(metadata.path("regionId").asText()).isEqualTo(SOUTH.toString());
            assertThat(metadata.path("reason").asText()).isEqualTo("Synthetic assignment change");
            assertThat(metadata.toString()).doesNotContain("target.demo", "Nhân viên", "correct-password", "csrfToken");
        }
        assertThat(database.fetchValue("SELECT count(*) FROM store_memberships WHERE user_id = ? AND store_id = ?", TARGET, STORE)).isEqualTo(1L);
    }

    @Test
    void rejectsInvalidInputMissingTargetsAndCsrfWithoutMutation() throws Exception {
        var admin = login("admin.demo");
        for (String role : List.of("CHAIN_ADMIN", "REGION_MANAGER", "CATALOG_ADMIN", "")) {
            assertThat(put(admin, memberPath(STORE, TARGET), grant(role)).statusCode()).isEqualTo(422);
        }
        for (String json : List.of("{}", "{\"role\":\"EMPLOYEE\",\"reason\":\"   \"}",
                "{\"role\":\"EMPLOYEE\",\"reason\":\"" + "x".repeat(501) + "\"}")) {
            assertThat(put(admin, memberPath(STORE, TARGET), json).statusCode()).isEqualTo(422);
        }
        assertThat(put(admin, memberPath(STORE, TARGET), "{\"role\":\"EMPLOYEE\",\"reason\":\"ok\",\"regionId\":\"spoof\"}").statusCode()).isEqualTo(400);
        assertThat(post(admin, lookupPath(STORE), "{\"username\":\"ab\"}").statusCode()).isEqualTo(422);
        assertThat(post(admin, lookupPath(STORE), "{\"username\":\"Ktarget.demo\"}").statusCode()).isEqualTo(422);
        assertThat(post(admin, lookupPath(STORE), "{\"username\":\"target*\"}").statusCode()).isEqualTo(422);
        assertThat(post(admin, lookupPath(STORE), "{\"username\":\"target.demo\",\"actorId\":\"spoof\"}").statusCode()).isEqualTo(400);
        assertThat(post(admin, revokePath(STORE, TARGET), "{\"reason\":null}").statusCode()).isEqualTo(422);
        assertThat(post(admin, revokePath(STORE, TARGET), "{\"reason\":\"ok\",\"active\":false}").statusCode()).isEqualTo(400);
        assertThat(put(admin, memberPath(STORE, id(999)), grant("EMPLOYEE")).statusCode()).isEqualTo(404);
        assertThat(post(admin, revokePath(STORE, TARGET), REASON).statusCode()).isEqualTo(404);
        database.execute("UPDATE app_users SET active = FALSE WHERE id = ?", TARGET);
        assertThat(put(admin, memberPath(STORE, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(404);
        for (String path : List.of(lookupPath(STORE), revokePath(STORE, TARGET))) {
            assertThat(admin.client().send(request(path).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(REASON)).build(), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
        }
        assertThat(admin.client().send(request(memberPath(STORE, TARGET)).header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(grant("EMPLOYEE"))).build(), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
        assertThat(auditCount()).isZero();
    }

    @Test
    void inactiveStoreAndRevokedRegionAssignmentDenyEvenKnownIds() throws Exception {
        var admin = login("admin.demo");
        var regional = login("region.demo");
        database.execute("UPDATE stores SET active = FALSE WHERE id = ?", STORE);
        assertDenied(admin, STORE);
        assertDenied(regional, STORE);
        assertThat(body(get(regional, "/api/v1/admin/membership-stores"), 200)).isEmpty();
        database.execute("UPDATE regions SET active = FALSE WHERE id = ?", SOUTH);
        assertDenied(admin, STORE);
        database.execute("UPDATE user_region_assignments SET active = FALSE WHERE user_id = ?", REGIONAL);
        assertThat(get(regional, "/api/v1/admin/membership-stores").statusCode()).isEqualTo(403);
        assertThat(auditCount()).isZero();
    }

    @Test
    void cannotRevokeOrDowngradeTheLastActiveManager() throws Exception {
        var admin = login("admin.demo");
        database.execute("UPDATE store_memberships SET active = FALSE WHERE store_id = ? AND user_id = ?", STORE, MANAGER_B);
        assertThat(post(admin, revokePath(STORE, MANAGER_A), REASON).statusCode()).isEqualTo(409);
        assertThat(put(admin, memberPath(STORE, MANAGER_A), grant("EMPLOYEE")).statusCode()).isEqualTo(409);
        assertThat(auditCount()).isZero();
        assertThat(managerCount()).isEqualTo(1L);
    }

    @Test
    @Timeout(40)
    void simultaneousRevocationsLeaveOneManagerWithoutPartialAuditOrDeadlock() throws Exception {
        var actor = login("region.demo");
        assertRace(() -> sendAsync(actor, "POST", revokePath(STORE, MANAGER_A), REASON),
                () -> sendAsync(actor, "POST", revokePath(STORE, MANAGER_B), REASON));
    }

    @Test
    @Timeout(40)
    void simultaneousDowngradesLeaveOneManagerWithoutPartialAuditOrDeadlock() throws Exception {
        var actor = login("region.demo");
        assertRace(() -> sendAsync(actor, "PUT", memberPath(STORE, MANAGER_A), grant("EMPLOYEE")),
                () -> sendAsync(actor, "PUT", memberPath(STORE, MANAGER_B), grant("EMPLOYEE")));
    }

    @Test
    @Timeout(40)
    void membershipRevocationRacesUserDeactivationWithoutRemovingBothManagers() throws Exception {
        var admin = login("admin.demo");
        var regional = login("region.demo");
        assertRace(() -> sendAsync(admin, "POST", "/api/v1/admin/users/" + MANAGER_A + "/deactivate", REASON),
                () -> sendAsync(regional, "POST", revokePath(STORE, MANAGER_B), REASON));
    }

    @Test
    void scalarTypesRemainStrictAndReasonLengthCountsUnicodeCodePoints() throws Exception {
        var actor = login("region.demo");
        assertThat(post(actor, lookupPath(STORE), "{\"username\":123}").statusCode()).isEqualTo(400);
        assertThat(put(actor, memberPath(STORE, TARGET), "{\"role\":\"EMPLOYEE\",\"reason\":true}").statusCode()).isEqualTo(400);
        assertThat(put(actor, memberPath(STORE, TARGET), "{\"role\":123,\"reason\":\"test\"}").statusCode()).isEqualTo(400);
        assertThat(auditCount()).isZero();
        assertThat(put(actor, memberPath(STORE, TARGET), "{\"role\":\"EMPLOYEE\",\"reason\":\" \"}").statusCode()).isEqualTo(422);
        String reason = "😀".repeat(500);
        assertThat(put(actor, memberPath(STORE, TARGET), "{\"role\":\"EMPLOYEE\",\"reason\":\"" + reason + "\"}").statusCode()).isEqualTo(200);
        assertThat(put(actor, memberPath(STORE, TARGET), "{\"role\":\"EMPLOYEE\",\"reason\":\"" + reason + "😀\"}").statusCode()).isEqualTo(422);
        assertThat(auditCount()).isEqualTo(1L);
    }

    @Test
    void staleActorCredentialAndDeactivatedActorCannotMutateMemberships() throws Exception {
        var stale = login("region.demo");
        database.execute("UPDATE app_users SET credential_version = credential_version + 1 WHERE id = ?", REGIONAL);
        assertThat(get(stale, "/api/v1/admin/membership-stores").statusCode()).isEqualTo(401);
        assertThat(put(stale, memberPath(STORE, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(403);
        var fresh = login("region.demo");
        database.execute("UPDATE app_users SET active = FALSE WHERE id = ?", REGIONAL);
        assertThat(get(fresh, membershipsPath(STORE)).statusCode()).isEqualTo(401);
        assertThat(auditCount()).isZero();
    }

    @Test
    @Timeout(40)
    void lifecycleExecutionAndMembershipRevocationShareStoreLockWithoutUserLockInversion() throws Exception {
        var admin = login("admin.demo");
        var regional = login("region.demo");
        String date = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(31).toString();
        var schedule = body(post(admin, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"STORE","targetId":"%s","effectiveDate":"%s","reason":"Synthetic schedule"}
                """.formatted(STORE, date)), 201);
        UUID scheduleId = UUID.fromString(schedule.path("id").asText());
        database.execute("UPDATE lifecycle_deactivation_schedules SET effective_date = current_date - 1 WHERE id = ?", scheduleId);
        var results = overlap(() -> sendAsync(admin, "POST", "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute", REASON),
                () -> sendAsync(regional, "POST", revokePath(STORE, MANAGER_A), REASON));
        assertThat(results.get(0).statusCode()).isEqualTo(200);
        assertThat(results.get(1).statusCode()).isIn(200, 403);
        assertThat(database.fetchValue("SELECT active FROM stores WHERE id = ?", STORE)).isEqualTo(false);
        assertThat(auditCount()).isEqualTo(results.get(1).statusCode() == 200 ? 3L : 2L);
    }

    private void assertRace(java.util.function.Supplier<CompletableFuture<HttpResponse<String>>> first,
            java.util.function.Supplier<CompletableFuture<HttpResponse<String>>> second) throws Exception {
        var responses = overlap(first, second);
        assertThat(responses.stream().map(HttpResponse::statusCode).toList()).containsExactlyInAnyOrder(200, 409);
        assertThat(managerCount()).isEqualTo(1L);
        assertThat(auditCount()).isEqualTo(1L);
    }

    private List<HttpResponse<String>> overlap(java.util.function.Supplier<CompletableFuture<HttpResponse<String>>> first,
            java.util.function.Supplier<CompletableFuture<HttpResponse<String>>> second) throws Exception {
        CompletableFuture<HttpResponse<String>> a;
        CompletableFuture<HttpResponse<String>> b;
        // Force both mutations to overlap at the contended store row.
        try (Connection blocker = dataSource.getConnection()) {
            blocker.setAutoCommit(false);
            try (var lock = blocker.prepareStatement("SELECT id FROM stores WHERE id = ? FOR UPDATE")) {
                lock.setObject(1, STORE);
                lock.executeQuery().close();
            }
            a = first.get();
            b = second.get();
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(8);
            int waiting = 0;
            while (System.nanoTime() < deadline && waiting < 2) {
                waiting = database.fetchOne("""
                        SELECT count(*) FROM pg_stat_activity
                        WHERE datname = current_database() AND wait_event_type = 'Lock'
                          AND query ILIKE '%stores%'
                        """).get(0, Integer.class);
                if (waiting < 2) Thread.sleep(25);
            }
            assertThat(waiting).as("both mutations reached the contended store lock").isGreaterThanOrEqualTo(2);
            blocker.commit();
        }
        return List.of(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
    }

    private void assertDenied(AuthenticatedClient actor, UUID storeId) throws Exception {
        assertThat(get(actor, membershipsPath(storeId)).statusCode()).isEqualTo(403);
        assertThat(post(actor, lookupPath(storeId), "{\"username\":\"target.demo\"}").statusCode()).isEqualTo(403);
        assertThat(put(actor, memberPath(storeId, TARGET), grant("EMPLOYEE")).statusCode()).isEqualTo(403);
        assertThat(post(actor, revokePath(storeId, MANAGER_B), REASON).statusCode()).isEqualTo(403);
    }

    private void membership(UUID userId, UUID storeId, String role) {
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, now(), now())
                """, userId, storeId, role);
    }

    private long auditCount() {
        return database.fetchOne("SELECT count(*) FROM audit_events").get(0, Long.class);
    }

    private long managerCount() {
        return database.fetchOne("""
                SELECT count(*) FROM store_memberships sm JOIN app_users u ON u.id = sm.user_id AND u.active
                WHERE sm.store_id = ? AND sm.active AND sm.role = 'STORE_MANAGER'
                """, STORE).get(0, Long.class);
    }

    private HttpResponse<String> put(AuthenticatedClient client, String path, String json) throws Exception {
        return sendAsync(client, "PUT", path, json).get(15, TimeUnit.SECONDS);
    }

    private CompletableFuture<HttpResponse<String>> sendAsync(AuthenticatedClient client, String method, String path, String json) {
        return client.client().sendAsync(request(path).header("Content-Type", "application/json")
                .header("X-CSRF-TOKEN", client.csrfToken()).method(method, HttpRequest.BodyPublishers.ofString(json)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private static UUID id(int value) { return UUID.fromString("70000000-0000-4000-8000-" + String.format("%012d", value)); }
    private static String membershipsPath(UUID store) { return BASE + store + "/memberships"; }
    private static String memberPath(UUID store, UUID user) { return membershipsPath(store) + "/" + user; }
    private static String revokePath(UUID store, UUID user) { return memberPath(store, user) + "/revoke"; }
    private static String lookupPath(UUID store) { return BASE + store + "/membership-user-lookup"; }
    private static String grant(String role) { return "{\"role\":\"" + role + "\",\"reason\":\"  Synthetic assignment change  \"}"; }

    private AuthenticatedClient login(String username) throws Exception {
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();
        HttpResponse<String> response = rawLogin(username, client);
        JsonNode payload = body(response, 200);
        return new AuthenticatedClient(client, payload.path("csrfToken").asText());
    }

    private HttpResponse<String> rawLogin(String username) throws Exception {
        return rawLogin(username, HttpClient.newHttpClient());
    }

    private HttpResponse<String> rawLogin(String username, HttpClient client) throws Exception {
        return rawLogin(username, "correct-password", client);
    }

    private HttpResponse<String> rawLogin(String username, String password, HttpClient client) throws Exception {
        return client.send(request("/api/v1/auth/login")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"username":"%s","password":"%s"}
                        """.formatted(username, password)))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(AuthenticatedClient client, String path) throws Exception {
        return client.client().send(request(path).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(AuthenticatedClient client, String path, String json) throws Exception {
        return client.client().send(request(path)
                .header("Content-Type", "application/json")
                .header("X-CSRF-TOKEN", client.csrfToken())
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode body(HttpResponse<String> response, int expectedStatus) throws Exception {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(expectedStatus);
        return objectMapper.readTree(response.body());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).timeout(Duration.ofSeconds(15));
    }

    private void insertUser(UUID id, String username, String displayName, Timestamp now) {
        database.execute("""
                INSERT INTO app_users
                    (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, TRUE, ?, ?)
                """, id, username, syntheticPasswordHash, displayName, now, now);
    }

    private record AuthenticatedClient(HttpClient client, String csrfToken) {
    }
}
