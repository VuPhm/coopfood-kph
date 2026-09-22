package vn.coopfood.kph.identity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.http.converter.json.ProblemDetailJacksonMixin;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;
import vn.coopfood.kph.foundation.security.SecurityConfiguration;
import vn.coopfood.kph.foundation.web.ProblemDetailAdvice;
import vn.coopfood.kph.store.StoreController;

@SpringJUnitWebConfig(IdentitySecurityHttpTest.TestApplication.class)
class IdentitySecurityHttpTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");

    private MockMvc mockMvc;

    @Autowired
    private StubIdentityService identityService;

    @Autowired
    private WebApplicationContext applicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    private SessionPrincipal principal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .build();
        principal = new SessionPrincipal(new SessionUser(
                USER_ID,
                "manager.demo",
                "Nguyễn Văn Demo",
                Set.of(),
                List.of(new StoreContext(STORE_ID, "0001", "Nguyễn Kiệm", StoreRole.STORE_MANAGER))));
        identityService.principal = principal;
        identityService.authenticated = false;
    }

    @Test
    void loginCreatesSessionThatCanReadSessionAndStoreContext() throws Exception {
        identityService.authenticated = true;
        MockHttpSession anonymousSession = new MockHttpSession();
        String anonymousSessionId = anonymousSession.getId();

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .session(anonymousSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.user.id").value(USER_ID.toString()))
                .andExpect(jsonPath("$.user.stores[0].id").value(STORE_ID.toString()))
                .andExpect(jsonPath("$.user.stores[0].role").value("STORE_MANAGER"))
                .andExpect(jsonPath("$.csrfToken").isNotEmpty())
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertThat(session.getId()).isNotEqualTo(anonymousSessionId);
        mockMvc.perform(get("/api/v1/auth/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("manager.demo"));
        mockMvc.perform(get("/api/v1/stores").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("0001"));
    }

    @Test
    void logoutRequiresReturnedCsrfTokenAndInvalidatesSession() throws Exception {
        identityService.authenticated = true;
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        String csrfToken = objectMapper.readTree(login.getResponse().getContentAsByteArray())
                .path("csrfToken")
                .asText();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrfToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/auth/session"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void authenticatedLogoutRejectsMissingCsrfToken() throws Exception {
        identityService.authenticated = true;
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .session((MockHttpSession) login.getRequest().getSession(false)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("CSRF_VALIDATION_FAILED"));
    }

    @Test
    void passwordChangeRequiresCsrfAndInvalidatesTheCurrentSession() throws Exception {
        identityService.authenticated = true;
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        String csrfToken = objectMapper.readTree(login.getResponse().getContentAsByteArray())
                .path("csrfToken")
                .asText();
        String body = """
                {"currentPassword":"correct-password","newPassword":"A long private password 2026!"}
                """;

        mockMvc.perform(post("/api/v1/auth/password/change")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_VALIDATION_FAILED"));

        mockMvc.perform(post("/api/v1/auth/password/change")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());

        assertThat(identityService.changedCurrentPassword).isEqualTo("correct-password");
        assertThat(identityService.changedNewPassword).isEqualTo("A long private password 2026!");
        assertThat(session.isInvalid()).isTrue();
        mockMvc.perform(get("/api/v1/auth/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedStoreRequestUsesContractProblemShape() throws Exception {
        mockMvc.perform(get("/api/v1/stores"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void invalidLoginReturnsUnauthorizedWithoutCreatingASession() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"manager.demo","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andReturn();
        assertThat(result.getRequest().getSession(false)).isNull();
    }

    @Test
    void loginRejectsPropertiesOutsideThePublishedRequestSchema() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"manager.demo",
                                  "password":"correct-password",
                                  "storeId":"20000000-0000-4000-8000-000000000002"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));
    }

    @Test
    void refreshDropsRevokedMembershipAndInvalidatesDeactivatedAccount() throws Exception {
        identityService.authenticated = true;
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"manager.demo","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        identityService.principal = new SessionPrincipal(new SessionUser(
                USER_ID,
                "manager.demo",
                "Nguyễn Văn Demo",
                Set.of(),
                List.of()));
        mockMvc.perform(get("/api/v1/stores").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        identityService.principal = null;
        mockMvc.perform(get("/api/v1/auth/session").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @EnableWebSecurity
    @Import({
            SecurityConfiguration.class,
            IdentityController.class,
            StoreController.class,
            ProblemDetailAdvice.class
    })
    static class TestApplication {

        @Bean
        @Primary
        StubIdentityService identityService() {
            return new StubIdentityService();
        }

        @Bean
        ObjectMapper objectMapper() {
            return JsonMapper.builder()
                    .addMixIn(ProblemDetail.class, ProblemDetailJacksonMixin.class)
                    .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                    .build();
        }
    }

    static final class StubIdentityService extends IdentityService {

        private SessionPrincipal principal;
        private boolean authenticated;
        private String changedCurrentPassword;
        private String changedNewPassword;

        private StubIdentityService() {
            super(null, new BCryptPasswordEncoder(), new PasswordPolicy(), Clock.systemUTC());
        }

        @Override
        public SessionPrincipal authenticate(String username, String password) {
            if (!authenticated || !"manager.demo".equals(username) || !"correct-password".equals(password)) {
                throw new BadCredentialsException("Username or password is invalid.");
            }
            return principal;
        }

        @Override
        public Optional<SessionPrincipal> refresh(UUID userId) {
            return principal != null && principal.userId().equals(userId)
                    ? Optional.of(principal)
                    : Optional.empty();
        }

        @Override
        public Optional<SessionPrincipal> refresh(SessionPrincipal existing) {
            return principal != null
                    && principal.userId().equals(existing.userId())
                    && principal.credentialVersion() == existing.credentialVersion()
                    ? Optional.of(principal)
                    : Optional.empty();
        }

        @Override
        public void changeOwnPassword(
                SessionPrincipal actor,
                String currentPassword,
                String newPassword) {
            changedCurrentPassword = currentPassword;
            changedNewPassword = newPassword;
        }
    }
}
