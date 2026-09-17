package vn.coopfood.kph.catalog;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CatalogLookupHttpIntegrationTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID OTHER_STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final UUID REGION_ID = UUID.fromString("30000000-0000-4000-8000-000000000001");
    private static final UUID OTHER_REGION_ID = UUID.fromString("30000000-0000-4000-8000-000000000002");

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_catalog_test")
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
    void seedActorAndStore() {
        database.execute("TRUNCATE TABLE app_users, regions, stores, catalog_import_batches CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-09-05T04:00:00Z"));
        database.execute("""
                INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, 'catalog.demo', ?, 'Catalog Demo', TRUE, ?, ?)
                """, USER_ID, passwordEncoder.encode("correct-password"), now, now);
        insertRegion(REGION_ID, "R-01", now);
        insertRegion(OTHER_REGION_ID, "R-02", now);
        insertStore(STORE_ID, REGION_ID, "0001", true, now);
        insertStore(OTHER_STORE_ID, OTHER_REGION_ID, "0002", true, now);
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, 'EMPLOYEE', TRUE, ?, ?)
                """, USER_ID, STORE_ID, now, now);
    }

    @Test
    void returnsOneCurrentActiveProductAndNeverGuessesOnMiss() throws Exception {
        insertCatalog("001234", true, true, true, true);
        HttpClient client = login();

        HttpResponse<String> found = get(client, "001234", STORE_ID);
        assertThat(found.statusCode()).isEqualTo(200);
        JsonNode foundBody = objectMapper.readTree(found.body());
        assertThat(foundBody.path("status").asText()).isEqualTo("FOUND");
        assertThat(foundBody.path("barcode").asText()).isEqualTo("001234");
        assertThat(foundBody.path("product").path("skuCode").asText()).isEqualTo("SKU-001234");
        assertThat(foundBody.path("product").path("primarySupplier").path("code").asText())
                .isEqualTo("NCC-0007");

        HttpResponse<String> missing = get(client, "001235", STORE_ID);
        assertThat(missing.statusCode()).isEqualTo(200);
        JsonNode missingBody = objectMapper.readTree(missing.body());
        assertThat(missingBody.path("status").asText()).isEqualTo("NOT_FOUND");
        assertThat(missingBody.path("barcode").asText()).isEqualTo("001235");
        assertThat(missingBody.has("product")).isFalse();
    }

    @Test
    void excludesInactiveAndNonCurrentCatalogData() throws Exception {
        Catalog current = insertCatalog("001234", true, false, true, true);
        insertCatalog("001237", false, true, true, true);
        HttpClient client = login();

        for (String barcode : new String[] {"001234", "001237"}) {
            HttpResponse<String> response = get(client, barcode, STORE_ID);
            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(objectMapper.readTree(response.body()).path("status").asText()).isEqualTo("NOT_FOUND");
        }
    }

    @Test
    void excludesAnInactiveBarcodeInTheCurrentCatalog() throws Exception {
        insertCatalog("001234", true, true, true, false);
        HttpResponse<String> response = get(login(), "001234", STORE_ID);
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(objectMapper.readTree(response.body()).path("status").asText()).isEqualTo("NOT_FOUND");
    }

    @Test
    void rejectsUnauthorizedStoreAndReportsInvalidScopeParameters() throws Exception {
        insertCatalog("001234", true, true, true, true);
        HttpClient anonymous = HttpClient.newHttpClient();
        assertThat(get(anonymous, "001234", STORE_ID).statusCode()).isEqualTo(401);

        HttpClient client = login();
        assertThat(get(client, "001234", OTHER_STORE_ID).statusCode()).isEqualTo(403);
        database.execute("INSERT INTO user_roles (user_id, role) VALUES (?, 'CHAIN_ADMIN')", USER_ID);
        assertThat(get(client, "001234", OTHER_STORE_ID).statusCode()).isEqualTo(200);

        HttpResponse<String> absentStore = request(client, "/api/v1/catalog/barcodes/001234");
        assertThat(absentStore.statusCode()).isEqualTo(400);
        assertThat(objectMapper.readTree(absentStore.body()).path("code").asText()).isEqualTo("VALIDATION_ERROR");
        HttpResponse<String> malformedStore = request(client, "/api/v1/catalog/barcodes/001234?storeId=wrong");
        assertThat(malformedStore.statusCode()).isEqualTo(400);
        assertThat(objectMapper.readTree(malformedStore.body()).path("code").asText()).isEqualTo("VALIDATION_ERROR");

        database.execute("DELETE FROM user_roles WHERE user_id = ? AND role = 'CHAIN_ADMIN'", USER_ID);
        database.execute("UPDATE store_memberships SET active = FALSE WHERE user_id = ? AND store_id = ?", USER_ID, STORE_ID);
        assertThat(get(client, "001234", STORE_ID).statusCode()).isEqualTo(403);
    }

    @Test
    void reportsUnavailableForNoCurrentCatalogOrMissingExplicitPrimarySupplier() throws Exception {
        HttpClient client = login();
        assertThat(get(client, "001234", STORE_ID).statusCode()).isEqualTo(503);

        insertCatalog("001234", true, true, false, true);
        assertThat(get(client, "001234", STORE_ID).statusCode()).isEqualTo(503);
    }

    private HttpClient login() throws Exception {
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();
        HttpResponse<String> response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/auth/login"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"catalog.demo\",\"password\":\"correct-password\"}"))
                        .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        return client;
    }

    private HttpResponse<String> get(HttpClient client, String barcode, UUID storeId) throws Exception {
        return request(client, "/api/v1/catalog/barcodes/" + barcode + "?storeId=" + storeId);
    }

    private HttpResponse<String> request(HttpClient client, String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private void insertRegion(UUID id, String code, Timestamp now) {
        database.execute("""
                INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, ?, ?)
                """, id, code, "Region " + code, now, now);
    }

    private void insertStore(UUID id, UUID regionId, String code, boolean active, Timestamp now) {
        database.execute("""
                INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, regionId, code, "Store " + code, active, now, now);
    }

    private Catalog insertCatalog(String barcode, boolean current, boolean productActive, boolean primary, boolean barcodeActive) {
        UUID batchId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        Timestamp now = Timestamp.from(Instant.parse("2026-09-05T04:00:00Z"));
        database.execute("""
                INSERT INTO catalog_import_batches (id, checksum_sha256, original_filename, file_size_bytes, status, created_at, updated_at)
                VALUES (?, ?, 'synthetic.csv', 1, 'PUBLISHED', ?, ?)
                """, batchId, ("0".repeat(32) + batchId.toString().replace("-", "")).substring(0, 64), now, now);
        database.execute("""
                INSERT INTO catalog_versions (id, source_batch_id, status, is_current, created_at, published_at)
                VALUES (?, ?, 'PUBLISHED', ?, ?, ?)
                """, versionId, batchId, current, now, now);
        insertProduct(versionId, barcode, productActive, primary, barcodeActive);
        return new Catalog(versionId);
    }

    private void insertProduct(UUID versionId, String barcode, boolean productActive, boolean primary, boolean barcodeActive) {
        UUID productId = UUID.randomUUID();
        UUID supplierId = UUID.randomUUID();
        database.execute("""
                INSERT INTO products (id, catalog_version_id, sku_code, product_name, active)
                VALUES (?, ?, ?, 'Sản phẩm tổng hợp', ?)
                """, productId, versionId, "SKU-" + barcode, productActive);
        database.execute("""
                INSERT INTO product_barcodes (product_id, catalog_version_id, barcode, active)
                VALUES (?, ?, ?, ?)
                """, productId, versionId, barcode, barcodeActive);
        database.execute("""
                INSERT INTO suppliers (id, catalog_version_id, supplier_code, supplier_name)
                VALUES (?, ?, 'NCC-0007', 'Nhà cung cấp tổng hợp')
                """, supplierId, versionId);
        database.execute("""
                INSERT INTO product_suppliers (product_id, supplier_id, catalog_version_id, is_primary)
                VALUES (?, ?, ?, ?)
                """, productId, supplierId, versionId, primary);
    }

    private record Catalog(UUID versionId) {}
}
