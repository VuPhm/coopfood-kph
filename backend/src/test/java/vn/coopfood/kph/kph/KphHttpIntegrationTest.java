package vn.coopfood.kph.kph;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.coopfood.kph.foundation.time.TimeConfiguration;

@Testcontainers
@SpringBootTest
class KphHttpIntegrationTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID OTHER_STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000002");
    // UTC and business dates differ, so the test also exercises the business zone.
    private static final Instant NOW = Instant.parse("2026-09-05T18:00:00Z");

    @TempDir
    static Path mediaRoot;

    @DynamicPropertySource
    static void mediaProperties(DynamicPropertyRegistry registry) {
        registry.add("kph.media-root", () -> mediaRoot.toString());
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedTime {
        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(NOW, TimeConfiguration.BUSINESS_ZONE);
        }
    }

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_kph_test")
            .withUsername("kph_test")
            .withPassword("kph_test");

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext applicationContext;

    @Autowired
    private DSLContext database;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void seed() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .build();
        database.execute("TRUNCATE TABLE app_users, stores, catalog_import_batches CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-09-05T04:00:00Z"));
        database.execute("""
                INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, 'kph.demo', ?, 'KPH Demo', TRUE, ?, ?)
                """, USER_ID, passwordEncoder.encode("correct-password"), now, now);
        insertStore(STORE_ID, "0001", "Nguyễn Kiệm", now);
        insertStore(OTHER_STORE_ID, "0002", "Store Other", now);
        database.execute("""
                INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
                VALUES (?, ?, 'EMPLOYEE', TRUE, ?, ?)
                """, USER_ID, STORE_ID, now, now);
    }

    @Test
    void createsStoreScopedSnapshotAndPrivateStampedPhoto() throws Exception {
        insertCatalog("001234");
        Login login = login();
        MockMultipartFile payload = payload("001234", "Sản phẩm client không được tin");
        MockMultipartFile photo = new MockMultipartFile("photos", "evidence.png", "image/png", png(32, 16));

        MvcResult created = mockMvc.perform(multipart("/api/v1/stores/{storeId}/kph", STORE_ID)
                        .file(payload)
                        .file(photo)
                        .session(login.session())
                        .header("X-CSRF-TOKEN", login.csrfToken())
                        .header("Idempotency-Key", "kph-create-key-0001"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(created.getResponse().getContentAsByteArray());
        assertThat(body.path("lookupStatus").asText()).isEqualTo("FOUND");
        assertThat(body.path("catalogSnapshot").path("skuCode").asText()).isEqualTo("SKU-001234");
        assertThat(body.path("catalogSnapshot").path("productName").asText()).isEqualTo("Sản phẩm tổng hợp");
        assertThat(body.path("store").path("id").asText()).isEqualTo(STORE_ID.toString());
        assertThat(body.path("detectedBy").path("id").asText()).isEqualTo(USER_ID.toString());
        assertThat(body.path("photos")).hasSize(1);
        assertThat(body.path("detectedDate").asText()).isEqualTo("2026-09-06");
        assertThat(Instant.parse(body.path("createdAt").asText())).isEqualTo(NOW);

        String recordId = body.path("id").asText();
        String photoPath = body.path("photos").get(0).path("stampedContentPath").asText();
        mockMvc.perform(get(photoPath).session(login.session()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_JPEG_VALUE))
                .andExpect(header().string("Cache-Control", containsString("private")))
                .andExpect(header().string("Cache-Control", containsString("no-store")));

        MvcResult list = mockMvc.perform(get("/api/v1/stores/{storeId}/kph", STORE_ID).session(login.session()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(list.getResponse().getContentAsByteArray()).get(0).path("id").asText())
                .isEqualTo(recordId);
        mockMvc.perform(get("/api/v1/stores/{storeId}/kph/{recordId}/photos/1", OTHER_STORE_ID, recordId)
                        .session(login.session()))
                .andExpect(status().isForbidden());
    }

    @Test
    void replaysSameRequestButConflictsOnChangedPayloadAndRejectsCrossStoreMutation() throws Exception {
        Login login = login();
        MockMultipartFile firstPayload = payload(null, "Manual product");
        MockMultipartFile firstPhoto = new MockMultipartFile("photos", "evidence.jpg", "image/jpeg", jpeg(12, 12));
        MvcResult first = mockMvc.perform(multipart("/api/v1/stores/{storeId}/kph", STORE_ID)
                        .file(firstPayload).file(firstPhoto).session(login.session())
                        .header("X-CSRF-TOKEN", login.csrfToken()).header("Idempotency-Key", "kph-replay-key-0001"))
                .andExpect(status().isCreated()).andReturn();
        String firstId = objectMapper.readTree(first.getResponse().getContentAsByteArray()).path("id").asText();

        mockMvc.perform(multipart("/api/v1/stores/{storeId}/kph", STORE_ID)
                        .file(payload(null, "Manual product")).file(new MockMultipartFile("photos", "evidence.jpg", "image/jpeg", jpeg(12, 12)))
                        .session(login.session()).header("X-CSRF-TOKEN", login.csrfToken())
                        .header("Idempotency-Key", "kph-replay-key-0001"))
                .andExpect(status().isCreated());
        MvcResult changed = mockMvc.perform(multipart("/api/v1/stores/{storeId}/kph", STORE_ID)
                        .file(payload(null, "Different product")).file(firstPhoto).session(login.session())
                        .header("X-CSRF-TOKEN", login.csrfToken())
                        .header("Idempotency-Key", "kph-replay-key-0001"))
                .andExpect(status().isConflict()).andReturn();
        assertThat(objectMapper.readTree(changed.getResponse().getContentAsByteArray()).path("code").asText())
                .isEqualTo("IDEMPOTENCY_KEY_REUSED");
        assertThat(objectMapper.readTree(mockMvc.perform(get("/api/v1/stores/{storeId}/kph", STORE_ID).session(login.session()))
                .andReturn().getResponse().getContentAsByteArray()).size()).isEqualTo(1);

        mockMvc.perform(multipart("/api/v1/stores/{storeId}/kph", OTHER_STORE_ID)
                        .file(payload(null, "Cross store")).file(firstPhoto).session(login.session())
                        .header("X-CSRF-TOKEN", login.csrfToken())
                        .header("Idempotency-Key", "kph-cross-store-key"))
                .andExpect(status().isForbidden());
        assertThat(firstId).isNotBlank();
    }

    @Test
    void preservesMissingBarcodeAndManualSnapshotWithoutGuessingCatalogProduct() throws Exception {
        insertCatalog("001234");
        Login login = login();
        MvcResult created = mockMvc.perform(multipart("/api/v1/stores/{storeId}/kph", STORE_ID)
                        .file(payload("001235", "Manual product for missing barcode"))
                        .file(new MockMultipartFile("photos", "evidence.png", "image/png", png(32, 16)))
                        .session(login.session()).header("X-CSRF-TOKEN", login.csrfToken())
                        .header("Idempotency-Key", "kph-not-found-key-0001"))
                .andExpect(status().isCreated()).andReturn();
        JsonNode body = objectMapper.readTree(created.getResponse().getContentAsByteArray());
        assertThat(body.path("lookupStatus").asText()).isEqualTo("NOT_FOUND");
        assertThat(body.path("barcode").asText()).isEqualTo("001235");
        assertThat(body.path("catalogSnapshot").path("skuCode").isNull()).isTrue();
        assertThat(body.path("catalogSnapshot").path("productName").asText())
                .isEqualTo("Manual product for missing barcode");
        assertThat(body.path("catalogSnapshot").path("supplierCode").isNull()).isTrue();
        var persisted = database.fetchOne(
                "SELECT catalog_product_id, catalog_version_id FROM kph_records WHERE id = ?",
                UUID.fromString(body.path("id").asText()));
        assertThat(persisted.get("catalog_product_id")).isNull();
        assertThat(persisted.get("catalog_version_id")).isNull();
        JsonNode reloaded = objectMapper.readTree(mockMvc.perform(
                        get("/api/v1/stores/{storeId}/kph", STORE_ID).session(login.session()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray()).get(0);
        assertThat(reloaded).isEqualTo(body);
    }

    private Login login() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"kph.demo\",\"password\":\"correct-password\"}"))
                .andExpect(status().isOk()).andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        return new Login((MockHttpSession) result.getRequest().getSession(false), body.path("csrfToken").asText());
    }

    private MockMultipartFile payload(String barcode, String productName) throws Exception {
        String barcodeJson = barcode == null ? "null" : objectMapper.writeValueAsString(barcode);
        return new MockMultipartFile("payload", "payload.json", MediaType.APPLICATION_JSON_VALUE,
                ("{\"type\":\"TPCN\",\"detectedDate\":\"" + LocalDate.ofInstant(NOW, TimeConfiguration.BUSINESS_ZONE)
                        + "\",\"quantity\":1,\"unit\":\"EA\",\"condition\":\"NEAR_EXPIRY\","
                        + "\"resolution\":\"CANCEL\",\"barcode\":" + barcodeJson
                        + ",\"manualProductName\":" + objectMapper.writeValueAsString(productName) + "}").getBytes());
    }

    private void insertStore(UUID id, String code, String name, Timestamp now) {
        database.execute("""
                INSERT INTO stores (id, store_code, store_name, active, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, ?, ?)
                """, id, code, name, now, now);
    }

    private void insertCatalog(String barcode) {
        UUID batchId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID supplierId = UUID.randomUUID();
        Timestamp now = Timestamp.from(Instant.parse("2026-09-05T04:00:00Z"));
        database.execute("""
                INSERT INTO catalog_import_batches (id, checksum_sha256, original_filename, file_size_bytes, status, created_at, updated_at)
                VALUES (?, ?, 'synthetic.csv', 1, 'PUBLISHED', ?, ?)
                """, batchId, "a".repeat(64 - batchId.toString().replace("-", "").length()) + batchId.toString().replace("-", ""), now, now);
        database.execute("""
                INSERT INTO catalog_versions (id, source_batch_id, status, is_current, created_at, published_at)
                VALUES (?, ?, 'PUBLISHED', TRUE, ?, ?)
                """, versionId, batchId, now, now);
        database.execute("""
                INSERT INTO products (id, catalog_version_id, sku_code, product_name, active)
                VALUES (?, ?, 'SKU-001234', 'Sản phẩm tổng hợp', TRUE)
                """, productId, versionId);
        database.execute("""
                INSERT INTO product_barcodes (product_id, catalog_version_id, barcode, active)
                VALUES (?, ?, ?, TRUE)
                """, productId, versionId, barcode);
        database.execute("""
                INSERT INTO suppliers (id, catalog_version_id, supplier_code, supplier_name)
                VALUES (?, ?, 'NCC-0007', 'NCC Demo')
                """, supplierId, versionId);
        database.execute("""
                INSERT INTO product_suppliers (product_id, supplier_id, catalog_version_id, is_primary)
                VALUES (?, ?, ?, TRUE)
                """, productId, supplierId, versionId);
    }

    private static byte[] png(int width, int height) throws Exception {
        return image(width, height, "png");
    }

    private static byte[] jpeg(int width, int height) throws Exception {
        return image(width, height, "jpeg");
    }

    private static byte[] image(int width, int height, String format) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, format, output);
        return output.toByteArray();
    }

    private record Login(MockHttpSession session, String csrfToken) {
    }
}
