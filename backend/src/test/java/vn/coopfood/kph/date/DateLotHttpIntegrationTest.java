package vn.coopfood.kph.date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;

import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import tools.jackson.databind.ObjectMapper;
import vn.coopfood.kph.identity.SessionPrincipal;
import vn.coopfood.kph.identity.SessionUser;
import vn.coopfood.kph.foundation.time.TimeConfiguration;

@Testcontainers
@SpringBootTest
class DateLotHttpIntegrationTest {
    @Container @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired WebApplicationContext context;
    @Autowired DSLContext db;
    @Autowired ObjectMapper mapper;
    @Value("${kph.media-root:./.data/kph-media}") String mediaRootValue;
    MockMvc mvc;
    final UUID employee = UUID.randomUUID(), a = UUID.randomUUID(), b = UUID.randomUUID();
    final UUID regionA = UUID.randomUUID(), regionB = UUID.randomUUID();
    final String key = "date-create-000001";
    final String input = """
            {"lookupStatus":"MANUAL","barcode":null,"skuCode":"00123","productName":"Hàng mẫu",
             "lotCode":null,"manufacturedOn":null,"expiresOn":"2026-12-25","trackedQuantity":"1.2345","unit":"kg"}
            """;
    final String lots = "/api/v1/stores/" + a + "/date-lots";
    RequestPostProcessor actor;

    @BeforeEach void seed() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        db.execute("TRUNCATE app_users, regions, stores CASCADE");
        db.execute("INSERT INTO app_users(id, username, display_name, password_hash, active, created_at, updated_at) VALUES (?, 'date.test', 'DATE Test', 'fixture', true, now(), now())", employee);
        for (UUID region : List.of(regionA, regionB)) {
            db.execute("INSERT INTO regions(id,region_code,region_name,active,created_at,updated_at) VALUES (?,?, 'Vùng',true,now(),now())", region, region.equals(regionA) ? "R-1" : "R-2");
        }
        db.execute("INSERT INTO stores(id,region_id,store_code,store_name,active,created_at,updated_at) VALUES (?,?,'001','A',true,now(),now()), (?,?,'002','B',true,now(),now())", a,regionA,b,regionB);
        db.execute("INSERT INTO store_memberships(user_id,store_id,role,active,created_at,updated_at) VALUES (?,?,'EMPLOYEE',true,now(),now())",employee,a);
        var principal = new SessionPrincipal(new SessionUser(employee,"date.test","DATE Test",Set.of(),List.of()));
        actor = authentication(UsernamePasswordAuthenticationToken.authenticated(principal,null,principal.authorities()));
    }

    @Test void saveReplayAndEditShareStoreMemoryAndKeepOneAuditPerWrite() throws Exception {
        mvc.perform(get("/api/v1/date/stores").with(actor)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].capabilities.length()").value(3));
        mvc.perform(post(lots).with(actor).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(input))
                .andExpect(status().isForbidden());
        var response = mvc.perform(post(lots).with(actor).with(csrf()).header("Idempotency-Key",key)
                        .contentType(MediaType.APPLICATION_JSON).content(input))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.lot.remainingQuantity").value("1.2345"))
                .andExpect(jsonPath("$.duplicateWarning").value(false)).andReturn().getResponse().getContentAsByteArray();
        String id = mapper.readTree(response).path("lot").path("id").asText();
        String detail = lots + "/" + id;
        String update = input.stripTrailing().replace("1.2345","2.54321").replace("Hàng mẫu","Hàng mới")
                .replace("}",",\"expectedVersion\":1,\"reason\":\"Kiểm đếm lại\"}");
        mvc.perform(patch(detail).with(actor).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(update)).andExpect(status().isForbidden());
        db.execute("UPDATE store_memberships SET role='STORE_MANAGER' WHERE user_id=? AND store_id=?",employee,a);
        mvc.perform(patch(detail).with(actor).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk()).andExpect(jsonPath("$.lot.version").value(2));
        String updateAtVersion2 = update.replace("\"expectedVersion\":1", "\"expectedVersion\":2");
        db.execute("UPDATE store_memberships SET role='EMPLOYEE' WHERE user_id=? AND store_id=?",employee,a);
        db.execute("INSERT INTO user_region_assignments(user_id,region_id,active,created_at,updated_at) VALUES (?,?,true,now(),now())",employee,regionA);
        mvc.perform(patch(detail).with(actor).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(updateAtVersion2))
                .andExpect(status().isOk()).andExpect(jsonPath("$.lot.version").value(3));
        mvc.perform(patch(detail).with(actor).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(updateAtVersion2)).andExpect(status().isConflict());
        mvc.perform(post(lots).with(actor).with(csrf()).header("Idempotency-Key",key)
                .contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isCreated())
                .andExpect(content().json(new String(response,java.nio.charset.StandardCharsets.UTF_8)));
        mvc.perform(post(lots).with(actor).with(csrf()).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON)
                .content(input.replace("00123","00124"))).andExpect(status().isConflict());
        mvc.perform(get(detail).with(actor)).andExpect(status().isOk()).andExpect(jsonPath("$.productName").value("Hàng mới"));
        mvc.perform(get(lots).param("q","001").with(actor)).andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/api/v1/stores/"+a+"/date-sku-suggestions").param("q","001").with(actor))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].skuCode").value("00123")).andExpect(jsonPath("$[0].productName").value("Hàng mới"));
        mvc.perform(get("/api/v1/stores/"+b+"/date-sku-suggestions").with(actor)).andExpect(status().isForbidden());
        assertThat(db.fetchValue("SELECT count(*) FROM audit_events WHERE target_id = ?", UUID.fromString(id))).isEqualTo(3L);
        mvc.perform(get("/api/v1/stores/"+b+"/date-sku-suggestions").with(actor)).andExpect(status().isForbidden());
        db.execute("INSERT INTO user_roles(user_id,role) VALUES (?,'CHAIN_ADMIN')", employee);
        mvc.perform(get("/api/v1/stores/"+b+"/date-sku-suggestions").with(actor)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/stores/"+b+"/date-lots/"+id).with(actor)).andExpect(status().isNotFound());
        db.execute("UPDATE user_region_assignments SET active=false WHERE user_id=?",employee);
        db.execute("DELETE FROM user_roles WHERE user_id=?",employee);
        mvc.perform(patch(detail).with(actor).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(update)).andExpect(status().isForbidden());
    }

    @Test void partialProcessingIsAtomicScopedAndReplaysItsStableReceipt() throws Exception {
        String lotId=createLot("1.25025");
        String endpoint=lots+"/"+lotId+"/kph";
        String first=processPayload(1,"0.37525");
        mvc.perform(multipart(endpoint).file(part(first)).file(photo()).with(actor).with(csrf()).header("Idempotency-Key","date-process-00001"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.quantity").value("0.37525"))
                .andExpect(jsonPath("$.remainingAfter").value("0.87500"));
        mvc.perform(multipart("/api/v1/stores/"+b+"/date-lots/"+lotId+"/kph").file(part(first)).file(photo()).with(actor).with(csrf()).header("Idempotency-Key","date-process-other1"))
                .andExpect(status().isForbidden());
        mvc.perform(multipart(endpoint).file(part(processPayload(2,"0.87501"))).file(photo()).with(actor).with(csrf()).header("Idempotency-Key","date-process-over01"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(multipart(endpoint).file(part(processPayload(1,"0.1"))).file(photo()).with(actor).with(csrf()).header("Idempotency-Key","date-process-stale1"))
                .andExpect(status().isConflict());
        String second=processPayload(2,"0.875");
        mvc.perform(multipart(endpoint).file(part(second)).file(photo()).with(actor).with(csrf()).header("Idempotency-Key","date-process-00002"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.remainingAfter").value("0.00000"));
        mvc.perform(multipart(endpoint).file(part(first)).file(photo()).with(actor).with(csrf()).header("Idempotency-Key","date-process-00001"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.resultingVersion").value(2)).andExpect(jsonPath("$.remainingAfter").value("0.87500"));
        mvc.perform(get(lots+"/"+lotId).with(actor)).andExpect(status().isOk())
                .andExpect(jsonPath("$.processingHistory.length()").value(2)).andExpect(jsonPath("$.kphType").value("TPCN"))
                .andExpect(jsonPath("$.processedQuantity").value("1.25025"));
        mvc.perform(get(lots).with(actor)).andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(0));
        assertThat(db.fetchValue("SELECT count(*) FROM kph_records")).isEqualTo(2L);
        assertThat(db.fetchValue("SELECT count(*) FROM date_lot_processing_links WHERE lot_id=?",UUID.fromString(lotId))).isEqualTo(2L);
    }

    @Test void processingDatabaseRollbackRestoresLotAndDeletesPrivateMedia() throws Exception {
        String lotId=createLot("1.25");
        Path root=Path.of(mediaRootValue).toAbsolutePath().normalize();
        Set<Path> before;
        try(var paths=Files.walk(root)){ before=paths.filter(Files::isRegularFile).collect(Collectors.toUnmodifiableSet()); }
        db.execute("CREATE OR REPLACE FUNCTION fail_date_processing_link() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic DATE link failure'; END; $$");
        db.execute("CREATE TRIGGER fail_date_processing_link_trigger BEFORE INSERT ON date_lot_processing_links FOR EACH ROW EXECUTE FUNCTION fail_date_processing_link()");
        try {
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> mvc.perform(multipart(lots+"/"+lotId+"/kph").file(part(processPayload(1,"0.25"))).file(photoUnchecked()).with(actor).with(csrf()).header("Idempotency-Key","date-process-rollback1")))
                    .isInstanceOf(jakarta.servlet.ServletException.class).hasMessageContaining("synthetic DATE link failure");
        } finally {
            db.execute("DROP TRIGGER IF EXISTS fail_date_processing_link_trigger ON date_lot_processing_links");
            db.execute("DROP FUNCTION IF EXISTS fail_date_processing_link()");
        }
        try(var paths=Files.walk(root)){ assertThat(paths.filter(Files::isRegularFile).collect(Collectors.toUnmodifiableSet())).containsExactlyInAnyOrderElementsOf(before); }
        assertThat(db.fetchOne("SELECT processed_quantity FROM date_lots WHERE id=?",UUID.fromString(lotId)).get(0,java.math.BigDecimal.class)).isEqualByComparingTo("0");
        assertThat(db.fetchValue("SELECT count(*) FROM kph_records")).isEqualTo(0L);
        assertThat(db.fetchValue("SELECT count(*) FROM date_lot_process_receipts")).isEqualTo(0L);
    }

    @Test void concurrentDifferentKeysCannotOverProcessOneVersion() throws Exception {
        String lotId=createLot("1.25");
        String endpoint=lots+"/"+lotId+"/kph";
        var first=CompletableFuture.supplyAsync(()->submitProcess(endpoint,"date-race-key-0001",processPayload(1,"0.75")));
        var second=CompletableFuture.supplyAsync(()->submitProcess(endpoint,"date-race-key-0002",processPayload(1,"0.75")));
        int one=first.get(), two=second.get();
        assertThat(List.of(one,two)).containsExactlyInAnyOrder(201,409);
        assertThat(db.fetchValue("SELECT count(*) FROM date_lot_processing_links WHERE lot_id=?",UUID.fromString(lotId))).isEqualTo(1L);
        assertThat(db.fetchOne("SELECT processed_quantity FROM date_lots WHERE id=?",UUID.fromString(lotId)).get(0,java.math.BigDecimal.class)).isEqualByComparingTo("0.75");
    }
    private int submitProcess(String endpoint,String key,String payload) {
        try { return mvc.perform(multipart(endpoint).file(part(payload)).file(photo()).with(actor).with(csrf()).header("Idempotency-Key",key)).andReturn().getResponse().getStatus(); }
        catch(Exception e){ throw new IllegalStateException(e); }
    }

    private String createLot(String quantity) throws Exception {
        String body=input.replace("1.2345",quantity);
        var response=mvc.perform(post(lots).with(actor).with(csrf()).header("Idempotency-Key","date-lot-process-01")
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsByteArray();
        return mapper.readTree(response).path("lot").path("id").asText();
    }
    private String processPayload(long version,String quantity) {
        return "{\"expectedVersion\":"+version+",\"kph\":{\"type\":\"TPCN\",\"detectedDate\":\""+java.time.LocalDate.now(TimeConfiguration.BUSINESS_ZONE)+"\",\"quantity\":\""+quantity+"\",\"unit\":\"kg\",\"condition\":\"OTHER\",\"resolution\":\"OTHER\"}}";
    }
    private MockMultipartFile part(String body) { return new MockMultipartFile("payload","payload.json","application/json",body.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
    private MockMultipartFile photo() throws Exception {
        BufferedImage image=new BufferedImage(12,12,BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes=new ByteArrayOutputStream(); ImageIO.write(image,"jpg",bytes);
        return new MockMultipartFile("photos","evidence.jpg","image/jpeg",bytes.toByteArray());
    }
    private MockMultipartFile photoUnchecked() {
        try{return photo();}catch(Exception e){throw new IllegalStateException(e);}
    }
}
