package vn.coopfood.kph.foundation;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

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

        assertThat(migrations).isEqualTo(1);
        assertThat(coreTables).isEqualTo(15);

        HttpResponse<String> health = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/health"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(health.statusCode()).isEqualTo(200);
        assertThat(health.body()).contains("UP");
    }
}
