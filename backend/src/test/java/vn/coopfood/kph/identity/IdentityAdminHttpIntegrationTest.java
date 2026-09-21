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
class IdentityAdminHttpIntegrationTest {

    private static final UUID ADMIN_A = UUID.fromString("10000000-0000-4000-8000-000000000011");
    private static final UUID ADMIN_B = UUID.fromString("10000000-0000-4000-8000-000000000012");
    private static final UUID TARGET = UUID.fromString("10000000-0000-4000-8000-000000000013");
    private static final UUID REGION = UUID.fromString("20000000-0000-4000-8000-000000000011");
    private static final UUID STORE = UUID.fromString("30000000-0000-4000-8000-000000000011");

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_identity_admin_test")
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

    @BeforeEach
    void seed() {
        database.execute("TRUNCATE TABLE app_users, regions, stores CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-09-21T02:00:00Z"));
        insertUser(ADMIN_A, "admin.a", "Quản trị A", now);
        insertUser(ADMIN_B, "admin.b", "Quản trị B", now);
        insertUser(TARGET, "target.user", "Người dùng mục tiêu", now);
        database.execute("""
                INSERT INTO user_roles (user_id, role)
                VALUES (?, 'CHAIN_ADMIN'), (?, 'CHAIN_ADMIN')
                """, ADMIN_A, ADMIN_B);
        database.execute("""
                INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
                VALUES (?, 'R-P04', 'Vùng P04', TRUE, ?, ?)
                """, REGION, now, now);
        database.execute("""
                INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at)
                VALUES (?, ?, 'S-P04', 'Cửa hàng P04', TRUE, ?, ?)
                """, STORE, REGION, now, now);
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, 'STORE_MANAGER', TRUE, ?, ?),
                       (?, ?, 'STORE_MANAGER', TRUE, ?, ?)
                """, TARGET, STORE, now, now, ADMIN_B, STORE, now, now);
    }

    @Test
    void chainAdminListsAndDeactivatesWithAuditAndRequestNextSessionInvalidation() throws Exception {
        AuthenticatedClient admin = login("admin.a");
        AuthenticatedClient target = login("target.user");

        JsonNode users = body(get(admin, "/api/v1/admin/users"), 200);
        assertThat(users).hasSize(3);
        assertThat(users.get(0).path("username").asText()).isEqualTo("admin.a");
        assertThat(users.get(0).has("passwordHash")).isFalse();

        JsonNode deactivated = body(post(admin, "/api/v1/admin/users/" + TARGET + "/deactivate", """
                {"reason":"  Nhân sự đã nghỉ việc  "}
                """), 200);
        assertThat(deactivated.path("active").asBoolean()).isFalse();
        assertThat(deactivated.path("globalRoles")).isEmpty();
        assertThat(database.fetchValue("SELECT active FROM app_users WHERE id = ?", TARGET)).isEqualTo(false);

        String auditMetadata = database.fetchOne("""
                SELECT metadata::text
                FROM audit_events
                WHERE action = 'USER_DEACTIVATED' AND target_id = ?
                """, TARGET).get(0, String.class);
        JsonNode audit = objectMapper.readTree(auditMetadata);
        assertThat(audit.path("reason").asText()).isEqualTo("Nhân sự đã nghỉ việc");
        assertThat(audit.toString()).doesNotContain("Người dùng mục tiêu", "correct-password");

        assertThat(get(target, "/api/v1/auth/session").statusCode()).isEqualTo(401);
        assertThat(rawLogin("target.user").statusCode()).isEqualTo(401);
    }

    @Test
    void rejectsNonAdminSelfBlankUnknownAndMissingCsrfWithoutMutation() throws Exception {
        AuthenticatedClient admin = login("admin.a");
        AuthenticatedClient target = login("target.user");

        assertThat(get(target, "/api/v1/admin/users").statusCode()).isEqualTo(403);
        HttpResponse<String> nonAdmin = post(target, "/api/v1/admin/users/" + ADMIN_B + "/deactivate",
                "{\"reason\":\"Không có quyền\"}");
        assertThat(nonAdmin.statusCode()).isEqualTo(403);
        assertThat(objectMapper.readTree(nonAdmin.body()).path("code").asText()).isEqualTo("CHAIN_ADMIN_REQUIRED");

        HttpResponse<String> self = post(admin, "/api/v1/admin/users/" + ADMIN_A + "/deactivate",
                "{\"reason\":\"Tự khóa\"}");
        assertThat(self.statusCode()).isEqualTo(409);
        assertThat(objectMapper.readTree(self.body()).path("code").asText())
                .isEqualTo("USER_SELF_DEACTIVATION_FORBIDDEN");

        HttpResponse<String> blank = post(admin, "/api/v1/admin/users/" + TARGET + "/deactivate",
                "{\"reason\":\"   \"}");
        assertThat(blank.statusCode()).isEqualTo(422);
        HttpResponse<String> unknown = post(admin, "/api/v1/admin/users/" + TARGET + "/deactivate",
                "{\"reason\":\"Hợp lệ\",\"active\":false}");
        assertThat(unknown.statusCode()).isEqualTo(400);

        HttpResponse<String> missingCsrf = admin.client().send(request("/api/v1/admin/users/" + TARGET + "/deactivate")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"reason\":\"Thiếu CSRF\"}"))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(missingCsrf.statusCode()).isEqualTo(403);
        assertThat(database.fetchValue("SELECT active FROM app_users WHERE id = ?", TARGET)).isEqualTo(true);
        assertThat(database.fetchValue("SELECT count(*) FROM audit_events WHERE action = 'USER_DEACTIVATED'"))
                .isEqualTo(0L);
    }

    @Test
    void concurrentCrossDeactivationAlwaysLeavesOneActiveChainAdmin() throws Exception {
        AuthenticatedClient adminA = login("admin.a");
        AuthenticatedClient adminB = login("admin.b");

        CompletableFuture<HttpResponse<String>> deactivateB = sendPostAsync(
                adminA, "/api/v1/admin/users/" + ADMIN_B + "/deactivate", "A thay B");
        CompletableFuture<HttpResponse<String>> deactivateA = sendPostAsync(
                adminB, "/api/v1/admin/users/" + ADMIN_A + "/deactivate", "B thay A");
        CompletableFuture.allOf(deactivateA, deactivateB).join();

        List<Integer> statuses = List.of(deactivateA.join().statusCode(), deactivateB.join().statusCode());
        assertThat(statuses).contains(200);
        assertThat(statuses).anySatisfy(status -> assertThat(status).isIn(401, 403, 409));
        assertThat(statuses.stream().filter(status -> status == 200)).hasSize(1);
        assertThat(database.fetchValue("""
                SELECT count(*)
                FROM app_users u
                JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'CHAIN_ADMIN'
                WHERE u.active
                """)).isEqualTo(1L);
        assertThat(database.fetchValue("SELECT count(*) FROM audit_events WHERE action = 'USER_DEACTIVATED'"))
                .isEqualTo(1L);
    }

    @Test
    void refusesToDeactivateTheLastActiveManagerOfAnActiveStore() throws Exception {
        AuthenticatedClient admin = login("admin.a");
        database.execute("UPDATE store_memberships SET active = FALSE WHERE user_id = ? AND store_id = ?",
                ADMIN_B, STORE);

        HttpResponse<String> response = post(admin, "/api/v1/admin/users/" + TARGET + "/deactivate",
                "{\"reason\":\"Nhân sự đã nghỉ việc\"}");

        assertThat(response.statusCode()).isEqualTo(409);
        assertThat(objectMapper.readTree(response.body()).path("code").asText())
                .isEqualTo("LAST_STORE_MANAGER_REQUIRED");
        assertThat(database.fetchValue("SELECT active FROM app_users WHERE id = ?", TARGET)).isEqualTo(true);
        assertThat(database.fetchValue("SELECT count(*) FROM audit_events WHERE action = 'USER_DEACTIVATED'"))
                .isEqualTo(0L);
    }

    private CompletableFuture<HttpResponse<String>> sendPostAsync(
            AuthenticatedClient client, String path, String reason) {
        return client.client().sendAsync(request(path)
                .header("Content-Type", "application/json")
                .header("X-CSRF-TOKEN", client.csrfToken())
                .POST(HttpRequest.BodyPublishers.ofString("{\"reason\":\"" + reason + "\"}"))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

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
        return client.send(request("/api/v1/auth/login")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"username":"%s","password":"correct-password"}
                        """.formatted(username)))
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
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
    }

    private void insertUser(UUID id, String username, String displayName, Timestamp now) {
        database.execute("""
                INSERT INTO app_users
                    (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, TRUE, ?, ?)
                """, id, username, passwordEncoder.encode("correct-password"), displayName, now, now);
    }

    private record AuthenticatedClient(HttpClient client, String csrfToken) {
    }
}
