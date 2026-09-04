package vn.coopfood.kph.identity;

import java.util.Optional;
import java.util.UUID;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdentityService {

    // A valid hash keeps missing-user and wrong-password paths on the same expensive primitive.
    private static final String DUMMY_PASSWORD_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoO5jZB27ThC01rTftNAc1HR83wY8cM6oy";

    private final IdentityRepository repository;
    private final PasswordEncoder passwordEncoder;

    IdentityService(IdentityRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public SessionPrincipal authenticate(String username, String password) {
        Optional<IdentityRepository.UserCredentials> credentials = repository.findActiveCredentials(username);
        String storedHash = credentials.map(IdentityRepository.UserCredentials::passwordHash)
                .orElse(DUMMY_PASSWORD_HASH);
        boolean passwordMatches = passwordEncoder.matches(password, storedHash);
        if (credentials.isEmpty() || !passwordMatches) {
            throw invalidCredentials();
        }
        return refresh(credentials.orElseThrow().userId()).orElseThrow(this::invalidCredentials);
    }

    @Transactional(readOnly = true)
    public Optional<SessionPrincipal> refresh(UUID userId) {
        return repository.findActiveUser(userId).map(SessionPrincipal::new);
    }

    private BadCredentialsException invalidCredentials() {
        return new BadCredentialsException("Username or password is invalid.");
    }
}
