package vn.coopfood.kph.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

class IdentityServiceTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    private FakeIdentityRepository repository;
    private RecordingPasswordEncoder passwordEncoder;
    private IdentityService service;

    @BeforeEach
    void setUp() {
        repository = new FakeIdentityRepository();
        passwordEncoder = new RecordingPasswordEncoder();
        service = new IdentityService(repository, passwordEncoder);
    }

    @Test
    void authenticatesAnActiveUserAndReturnsOnlyActiveContextLoadedByRepository() {
        SessionUser sessionUser = new SessionUser(
                USER_ID,
                "manager.demo",
                "Nguyễn Văn Demo",
                Set.of(GlobalRole.CHAIN_ADMIN),
                List.of(new StoreContext(
                        UUID.fromString("20000000-0000-4000-8000-000000000001"),
                        "CF-DEMO-001",
                        "Nguyễn Kiệm",
                        StoreRole.STORE_MANAGER)));
        repository.credentials = Optional.of(new IdentityRepository.UserCredentials(USER_ID, "stored-hash"));
        repository.user = Optional.of(sessionUser);
        passwordEncoder.matches = true;

        SessionPrincipal principal = service.authenticate("manager.demo", "correct-password");

        assertThat(repository.requestedUsername).isEqualTo("manager.demo");
        assertThat(passwordEncoder.rawPassword).isEqualTo("correct-password");
        assertThat(passwordEncoder.encodedPassword).isEqualTo("stored-hash");
        assertThat(principal.user()).isEqualTo(sessionUser);
        assertThat(principal.authorities()).extracting("authority").containsExactly("ROLE_CHAIN_ADMIN");
    }

    @Test
    void performsDummyBcryptCheckWhenUsernameIsUnknown() {
        repository.credentials = Optional.empty();

        assertThatThrownBy(() -> service.authenticate("missing", "submitted-password"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Username or password is invalid.");
        assertThat(passwordEncoder.rawPassword).isEqualTo("submitted-password");
        assertThat(passwordEncoder.encodedPassword).startsWith("$2a$10$").hasSize(60);
    }

    @Test
    void rejectsUserDeactivatedAfterCredentialRead() {
        repository.credentials = Optional.of(new IdentityRepository.UserCredentials(USER_ID, "stored-hash"));
        repository.user = Optional.empty();
        passwordEncoder.matches = true;

        assertThatThrownBy(() -> service.authenticate("manager.demo", "correct-password"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Username or password is invalid.");
    }

    @Test
    void sessionPrincipalRoundTripsThroughJavaSerialization() throws Exception {
        SessionPrincipal principal = new SessionPrincipal(new SessionUser(
                USER_ID,
                "manager.demo",
                "Nguyễn Văn Demo",
                Set.of(GlobalRole.CATALOG_ADMIN),
                List.of(new StoreContext(
                        UUID.fromString("20000000-0000-4000-8000-000000000001"),
                        "0001",
                        "Nguyễn Kiệm",
                        StoreRole.STORE_MANAGER))));

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ObjectOutputStream output = new ObjectOutputStream(bytes)) {
            output.writeObject(principal);
        }
        Object restored;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes.toByteArray()))) {
            restored = input.readObject();
        }

        assertThat(restored).isEqualTo(principal);
    }

    private static final class FakeIdentityRepository extends IdentityRepository {
        private Optional<UserCredentials> credentials = Optional.empty();
        private Optional<SessionUser> user = Optional.empty();
        private String requestedUsername;

        private FakeIdentityRepository() {
            super(null);
        }

        @Override
        Optional<UserCredentials> findActiveCredentials(String username) {
            requestedUsername = username;
            return credentials;
        }

        @Override
        Optional<SessionUser> findActiveUser(UUID userId) {
            return user;
        }
    }

    private static final class RecordingPasswordEncoder implements PasswordEncoder {
        private String rawPassword;
        private String encodedPassword;
        private boolean matches;

        @Override
        public String encode(CharSequence rawPassword) {
            throw new UnsupportedOperationException();
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            this.rawPassword = rawPassword.toString();
            this.encodedPassword = encodedPassword;
            return matches;
        }
    }
}
