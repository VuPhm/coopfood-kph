package vn.coopfood.kph.identity;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class IdentityAdminService {

    private final IdentityRepository repository;
    private final Clock clock;

    IdentityAdminService(IdentityRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    List<AdminUserResponse> listUsers(Authentication authentication) {
        requireChainAdmin(authentication);
        return repository.listAdminUsers();
    }

    @Transactional
    AdminUserResponse deactivate(
            UUID userId,
            UserDeactivateRequest request,
            Authentication authentication) {
        SessionPrincipal actor = requireChainAdmin(authentication);
        String reason = normalizeReason(request.reason());
        if (actor.userId().equals(userId)) {
            throw problem(HttpStatus.CONFLICT, "USER_SELF_DEACTIVATION_FORBIDDEN",
                    "A chain administrator cannot deactivate their own account.");
        }

        List<UUID> activeChainAdmins = repository.lockActiveChainAdminIds();
        if (!activeChainAdmins.contains(actor.userId())) {
            throw problem(HttpStatus.FORBIDDEN, "CHAIN_ADMIN_REQUIRED",
                    "An active chain administrator is required.");
        }
        IdentityRepository.TargetUser target = repository.lockUser(userId)
                .orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "ADMIN_USER_NOT_FOUND",
                        "The user does not exist."));
        if (!target.active()) {
            throw problem(HttpStatus.CONFLICT, "ADMIN_USER_ALREADY_INACTIVE",
                    "The user is already inactive.");
        }
        if (activeChainAdmins.contains(userId) && activeChainAdmins.size() == 1) {
            throw problem(HttpStatus.CONFLICT, "LAST_CHAIN_ADMIN_REQUIRED",
                    "The last active chain administrator cannot be deactivated.");
        }
        for (UUID storeId : repository.lockActiveStoresManagedBy(userId)) {
            if (repository.lockActiveStoreManagerIds(storeId).size() == 1) {
                throw problem(HttpStatus.CONFLICT, "LAST_STORE_MANAGER_REQUIRED",
                        "A user cannot be deactivated while they are the last active manager of an active store.");
            }
        }

        Instant now = clock.instant();
        if (repository.deactivateUser(userId, now) != 1) {
            throw problem(HttpStatus.CONFLICT, "ADMIN_USER_STATE_CHANGED",
                    "The user state changed before deactivation completed.");
        }
        repository.insertUserDeactivatedAudit(actor.userId(), userId, reason, now);
        return repository.findAdminUser(userId);
    }

    private SessionPrincipal requireChainAdmin(Authentication authentication) {
        SessionPrincipal principal = requirePrincipal(authentication);
        if (!repository.isActiveChainAdmin(principal.userId())) {
            throw problem(HttpStatus.FORBIDDEN, "CHAIN_ADMIN_REQUIRED",
                    "An active chain administrator is required.");
        }
        return principal;
    }

    private SessionPrincipal requirePrincipal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw problem(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
        }
        return principal;
    }

    private String normalizeReason(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty() || normalized.length() > 500) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "USER_DEACTIVATION_REASON_INVALID",
                    "A reason from 1 to 500 characters is required.");
        }
        return normalized;
    }

    private IdentityAdminException problem(HttpStatus status, String code, String detail) {
        return new IdentityAdminException(status, code, detail);
    }
}
