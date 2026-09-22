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
import java.util.UUID;

import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class IdentityHttpIntegrationTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID ACTIVE_STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID INACTIVE_STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final UUID REVOKED_STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000003");
    private static final UUID REGION_ID = UUID.fromString("30000000-0000-4000-8000-000000000001");

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_identity_test")
            .withUsername("kph_test")
            .withPassword("kph_test");

    @LocalServerPort
    private int port;

    @Autowired
    private DSLContext database;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void seedIdentity() {
        database.execute("TRUNCATE TABLE app_users, regions, stores CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-09-04T04:00:00Z"));
        database.execute(
                "INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, TRUE, ?, ?)",
                USER_ID,
                "manager.demo",
                new BCryptPasswordEncoder().encode("correct-password"),
                "Nguyễn Văn Demo",
                now,
                now);
        database.execute("""
                INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
                VALUES (?, 'R-01', 'Vùng 01', TRUE, ?, ?)
                """, REGION_ID, now, now);
        insertStore(ACTIVE_STORE_ID, "0001", "Nguyễn Kiệm", true, now);
        insertStore(INACTIVE_STORE_ID, "0002", "Inactive store", false, now);
        insertStore(REVOKED_STORE_ID, "0003", "Revoked membership", true, now);
        insertMembership(ACTIVE_STORE_ID, "STORE_MANAGER", true, now);
        insertMembership(INACTIVE_STORE_ID, "EMPLOYEE", true, now);
        insertMembership(REVOKED_STORE_ID, "EMPLOYEE", false, now);
    }

    @Test
    void loginSessionStoresCsrfAndLogoutFollowThePublishedContract() throws Exception {
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();

        HttpResponse<String> login = client.send(
                request("/api/v1/auth/login")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(login.statusCode()).isEqualTo(200);
        assertThat(login.headers().allValues("Set-Cookie"))
                .anySatisfy(cookie -> assertThat(cookie)
                        .startsWith("KPH_SESSION=")
                        .contains("HttpOnly")
                        .contains("SameSite=Lax"));
        JsonNode loginBody = objectMapper.readTree(login.body());
        assertThat(loginBody.path("user").path("id").asText()).isEqualTo(USER_ID.toString());
        assertThat(loginBody.path("user").path("stores").size()).isEqualTo(1);
        assertThat(loginBody.path("user").path("stores").get(0).path("id").asText())
                .isEqualTo(ACTIVE_STORE_ID.toString());
        String csrfToken = loginBody.path("csrfToken").asText();
        assertThat(csrfToken).isNotBlank();

        HttpResponse<String> session = client.send(
                request("/api/v1/auth/session").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(session.statusCode()).isEqualTo(200);

        HttpResponse<String> stores = client.send(
                request("/api/v1/stores").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(stores.statusCode()).isEqualTo(200);
        assertThat(objectMapper.readTree(stores.body()).size()).isEqualTo(1);

        database.execute(
                "UPDATE store_memberships SET active = FALSE WHERE user_id = ? AND store_id = ?",
                USER_ID,
                ACTIVE_STORE_ID);
        HttpResponse<String> storesAfterRevoke = client.send(
                request("/api/v1/stores").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(storesAfterRevoke.statusCode()).isEqualTo(200);
        assertThat(objectMapper.readTree(storesAfterRevoke.body()).size()).isZero();

        HttpResponse<String> missingCsrf = client.send(
                request("/api/v1/auth/logout").POST(HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(missingCsrf.statusCode()).isEqualTo(403);
        assertThat(objectMapper.readTree(missingCsrf.body()).path("code").asText())
                .isEqualTo("CSRF_VALIDATION_FAILED");

        HttpResponse<String> logout = client.send(
                request("/api/v1/auth/logout")
                        .header("X-CSRF-TOKEN", csrfToken)
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(logout.statusCode()).isEqualTo(204);

        HttpResponse<String> afterLogout = client.send(
                request("/api/v1/auth/session").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(afterLogout.statusCode()).isEqualTo(401);

        CookieManager revokedCookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient revokedClient = HttpClient.newBuilder().cookieHandler(revokedCookies).build();
        HttpResponse<String> secondLogin = revokedClient.send(
                request("/api/v1/auth/login")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(secondLogin.statusCode()).isEqualTo(200);

        database.execute("UPDATE app_users SET active = FALSE WHERE id = ?", USER_ID);
        HttpResponse<String> sessionAfterDeactivation = revokedClient.send(
                request("/api/v1/auth/session").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(sessionAfterDeactivation.statusCode()).isEqualTo(401);
    }

    @Test
    void selfChangeMigratesHashAuditsAndInvalidatesEveryOldSession() throws Exception {
        CookieManager firstCookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        CookieManager secondCookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient first = HttpClient.newBuilder().cookieHandler(firstCookies).build();
        HttpClient second = HttpClient.newBuilder().cookieHandler(secondCookies).build();

        HttpResponse<String> firstLogin = login(first, "correct-password");
        HttpResponse<String> secondLogin = login(second, "correct-password");
        assertThat(firstLogin.statusCode()).isEqualTo(200);
        assertThat(secondLogin.statusCode()).isEqualTo(200);
        String csrfToken = objectMapper.readTree(firstLogin.body()).path("csrfToken").asText();
        String newPassword = "Mật khẩu mới riêng tư 2026!";

        HttpResponse<String> rejected = first.send(
                request("/api/v1/auth/password/change")
                        .header("Content-Type", "application/json")
                        .header("X-CSRF-TOKEN", csrfToken)
                        .POST(HttpRequest.BodyPublishers.ofString("""
                                {"currentPassword":"wrong-password","newPassword":"%s"}
                                """.formatted(newPassword)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(rejected.statusCode()).isEqualTo(422);
        assertThat(objectMapper.readTree(rejected.body()).path("code").asText())
                .isEqualTo("CURRENT_PASSWORD_INVALID");

        HttpResponse<String> changed = first.send(
                request("/api/v1/auth/password/change")
                        .header("Content-Type", "application/json")
                        .header("X-CSRF-TOKEN", csrfToken)
                        .POST(HttpRequest.BodyPublishers.ofString("""
                                {"currentPassword":"correct-password","newPassword":"%s"}
                                """.formatted(newPassword)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(changed.statusCode()).isEqualTo(204);

        assertThat(second.send(request("/api/v1/auth/session").GET().build(),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
        assertThat(login(HttpClient.newHttpClient(), "correct-password").statusCode()).isEqualTo(401);
        assertThat(login(HttpClient.newHttpClient(), newPassword).statusCode()).isEqualTo(200);

        String storedHash = (String) database.fetchValue(
                "SELECT password_hash FROM app_users WHERE id = ?", USER_ID);
        Long version = ((Number) database.fetchValue(
                "SELECT credential_version FROM app_users WHERE id = ?", USER_ID)).longValue();
        String metadata = (String) database.fetchValue("""
                SELECT metadata::text FROM audit_events
                WHERE actor_user_id = ? AND action = 'CREDENTIAL_CHANGED'
                ORDER BY occurred_at DESC LIMIT 1
                """, USER_ID);
        assertThat(storedHash).startsWith("{pbkdf2}").doesNotContain(newPassword);
        assertThat(version).isEqualTo(2L);
        assertThat(metadata).contains("credentialVersion").doesNotContain("password").doesNotContain(storedHash);
    }

    private HttpResponse<String> login(HttpClient client, String password) throws Exception {
        return client.send(
                request("/api/v1/auth/login")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("""
                                {"username":"manager.demo","password":"%s"}
                                """.formatted(password)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
    }

    private void insertStore(UUID storeId, String code, String name, boolean active, Timestamp now) {
        database.execute(
                "INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?)",
                storeId,
                REGION_ID,
                code,
                name,
                active,
                now,
                now);
    }

    private void insertMembership(UUID storeId, String role, boolean active, Timestamp now) {
        database.execute(
                "INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                USER_ID,
                storeId,
                role,
                active,
                now,
                now);
    }
}
