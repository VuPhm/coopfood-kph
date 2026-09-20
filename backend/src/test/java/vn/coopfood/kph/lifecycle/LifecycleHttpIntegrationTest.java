package vn.coopfood.kph.lifecycle;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

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
class LifecycleHttpIntegrationTest {

    private static final UUID CHAIN_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID REGIONAL_ID = UUID.fromString("10000000-0000-4000-8000-000000000002");
    private static final UUID MANAGER_ID = UUID.fromString("10000000-0000-4000-8000-000000000003");
    private static final UUID REGION_A = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID REGION_B = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final UUID STORE_A = UUID.fromString("30000000-0000-4000-8000-000000000001");
    private static final UUID STORE_B = UUID.fromString("30000000-0000-4000-8000-000000000002");

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_lifecycle_test")
            .withUsername("kph_test")
            .withPassword("kph_test");

    @LocalServerPort
    private int port;

    @Autowired
    private DSLContext database;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Clock clock;

    @BeforeEach
    void seed() {
        database.execute("TRUNCATE TABLE app_users, regions, stores CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-09-21T02:00:00Z"));
        insertUser(CHAIN_ID, "chain.admin", "Quản trị chuỗi", now);
        insertUser(REGIONAL_ID, "region.manager", "Quản lý vùng A", now);
        insertUser(MANAGER_ID, "store.manager", "Quản lý cửa hàng", now);
        database.execute("INSERT INTO user_roles (user_id, role) VALUES (?, 'CHAIN_ADMIN')", CHAIN_ID);
        insertRegion(REGION_A, "RA", "Vùng A", now);
        insertRegion(REGION_B, "RB", "Vùng B", now);
        insertStore(STORE_A, REGION_A, "0001", "Cửa hàng A", now);
        insertStore(STORE_B, REGION_B, "0002", "Cửa hàng B", now);
        database.execute("""
                INSERT INTO user_region_assignments (user_id, region_id, active, created_at, updated_at)
                VALUES (?, ?, TRUE, ?, ?)
                """, REGIONAL_ID, REGION_A, now, now);
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, 'STORE_MANAGER', TRUE, ?, ?), (?, ?, 'STORE_MANAGER', TRUE, ?, ?)
                """, MANAGER_ID, STORE_A, now, now, MANAGER_ID, STORE_B, now, now);
    }

    @Test
    void chainAdminSchedulesReschedulesAndCancelsWithThirtyDayBoundaryAndAudit() throws Exception {
        AuthenticatedClient chain = login("chain.admin");
        LocalDate minimum = LocalDate.now(clock).plusDays(30);

        HttpResponse<String> tooSoon = post(chain, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"STORE","targetId":"%s","effectiveDate":"%s","reason":"Too soon"}
                """.formatted(STORE_A, minimum.minusDays(1)));
        assertThat(tooSoon.statusCode()).isEqualTo(422);
        assertThat(objectMapper.readTree(tooSoon.body()).path("code").asText()).isEqualTo("EFFECTIVE_DATE_TOO_SOON");

        JsonNode created = body(post(chain, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"STORE","targetId":"%s","effectiveDate":"%s","reason":"  Kết thúc thuê  "}
                """.formatted(STORE_A, minimum)), 201);
        UUID scheduleId = UUID.fromString(created.path("id").asText());
        assertThat(created.path("reason").asText()).isEqualTo("Kết thúc thuê");
        assertThat(database.fetchValue("SELECT active FROM stores WHERE id = ?", STORE_A)).isEqualTo(true);

        HttpResponse<String> beforeDue = post(chain,
                "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute",
                "{\"reason\":\"Không được chạy sớm\"}");
        assertThat(beforeDue.statusCode()).isEqualTo(409);
        assertThat(objectMapper.readTree(beforeDue.body()).path("code").asText())
                .isEqualTo("LIFECYCLE_SCHEDULE_NOT_DUE");

        HttpResponse<String> duplicate = post(chain, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"STORE","targetId":"%s","effectiveDate":"%s","reason":"Duplicate"}
                """.formatted(STORE_A, minimum.plusDays(1)));
        assertThat(duplicate.statusCode()).isEqualTo(409);

        JsonNode rescheduled = body(put(chain, "/api/v1/admin/lifecycle/schedules/" + scheduleId, """
                {"effectiveDate":"%s","reason":"Điều chỉnh kế hoạch"}
                """.formatted(minimum.plusDays(7))), 200);
        assertThat(rescheduled.path("effectiveDate").asText()).isEqualTo(minimum.plusDays(7).toString());

        JsonNode cancelled = body(post(chain, "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/cancel", """
                {"reason":"Không còn nhu cầu"}
                """), 200);
        assertThat(cancelled.path("status").asText()).isEqualTo("CANCELLED");
        assertThat(database.fetchValue("""
                SELECT count(*) FROM audit_events
                WHERE target_id = ? AND action IN (
                    'STORE_DEACTIVATION_SCHEDULED',
                    'STORE_DEACTIVATION_RESCHEDULED',
                    'STORE_DEACTIVATION_CANCELLED')
                """, STORE_A)).isEqualTo(3L);
    }

    @Test
    void regionalManagerIsDeniedCrossRegionAndRevocationAppliesBeforeExecute() throws Exception {
        AuthenticatedClient regional = login("region.manager");
        LocalDate effectiveDate = LocalDate.now(clock).plusDays(30);

        JsonNode visibleTargets = body(get(regional, "/api/v1/admin/lifecycle/targets"), 200);
        assertThat(visibleTargets).hasSize(1);
        assertThat(visibleTargets.get(0).path("id").asText()).isEqualTo(STORE_A.toString());
        assertThat(visibleTargets.get(0).path("type").asText()).isEqualTo("STORE");

        HttpResponse<String> crossRegion = post(regional, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"STORE","targetId":"%s","effectiveDate":"%s","reason":"Ngoài vùng"}
                """.formatted(STORE_B, effectiveDate));
        assertThat(crossRegion.statusCode()).isEqualTo(403);
        assertThat(objectMapper.readTree(crossRegion.body()).path("code").asText())
                .isEqualTo("LIFECYCLE_TARGET_SCOPE_DENIED");

        JsonNode created = body(post(regional, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"STORE","targetId":"%s","effectiveDate":"%s","reason":"Đúng vùng"}
                """.formatted(STORE_A, effectiveDate)), 201);
        UUID scheduleId = UUID.fromString(created.path("id").asText());
        database.execute("UPDATE lifecycle_deactivation_schedules SET effective_date = ? WHERE id = ?",
                LocalDate.now(clock), scheduleId);
        database.execute("UPDATE user_region_assignments SET active = FALSE WHERE user_id = ? AND region_id = ?",
                REGIONAL_ID, REGION_A);

        HttpResponse<String> execute = post(regional,
                "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute",
                "{\"reason\":\"Thực thi\"}");
        assertThat(execute.statusCode()).isEqualTo(403);
        assertThat(database.fetchValue("SELECT active FROM stores WHERE id = ?", STORE_A)).isEqualTo(true);
    }

    @Test
    void executeRechecksStoreManagerAndImmediatelyRemovesChainScope() throws Exception {
        AuthenticatedClient chain = login("chain.admin");
        UUID scheduleId = createDueSchedule(chain, "STORE", STORE_A);
        database.execute("UPDATE store_memberships SET active = FALSE WHERE store_id = ?", STORE_A);

        HttpResponse<String> missingManager = post(chain,
                "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute",
                "{\"reason\":\"Thực thi đúng hạn\"}");
        assertThat(missingManager.statusCode()).isEqualTo(409);
        assertThat(objectMapper.readTree(missingManager.body()).path("code").asText())
                .isEqualTo("ACTIVE_STORE_MANAGER_REQUIRED");

        database.execute("UPDATE store_memberships SET active = TRUE WHERE store_id = ?", STORE_A);
        JsonNode executed = body(post(chain,
                "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute",
                "{\"reason\":\"Đã đối chiếu vận hành\"}"), 200);
        assertThat(executed.path("status").asText()).isEqualTo("EXECUTED");
        assertThat(database.fetchValue("SELECT active FROM stores WHERE id = ?", STORE_A)).isEqualTo(false);
        assertThat(database.fetchValue("""
                SELECT count(*) FROM audit_events
                WHERE target_id = ? AND action = 'STORE_DEACTIVATED'
                """, STORE_A)).isEqualTo(1L);

        HttpResponse<String> kphAfterExecute = chain.client().send(
                request("/api/v1/stores/" + STORE_A + "/kph").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(kphAfterExecute.statusCode()).isEqualTo(403);
    }

    @Test
    void regionExecutionConflictsUntilEveryStoreIsInactive() throws Exception {
        AuthenticatedClient chain = login("chain.admin");
        UUID scheduleId = createDueSchedule(chain, "REGION", REGION_A);

        HttpResponse<String> withActiveStore = post(chain,
                "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute",
                "{\"reason\":\"Đến ngày hiệu lực\"}");
        assertThat(withActiveStore.statusCode()).isEqualTo(409);
        assertThat(objectMapper.readTree(withActiveStore.body()).path("code").asText())
                .isEqualTo("REGION_HAS_ACTIVE_STORES");

        database.execute("UPDATE stores SET active = FALSE WHERE id = ?", STORE_A);
        JsonNode executed = body(post(chain,
                "/api/v1/admin/lifecycle/schedules/" + scheduleId + "/execute",
                "{\"reason\":\"Mọi cửa hàng đã inactive\"}"), 200);
        assertThat(executed.path("status").asText()).isEqualTo("EXECUTED");
        assertThat(database.fetchValue("SELECT active FROM regions WHERE id = ?", REGION_A)).isEqualTo(false);
    }

    private UUID createDueSchedule(AuthenticatedClient client, String targetType, UUID targetId) throws Exception {
        LocalDate effectiveDate = LocalDate.now(clock).plusDays(30);
        JsonNode created = body(post(client, "/api/v1/admin/lifecycle/schedules", """
                {"targetType":"%s","targetId":"%s","effectiveDate":"%s","reason":"Kế hoạch đã duyệt"}
                """.formatted(targetType, targetId, effectiveDate)), 201);
        UUID scheduleId = UUID.fromString(created.path("id").asText());
        database.execute("UPDATE lifecycle_deactivation_schedules SET effective_date = ? WHERE id = ?",
                LocalDate.now(clock), scheduleId);
        return scheduleId;
    }

    private AuthenticatedClient login(String username) throws Exception {
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();
        HttpResponse<String> response = client.send(
                request("/api/v1/auth/login")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("""
                                {"username":"%s","password":"correct-password"}
                                """.formatted(username)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        JsonNode payload = body(response, 200);
        return new AuthenticatedClient(client, payload.path("csrfToken").asText());
    }

    private HttpResponse<String> post(AuthenticatedClient client, String path, String json) throws Exception {
        return client.client().send(request(path)
                .header("Content-Type", "application/json")
                .header("X-CSRF-TOKEN", client.csrfToken())
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> put(AuthenticatedClient client, String path, String json) throws Exception {
        return client.client().send(request(path)
                .header("Content-Type", "application/json")
                .header("X-CSRF-TOKEN", client.csrfToken())
                .PUT(HttpRequest.BodyPublishers.ofString(json))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(AuthenticatedClient client, String path) throws Exception {
        return client.client().send(request(path).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode body(HttpResponse<String> response, int expectedStatus) throws Exception {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(expectedStatus);
        return objectMapper.readTree(response.body());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
    }

    private void insertUser(UUID id, String username, String displayName, Timestamp now) {
        database.execute("""
                INSERT INTO app_users
                    (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, TRUE, ?, ?)
                """, id, username, passwordEncoder.encode("correct-password"), displayName, now, now);
    }

    private void insertRegion(UUID id, String code, String name, Timestamp now) {
        database.execute("""
                INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, ?, ?)
                """, id, code, name, now, now);
    }

    private void insertStore(UUID id, UUID regionId, String code, String name, Timestamp now) {
        database.execute("""
                INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, TRUE, ?, ?)
                """, id, regionId, code, name, now, now);
    }

    private record AuthenticatedClient(HttpClient client, String csrfToken) {
    }
}
