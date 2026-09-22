package vn.coopfood.kph.identity;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.coopfood.kph.foundation.web.ApiProblemException;

@Service
public class IdentityService {

    private final IdentityRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final Clock clock;
    // A valid current-format hash keeps a missing username on the same expensive primitive.
    private final String dummyPasswordHash;

    IdentityService(
            IdentityRepository repository,
            PasswordEncoder passwordEncoder,
            PasswordPolicy passwordPolicy,
            Clock clock) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.clock = clock;
        this.dummyPasswordHash = passwordEncoder.encode("not-a-user-credential");
    }

    @Transactional(readOnly = true)
    public SessionPrincipal authenticate(String username, String password) {
        Optional<IdentityRepository.UserCredentials> credentials = repository.findActiveCredentials(username);
        String storedHash = credentials.map(IdentityRepository.UserCredentials::passwordHash)
                .orElse(dummyPasswordHash);
        boolean passwordMatches = passwordEncoder.matches(password, storedHash);
        if (credentials.isEmpty() || !passwordMatches) {
            throw invalidCredentials();
        }
        IdentityRepository.UserCredentials authenticated = credentials.orElseThrow();
        return repository.findActiveUser(authenticated.userId())
                .map(user -> new SessionPrincipal(user, authenticated.credentialVersion()))
                .orElseThrow(this::invalidCredentials);
    }

    @Transactional(readOnly = true)
    public Optional<SessionPrincipal> refresh(UUID userId) {
        return repository.findActiveCredentialVersion(userId)
                .flatMap(version -> repository.findActiveUser(userId)
                        .map(user -> new SessionPrincipal(user, version)));
    }

    @Transactional(readOnly = true)
    public Optional<SessionPrincipal> refresh(SessionPrincipal existing) {
        return repository.findActiveCredentialVersion(existing.userId())
                .filter(version -> version == existing.credentialVersion())
                .flatMap(version -> repository.findActiveUser(existing.userId())
                        .map(user -> new SessionPrincipal(user, version)));
    }

    @Transactional
    public void changeOwnPassword(
            SessionPrincipal actor,
            String currentPassword,
            String newPassword) {
        IdentityRepository.UserCredentials credentials = repository.lockActiveCredentials(actor.userId())
                .orElseThrow(() -> new ApiProblemException(
                        HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required."));
        if (credentials.credentialVersion() != actor.credentialVersion()) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
        }
        if (!passwordEncoder.matches(currentPassword, credentials.passwordHash())) {
            throw new ApiProblemException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "CURRENT_PASSWORD_INVALID",
                    "Current password is invalid.");
        }
        passwordPolicy.validate(newPassword, actor.user().username());
        if (passwordEncoder.matches(newPassword, credentials.passwordHash())) {
            throw new ApiProblemException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "PASSWORD_REUSE_FORBIDDEN",
                    "New password must differ from the current password.");
        }

        long nextVersion = Math.addExact(credentials.credentialVersion(), 1L);
        Instant now = clock.instant();
        repository.updatePassword(
                actor.userId(), credentials.credentialVersion(), passwordEncoder.encode(newPassword), nextVersion,
                now);
        repository.insertCredentialChangedAudit(actor.userId(), nextVersion, now);
    }

    private BadCredentialsException invalidCredentials() {
        return new BadCredentialsException("Username or password is invalid.");
    }
}
