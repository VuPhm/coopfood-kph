package vn.coopfood.kph.store;

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
class StoreAccessHttpIntegrationTest {
    private static final UUID USER = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID REGION = UUID.fromString("30000000-0000-4000-8000-000000000001");
    private static final UUID OTHER_REGION = UUID.fromString("30000000-0000-4000-8000-000000000002");
    private static final UUID FIRST = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID SECOND = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final UUID OTHER = UUID.fromString("20000000-0000-4000-8000-000000000003");
    private static final UUID INACTIVE = UUID.fromString("20000000-0000-4000-8000-000000000004");
    private static final Timestamp NOW = Timestamp.from(Instant.parse("2026-10-30T04:00:00Z"));

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_store_access_test")
            .withUsername("kph_test").withPassword("kph_test");

    @LocalServerPort
    private int port;
    @Autowired
    private DSLContext database;
    @Autowired
    private ObjectMapper mapper;

    @BeforeEach
    void seed() {
        database.execute("TRUNCATE TABLE app_users, regions, stores CASCADE");
        database.execute("""
                INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, 'access.test', ?, 'Synthetic actor', TRUE, ?, ?)
                """, USER, new BCryptPasswordEncoder().encode("synthetic-password"), NOW, NOW);
        for (UUID region : new UUID[]{REGION, OTHER_REGION}) {
            database.execute("""
                    INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
                    VALUES (?, ?, 'Synthetic region', TRUE, ?, ?)
                    """, region, region.toString().replace("-", ""), NOW, NOW);
        }
        // Insert in reverse code order to exercise explicit database ordering.
        store(OTHER, OTHER_REGION, "0010", true);
        store(SECOND, REGION, "0002", true);
        store(FIRST, REGION, "0001", true);
        store(INACTIVE, OTHER_REGION, "0000", false);
    }

    @Test
    void anonymousIsUnauthorizedAndUnsupportedMethodRemainsDenied() throws Exception {
        assertThat(get(HttpClient.newHttpClient(), "/api/v1/me/store-access").statusCode()).isEqualTo(401);
        HttpResponse<String> denied = login().send(request("/api/v1/me/store-access")
                .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(denied.statusCode()).isEqualTo(403);
    }

    @Test
    void noScopeAndCatalogOnlyHaveNoKphAccess() throws Exception {
        HttpClient client = login();
        assertThat(access(client).size()).isZero();
        role("CATALOG_ADMIN");
        assertThat(access(client).size()).isZero();
    }

    @Test
    void membershipCapabilitiesAndRevocationRefreshWithoutRelogin() throws Exception {
        membership(FIRST, "EMPLOYEE");
        HttpClient client = login();
        JsonNode items = access(client);
        assertThat(items.size()).isEqualTo(1);
        assertItem(items.get(0), FIRST, "0001", false);
        assertThat(get(client, "/api/v1/stores/" + OTHER + "/kph").statusCode()).isEqualTo(403);
        database.execute("UPDATE store_memberships SET role = 'STORE_MANAGER' WHERE user_id = ?", USER);
        assertItem(access(client).get(0), FIRST, "0001", true);
        database.execute("UPDATE store_memberships SET active = FALSE WHERE user_id = ?", USER);
        assertThat(access(client).size()).isZero();
        assertThat(get(client, "/api/v1/stores/" + FIRST + "/kph").statusCode()).isEqualTo(403);
    }

    @Test
    void regionalScopeIsLimitedAndRevocationTakesEffectOnNextRequest() throws Exception {
        assignment(REGION);
        HttpClient client = login();
        JsonNode items = access(client);
        assertThat(items.size()).isEqualTo(2);
        assertItem(items.get(0), FIRST, "0001", true);
        assertItem(items.get(1), SECOND, "0002", true);
        assertThat(get(client, "/api/v1/stores/" + OTHER + "/kph").statusCode()).isEqualTo(403);
        assertThat(mapper.readTree(get(client, "/api/v1/stores").body()).size()).isZero();
        database.execute("UPDATE user_region_assignments SET active = FALSE WHERE user_id = ?", USER);
        assertThat(access(client).size()).isZero();
        assertThat(get(client, "/api/v1/stores/" + FIRST + "/kph").statusCode()).isEqualTo(403);
    }

    @Test
    void chainScopeNeedsNoMembershipAndRevocationRemovesAccess() throws Exception {
        role("CHAIN_ADMIN");
        HttpClient client = login();
        JsonNode items = access(client);
        assertThat(items.size()).isEqualTo(3);
        assertItem(items.get(0), FIRST, "0001", true);
        assertItem(items.get(1), SECOND, "0002", true);
        assertItem(items.get(2), OTHER, "0010", true);
        assertThat(mapper.readTree(get(client, "/api/v1/stores").body()).size()).isZero();
        assertThat(mapper.readTree(get(client, "/api/v1/auth/session").body())
                .path("user").path("stores").size()).isZero();
        database.execute("DELETE FROM user_roles WHERE user_id = ?", USER);
        assertThat(access(client).size()).isZero();
    }

    @Test
    void overlappingScopesAreDeduplicatedAndRemainingScopeStillWorks() throws Exception {
        membership(FIRST, "EMPLOYEE");
        assignment(REGION);
        assignment(OTHER_REGION);
        role("CHAIN_ADMIN");
        HttpClient client = login();
        assertThat(access(client).size()).isEqualTo(3);
        assertItem(access(client).get(0), FIRST, "0001", true);
        database.execute("DELETE FROM user_roles WHERE user_id = ?", USER);
        database.execute("UPDATE user_region_assignments SET active = FALSE WHERE user_id = ? AND region_id = ?",
                USER, REGION);
        JsonNode remaining = access(client);
        assertThat(remaining.size()).isEqualTo(2);
        assertItem(remaining.get(0), FIRST, "0001", false);
        assertItem(remaining.get(1), OTHER, "0010", true);
    }

    @Test
    void inactiveStoresAndRegionsAreExcludedEvenForChainAdmin() throws Exception {
        role("CHAIN_ADMIN");
        membership(INACTIVE, "STORE_MANAGER");
        assignment(REGION);
        HttpClient client = login();
        assertThat(access(client).size()).isEqualTo(3);
        database.execute("UPDATE stores SET active = FALSE WHERE region_id = ?", REGION);
        database.execute("UPDATE regions SET active = FALSE WHERE id = ?", REGION);
        JsonNode items = access(client);
        assertThat(items.size()).isEqualTo(1);
        assertItem(items.get(0), OTHER, "0010", true);
        assertThat(get(client, "/api/v1/stores/" + FIRST + "/kph").statusCode()).isEqualTo(403);
    }

    @Test
    void movingStoreToAnotherRegionChangesDiscoveryAndAuthorizationTogether() throws Exception {
        assignment(REGION);
        HttpClient client = login();
        assertThat(access(client).size()).isEqualTo(2);
        database.execute("UPDATE stores SET region_id = ? WHERE id = ?", OTHER_REGION, FIRST);
        JsonNode items = access(client);
        assertThat(items.size()).isEqualTo(1);
        assertItem(items.get(0), SECOND, "0002", true);
        assertThat(get(client, "/api/v1/stores/" + FIRST + "/kph").statusCode()).isEqualTo(403);
    }

    @Test
    void deactivatedUserAndChangedCredentialInvalidateDiscoverySession() throws Exception {
        role("CHAIN_ADMIN");
        HttpClient client = login();
        database.execute("UPDATE app_users SET credential_version = credential_version + 1 WHERE id = ?", USER);
        assertThat(get(client, "/api/v1/me/store-access").statusCode()).isEqualTo(401);
        HttpClient second = login();
        database.execute("UPDATE app_users SET active = FALSE WHERE id = ?", USER);
        assertThat(get(second, "/api/v1/me/store-access").statusCode()).isEqualTo(401);
    }

    private void assertItem(JsonNode item, UUID id, String code, boolean manager) {
        assertThat(item.size()).isEqualTo(4);
        assertThat(item.path("id").asText()).isEqualTo(id.toString());
        assertThat(item.path("code").asText()).isEqualTo(code);
        assertThat(item.path("name").asText()).isEqualTo("Synthetic store " + code);
        JsonNode kph = item.path("kph");
        assertThat(kph.size()).isEqualTo(4);
        assertThat(kph.path("view").asBoolean()).isTrue();
        assertThat(kph.path("create").asBoolean()).isTrue();
        assertThat(kph.path("review").asBoolean()).isEqualTo(manager);
        assertThat(kph.has("export")).isTrue();
        assertThat(kph.path("export").asBoolean()).isEqualTo(manager);
    }

    private JsonNode access(HttpClient client) throws Exception {
        HttpResponse<String> response = get(client, "/api/v1/me/store-access");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        JsonNode body = mapper.readTree(response.body());
        assertThat(body.isArray()).isTrue();
        return body;
    }

    private HttpClient login() throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();
        HttpResponse<String> response = client.send(request("/api/v1/auth/login")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"username":"access.test","password":"synthetic-password"}
                        """)).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        return client;
    }

    private HttpResponse<String> get(HttpClient client, String path) throws Exception {
        return client.send(request(path).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
    }

    private void store(UUID id, UUID region, String code, boolean active) {
        database.execute("""
                INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, region, code, "Synthetic store " + code, active, NOW, NOW);
    }

    private void membership(UUID store, String role) {
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, ?, ?)
                """, USER, store, role, NOW, NOW);
    }

    private void assignment(UUID region) {
        database.execute("""
                INSERT INTO user_region_assignments (user_id, region_id, active, created_at, updated_at)
                VALUES (?, ?, TRUE, ?, ?)
                """, USER, region, NOW, NOW);
    }

    private void role(String role) {
        database.execute("INSERT INTO user_roles (user_id, role) VALUES (?, ?)", USER, role);
    }
}
