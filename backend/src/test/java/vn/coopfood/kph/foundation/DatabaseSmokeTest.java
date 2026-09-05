package vn.coopfood.kph.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.List;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DatabaseSmokeTest {

    @Container
    @ServiceConnection
    @SuppressWarnings({"deprecation", "resource"})
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"))
            .withDatabaseName("coopfood_kph_test")
            .withUsername("kph_test")
            .withPassword("kph_test");

    @LocalServerPort
    int port;

    @Autowired
    DSLContext database;

    @Test
    void cleanPostgresAppliesBaselineAndExposesPublicHealth() throws Exception {
        Integer migrations = database.fetchOne(
                "SELECT count(*) AS total FROM flyway_schema_history WHERE success")
                .get("total", Integer.class);
        Integer coreTables = database.fetchOne("""
                SELECT count(*) AS total
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN (
                    'app_users', 'user_roles', 'stores', 'store_memberships',
                    'catalog_import_batches', 'catalog_import_rows', 'catalog_versions',
                    'suppliers', 'products', 'product_suppliers', 'product_barcodes',
                    'kph_records', 'kph_photos', 'kph_status_history', 'audit_events'
                  )
                """).get("total", Integer.class);

        assertThat(migrations).isEqualTo(2);
        assertThat(coreTables).isEqualTo(15);

        HttpResponse<String> health = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/health"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(health.statusCode()).isEqualTo(200);
        assertThat(health.body()).contains("UP");
    }

    @Test
    void kphPolicyAcceptsEveryContractConditionAndResolutionForItsType() throws Exception {
        TestScope scope = createScope();
        JsonNode policies = readKphPolicies();

        for (JsonNode policy : policies) {
            for (JsonNode condition : policy.path("conditions")) {
                for (JsonNode resolution : policy.path("resolutions")) {
                    for (String unit : List.of("EA", "kg")) {
                        assertThat(insertKph(scope, new KphPolicyCase(
                                policy.path("type").asText(),
                                condition.asText(),
                                resolution.asText(),
                                unit))).isEqualTo(1);
                    }
                }
            }
        }
    }

    @Test
    void kphPolicyRejectsLegacyUnitAndConditionVocabulary() {
        TestScope scope = createScope();

        assertConstraintViolation(
                scope,
                new KphPolicyCase("TPCN", "NEAR_EXPIRY", "CANCEL", "KG"),
                "kph_records_unit_allowed");
        assertConstraintViolation(
                scope,
                new KphPolicyCase("TPTS", "DAMAGED", "CANCEL", "kg"),
                "kph_records_condition_allowed");
    }

    @Test
    void kphQuantityAcceptsDecimalKgAndRejectsFractionalEach() {
        TestScope scope = createScope();

        for (BigDecimal quantity : List.of(new BigDecimal("1.250"), new BigDecimal("0.0001"))) {
            UUID recordId = UUID.randomUUID();
            assertThat(insertKph(
                database,
                scope,
                recordId,
                new KphPolicyCase("TPCN", "NEAR_EXPIRY", "CANCEL", "kg"),
                quantity))
                .isEqualTo(1);
            assertThat(database.fetchOne(
                    "SELECT quantity FROM kph_records WHERE id = ?", recordId)
                    .get("quantity", BigDecimal.class))
                    .isEqualByComparingTo(quantity);
        }
        for (BigDecimal quantity : List.of(new BigDecimal("1.250"), new BigDecimal("1.0004"))) {
            assertThatThrownBy(() -> insertKph(
                database,
                scope,
                UUID.randomUUID(),
                new KphPolicyCase("TPCN", "NEAR_EXPIRY", "CANCEL", "EA"),
                quantity))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("violates check constraint")
                .hasMessageContaining("kph_records_quantity_by_unit");
        }
    }

    @Test
    void kphPolicyRejectsConditionsAndResolutionsFromTheOtherType() throws Exception {
        TestScope scope = createScope();
        JsonNode policies = readKphPolicies();

        for (JsonNode policy : policies) {
            for (JsonNode otherPolicy : policies) {
                for (JsonNode condition : otherPolicy.path("conditions")) {
                    if (!containsOption(policy.path("conditions"), condition.asText())) {
                        assertConstraintViolation(scope, new KphPolicyCase(
                                policy.path("type").asText(), condition.asText(),
                                policy.path("defaultResolution").asText(), "EA"),
                                "kph_records_condition_by_type");
                    }
                }
                for (JsonNode resolution : otherPolicy.path("resolutions")) {
                    if (!containsOption(policy.path("resolutions"), resolution.asText())) {
                        assertConstraintViolation(scope, new KphPolicyCase(
                                policy.path("type").asText(),
                                policy.path("defaultCondition").asText(),
                                resolution.asText(), "EA"),
                                "kph_records_resolution_by_type");
                    }
                }
            }
        }
    }

    private JsonNode readKphPolicies() throws Exception {
        Path fixture = Path.of("../contracts/fixtures/golden/kph/field-policy-cases.json");
        JsonNode policies = new ObjectMapper().readTree(Files.readString(fixture));
        assertThat(policies.isArray()).isTrue();
        assertThat(policies.size()).isEqualTo(2);
        for (JsonNode policy : policies) {
            assertThat(policy.path("conditions").size()).isEqualTo(5);
            assertThat(policy.path("resolutions").isEmpty()).isFalse();
        }
        return policies;
    }

    private boolean containsOption(JsonNode options, String value) {
        for (JsonNode option : options) {
            if (option.asText().equals(value)) {
                return true;
            }
        }
        return false;
    }

    @Test
    void v2NormalizesLegacyUnitsAndPreservesDamagedConditionProvenance() throws Exception {
        String schemaName = "migration_upgrade_" + UUID.randomUUID().toString().replace("-", "");

        try {
            Flyway.configure()
                    .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                    .defaultSchema(schemaName)
                    .schemas(schemaName)
                    .locations("classpath:db/migration")
                    .target("1")
                    .load()
                    .migrate();

            UUID recordId;
            UUID damagedRecordId;
            try (Connection connection = DriverManager.getConnection(
                    POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
                connection.setSchema(schemaName);
                DSLContext upgradeDatabase = DSL.using(connection);
                TestScope scope = createScope(upgradeDatabase);
                recordId = UUID.randomUUID();
                assertThat(insertKph(
                        upgradeDatabase,
                        scope,
                        recordId,
                        new KphPolicyCase("TPCN", "NEAR_EXPIRY", "CANCEL", "KG")))
                        .isEqualTo(1);
                damagedRecordId = UUID.randomUUID();
                assertThat(insertKph(
                        upgradeDatabase,
                        scope,
                        damagedRecordId,
                        new KphPolicyCase("TPTS", "DAMAGED", "CANCEL", "EA")))
                        .isEqualTo(1);
                upgradeDatabase.execute(
                        "UPDATE kph_records SET condition_detail = ? WHERE id = ?",
                        "Dập hàng theo mã cũ",
                        damagedRecordId);
            }

            Flyway.configure()
                    .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                    .defaultSchema(schemaName)
                    .schemas(schemaName)
                    .locations("classpath:db/migration")
                    .load()
                    .migrate();

            try (Connection connection = DriverManager.getConnection(
                    POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
                connection.setSchema(schemaName);
                DSLContext upgradeDatabase = DSL.using(connection);
                assertThat(upgradeDatabase.fetchOne(
                        "SELECT unit FROM kph_records WHERE id = ?",
                        recordId).get("unit", String.class))
                        .isEqualTo("kg");
                assertThat(upgradeDatabase.fetchOne(
                        "SELECT condition_code, condition_detail FROM kph_records WHERE id = ?",
                        damagedRecordId))
                        .satisfies(record -> {
                            assertThat(record.get("condition_code", String.class)).isEqualTo("OTHER");
                            assertThat(record.get("condition_detail", String.class))
                                    .isEqualTo("Legacy condition: DAMAGED; Dập hàng theo mã cũ");
                        });
                assertThat(upgradeDatabase.fetchCount(
                        DSL.table(DSL.name("flyway_schema_history")),
                        DSL.field(DSL.name("success"), Boolean.class).isTrue()
                                .and(DSL.field(DSL.name("version"), String.class).in("1", "2"))))
                        .isEqualTo(2);
            }
        } finally {
            database.dropSchemaIfExists(DSL.name(schemaName)).cascade().execute();
        }
    }

    private TestScope createScope() {
        return createScope(database);
    }

    private TestScope createScope(DSLContext targetDatabase) {
        UUID userId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        String suffix = userId.toString();

        targetDatabase.execute(
                """
                INSERT INTO app_users (
                    id, username, password_hash, display_name, created_at, updated_at
                ) VALUES (?, ?, ?, ?, now(), now())
                """,
                userId,
                "schema-test-" + suffix,
                "not-a-real-password-hash",
                "Schema test " + suffix);
        targetDatabase.execute(
                """
                INSERT INTO stores (
                    id, store_code, store_name, created_at, updated_at
                ) VALUES (?, ?, ?, now(), now())
                """,
                storeId,
                "schema-test-" + suffix,
                "Schema test store " + suffix);

        return new TestScope(userId, storeId);
    }

    private int insertKph(TestScope scope, KphPolicyCase policyCase) {
        return insertKph(database, scope, UUID.randomUUID(), policyCase);
    }

    private int insertKph(
            DSLContext targetDatabase,
            TestScope scope,
            UUID recordId,
            KphPolicyCase policyCase) {
        BigDecimal quantity = policyCase.unit().equals("EA")
                ? new BigDecimal("1.000")
                : new BigDecimal("1.250");
        return insertKph(targetDatabase, scope, recordId, policyCase, quantity);
    }

    private int insertKph(
            DSLContext targetDatabase,
            TestScope scope,
            UUID recordId,
            KphPolicyCase policyCase,
            BigDecimal quantity) {
        return targetDatabase.execute(
                """
                INSERT INTO kph_records (
                    id, store_id, created_by, type, detected_date, quantity, unit,
                    condition_code, resolution_code, scanned_barcode,
                    catalog_lookup_status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, DATE '2026-09-05', ?, ?, ?, ?, ?,
                    'NOT_FOUND', now(), now())
                """,
                recordId,
                scope.storeId(),
                scope.userId(),
                policyCase.type(),
                quantity,
                policyCase.unit(),
                policyCase.condition(),
                policyCase.resolution(),
                "schema-test-" + recordId);
    }

    private void assertConstraintViolation(
            TestScope scope,
            KphPolicyCase policyCase,
            String constraintName) {
        assertThatThrownBy(() -> insertKph(scope, policyCase))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("violates check constraint")
                .hasMessageContaining(constraintName);
    }

    private record TestScope(UUID userId, UUID storeId) {}

    private record KphPolicyCase(
            String type,
            String condition,
            String resolution,
            String unit) {}
}
