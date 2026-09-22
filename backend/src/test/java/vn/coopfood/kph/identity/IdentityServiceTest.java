package vn.coopfood.kph.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
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
        service = new IdentityService(
                repository,
                passwordEncoder,
                new PasswordPolicy(),
                Clock.fixed(Instant.parse("2026-09-22T00:00:00Z"), ZoneOffset.UTC));
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
        repository.credentials = Optional.of(new IdentityRepository.UserCredentials(USER_ID, "stored-hash", 7L));
        repository.user = Optional.of(sessionUser);
        passwordEncoder.matches = true;

        SessionPrincipal principal = service.authenticate("manager.demo", "correct-password");

        assertThat(repository.requestedUsername).isEqualTo("manager.demo");
        assertThat(passwordEncoder.rawPassword).isEqualTo("correct-password");
        assertThat(passwordEncoder.encodedPassword).isEqualTo("stored-hash");
        assertThat(principal.user()).isEqualTo(sessionUser);
        assertThat(principal.credentialVersion()).isEqualTo(7L);
        assertThat(principal.authorities()).extracting("authority").containsExactly("ROLE_CHAIN_ADMIN");
    }

    @Test
    void performsDummyBcryptCheckWhenUsernameIsUnknown() {
        repository.credentials = Optional.empty();

        assertThatThrownBy(() -> service.authenticate("missing", "submitted-password"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Username or password is invalid.");
        assertThat(passwordEncoder.rawPassword).isEqualTo("submitted-password");
        assertThat(passwordEncoder.encodedPassword).isEqualTo("dummy-hash");
    }

    @Test
    void rejectsUserDeactivatedAfterCredentialRead() {
        repository.credentials = Optional.of(new IdentityRepository.UserCredentials(USER_ID, "stored-hash", 1L));
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

    @Test
    void changesPasswordAtomicallyWithVersionAndSecretFreeAudit() {
        SessionUser user = sessionUser();
        SessionPrincipal principal = new SessionPrincipal(user, 7L);
        repository.credentials = Optional.of(new IdentityRepository.UserCredentials(
                USER_ID, "encoded:correct-password", 7L));
        service = new IdentityService(
                repository,
                new PlainPasswordEncoder(),
                new PasswordPolicy(),
                Clock.fixed(Instant.parse("2026-09-22T00:00:00Z"), ZoneOffset.UTC));

        service.changeOwnPassword(principal, "correct-password", "Mật khẩu mới rất riêng 2026!");

        assertThat(repository.updatedPasswordHash).isEqualTo("encoded:Mật khẩu mới rất riêng 2026!");
        assertThat(repository.expectedVersion).isEqualTo(7L);
        assertThat(repository.updatedVersion).isEqualTo(8L);
        assertThat(repository.auditVersion).isEqualTo(8L);
        assertThat(repository.updatedAt).isEqualTo(Instant.parse("2026-09-22T00:00:00Z"));
    }

    @Test
    void rejectsAnIncorrectCurrentPasswordWithoutWriting() {
        SessionPrincipal principal = new SessionPrincipal(sessionUser(), 3L);
        repository.credentials = Optional.of(new IdentityRepository.UserCredentials(
                USER_ID, "encoded:correct-password", 3L));
        service = new IdentityService(
                repository,
                new PlainPasswordEncoder(),
                new PasswordPolicy(),
                Clock.systemUTC());

        assertThatThrownBy(() -> service.changeOwnPassword(
                principal, "wrong-password", "Mật khẩu mới rất riêng 2026!"))
                .isInstanceOfSatisfying(
                        IdentityProblemException.class,
                        problem -> assertThat(problem.code()).isEqualTo("CURRENT_PASSWORD_INVALID"));
        assertThat(repository.updatedPasswordHash).isNull();
        assertThat(repository.auditVersion).isNull();
    }

    private SessionUser sessionUser() {
        return new SessionUser(
                USER_ID,
                "manager.demo",
                "Nguyễn Văn Demo",
                Set.of(),
                List.of());
    }

    private static final class FakeIdentityRepository extends IdentityRepository {
        private Optional<UserCredentials> credentials = Optional.empty();
        private Optional<SessionUser> user = Optional.empty();
        private String requestedUsername;
        private String updatedPasswordHash;
        private Long expectedVersion;
        private Long updatedVersion;
        private Long auditVersion;
        private Instant updatedAt;

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

        @Override
        Optional<UserCredentials> lockActiveCredentials(UUID userId) {
            return credentials;
        }

        @Override
        void updatePassword(
                UUID userId,
                long expectedVersion,
                String passwordHash,
                long nextVersion,
                Instant now) {
            this.expectedVersion = expectedVersion;
            this.updatedPasswordHash = passwordHash;
            this.updatedVersion = nextVersion;
            this.updatedAt = now;
        }

        @Override
        void insertCredentialChangedAudit(UUID actorId, long credentialVersion, Instant now) {
            this.auditVersion = credentialVersion;
        }
    }

    private static final class RecordingPasswordEncoder implements PasswordEncoder {
        private String rawPassword;
        private String encodedPassword;
        private boolean matches;

        @Override
        public String encode(CharSequence rawPassword) {
            return "dummy-hash";
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            this.rawPassword = rawPassword.toString();
            this.encodedPassword = encodedPassword;
            return matches;
        }
    }

    private static final class PlainPasswordEncoder implements PasswordEncoder {
        @Override
        public String encode(CharSequence rawPassword) {
            return "encoded:" + rawPassword;
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            return encode(rawPassword).equals(encodedPassword);
        }
    }
}
