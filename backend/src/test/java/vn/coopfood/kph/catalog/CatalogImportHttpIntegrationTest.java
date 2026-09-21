package vn.coopfood.kph.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest
class CatalogImportHttpIntegrationTest {

    private static final UUID CATALOG_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID CHAIN_ID = UUID.fromString("10000000-0000-4000-8000-000000000002");

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_catalog_import_test")
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
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext).apply(springSecurity()).build();
        database.execute("TRUNCATE TABLE app_users, regions, stores, catalog_import_batches CASCADE");
        Timestamp now = Timestamp.from(Instant.parse("2026-09-21T02:00:00Z"));
        insertUser(CATALOG_ID, "catalog.admin", "Quản trị catalog", now);
        insertUser(CHAIN_ID, "chain.admin", "Quản trị chuỗi", now);
        database.execute("INSERT INTO user_roles (user_id, role) VALUES (?, 'CATALOG_ADMIN')", CATALOG_ID);
        database.execute("INSERT INTO user_roles (user_id, role) VALUES (?, 'CHAIN_ADMIN')", CHAIN_ID);
    }

    @Test
    void validatesLeadingZerosListsDetailAuditsAndReplaysExactBytes() throws Exception {
        Login login = login("catalog.admin");
        byte[] csv = ("\uFEFFNCC,Tên NCC,UPC,SKU,Tên sản phẩm\r\n"
                + "0007,\"NCC Demo, miền Nam\",0890123456789,SKU-000042,Sản phẩm thử nghiệm 01\r\n"
                + "0007,\"NCC Demo, miền Nam\",000123456789012,SKU-000042,Sản phẩm thử nghiệm 01\r\n")
                .getBytes(StandardCharsets.UTF_8);

        MvcResult created = upload(login, csv, "catalog-valid.csv").andExpect(status().isCreated()).andReturn();
        JsonNode body = objectMapper.readTree(created.getResponse().getContentAsByteArray());
        String batchId = body.path("batch").path("id").asText();
        assertThat(body.path("replayed").asBoolean()).isFalse();
        assertThat(body.path("batch").path("status").asText()).isEqualTo("VALIDATED");
        assertThat(body.path("batch").path("rowCount").asInt()).isEqualTo(2);
        assertThat(body.path("batch").path("createdBy").path("id").asText()).isEqualTo(CATALOG_ID.toString());

        JsonNode detail = json(mockMvc.perform(get("/api/v1/admin/catalog/imports/{id}", batchId)
                .session(login.session())).andExpect(status().isOk()).andReturn());
        assertThat(detail.path("rows")).hasSize(2);
        assertThat(detail.path("rows").get(0).path("normalized").path("supplierCode").asText()).isEqualTo("0007");
        assertThat(detail.path("rows").get(1).path("normalized").path("barcode").asText())
                .isEqualTo("000123456789012");

        JsonNode replay = json(upload(login, csv, "renamed.csv").andExpect(status().isOk()).andReturn());
        assertThat(replay.path("replayed").asBoolean()).isTrue();
        assertThat(replay.path("batch").path("id").asText()).isEqualTo(batchId);
        assertThat(database.fetchValue("SELECT count(*) FROM catalog_import_batches")).isEqualTo(1L);
        assertThat(database.fetchValue("SELECT count(*) FROM catalog_import_rows")).isEqualTo(2L);
        assertThat(database.fetchValue("SELECT count(*) FROM catalog_versions")).isEqualTo(0L);
        assertThat(database.fetchValue("SELECT count(*) FROM audit_events WHERE action = 'CATALOG_IMPORT_VALIDATED'"))
                .isEqualTo(1L);
    }

    @Test
    void persistsRowErrorsWithoutPublishingAndRejectsMalformedFileBeforeBatch() throws Exception {
        Login login = login("catalog.admin");
        byte[] conflict = ("NCC,Tên NCC,UPC,SKU,Tên sản phẩm\n"
                + "0007,NCC Demo,0890123456789,SKU-000042,Sản phẩm 01\n"
                + "0008,NCC Khác,0890123456789,SKU-000099,Sản phẩm 02\n")
                .getBytes(StandardCharsets.UTF_8);

        JsonNode rejected = json(upload(login, conflict, "conflict.csv")
                .andExpect(status().isCreated()).andReturn());
        assertThat(rejected.path("batch").path("status").asText()).isEqualTo("REJECTED");
        assertThat(rejected.path("batch").path("errorRowCount").asInt()).isEqualTo(2);
        UUID batchId = UUID.fromString(rejected.path("batch").path("id").asText());
        JsonNode detail = json(mockMvc.perform(get("/api/v1/admin/catalog/imports/{id}", batchId)
                .session(login.session())).andExpect(status().isOk()).andReturn());
        assertThat(detail.path("rows")).allSatisfy(row -> assertThat(row.path("validationMessages").toString())
                .contains("DUPLICATE_BARCODE"));
        assertThat(database.fetchValue("SELECT count(*) FROM catalog_versions")).isEqualTo(0L);
        assertThat(database.fetchValue("SELECT count(*) FROM audit_events WHERE action = 'CATALOG_IMPORT_REJECTED'"))
                .isEqualTo(1L);

        MvcResult malformed = upload(login, "NCC,UPC\n0007,00123\n".getBytes(StandardCharsets.UTF_8), "bad.csv")
                .andExpect(status().isUnprocessableEntity()).andReturn();
        assertThat(json(malformed).path("code").asText()).isEqualTo("CATALOG_HEADER_INVALID");
        assertThat(database.fetchValue("SELECT count(*) FROM catalog_import_batches")).isEqualTo(1L);
    }

    @Test
    void requiresCatalogRoleAndCsrfAndRechecksRevocationOnNextRequest() throws Exception {
        Login catalog = login("catalog.admin");
        Login chain = login("chain.admin");
        byte[] csv = validCsv();

        mockMvc.perform(multipart("/api/v1/admin/catalog/imports")
                        .file(file(csv, "valid.csv")).session(catalog.session()))
                .andExpect(status().isForbidden());
        upload(chain, csv, "valid.csv").andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/catalog/imports").session(chain.session()))
                .andExpect(status().isForbidden());

        upload(catalog, csv, "valid.csv").andExpect(status().isCreated());
        database.execute("DELETE FROM user_roles WHERE user_id = ? AND role = 'CATALOG_ADMIN'", CATALOG_ID);
        mockMvc.perform(get("/api/v1/admin/catalog/imports").session(catalog.session()))
                .andExpect(status().isForbidden());
        assertThat(database.fetchValue("SELECT count(*) FROM catalog_import_batches")).isEqualTo(1L);
    }

    private org.springframework.test.web.servlet.ResultActions upload(
            Login login, byte[] bytes, String filename) throws Exception {
        return mockMvc.perform(multipart("/api/v1/admin/catalog/imports")
                .file(file(bytes, filename))
                .session(login.session())
                .header("X-CSRF-TOKEN", login.csrfToken()));
    }

    private MockMultipartFile file(byte[] bytes, String filename) {
        return new MockMultipartFile("file", filename, "text/csv", bytes);
    }

    private byte[] validCsv() {
        return ("NCC,Tên NCC,UPC,SKU,Tên sản phẩm\n"
                + "0007,NCC Demo,0890123456789,SKU-000042,Sản phẩm thử nghiệm\n")
                .getBytes(StandardCharsets.UTF_8);
    }

    private Login login(String username) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"correct-password\"}"))
                .andExpect(status().isOk()).andReturn();
        JsonNode body = json(result);
        return new Login((MockHttpSession) result.getRequest().getSession(false), body.path("csrfToken").asText());
    }

    private JsonNode json(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsByteArray());
    }

    private void insertUser(UUID id, String username, String displayName, Timestamp now) {
        database.execute("""
                INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, TRUE, ?, ?)
                """, id, username, passwordEncoder.encode("correct-password"), displayName, now, now);
    }

    private record Login(MockHttpSession session, String csrfToken) {
    }
}
