package vn.coopfood.kph.identity;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class MembershipAdminService {
    private static final Pattern USERNAME = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]{2,63}");
    // Match JSON Schema/ECMAScript whitespace, including nonbreaking spaces.
    private static final Pattern EDGE_SPACE = Pattern.compile(
            "^[\\s\\p{Zs}\\u2028\\u2029\\uFEFF]+|[\\s\\p{Zs}\\u2028\\u2029\\uFEFF]+$");
    private final MembershipAdminRepository repository;
    private final IdentityRepository identity;
    private final Clock clock;

    MembershipAdminService(MembershipAdminRepository repository, IdentityRepository identity, Clock clock) {
        this.repository = repository;
        this.identity = identity;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    List<MembershipStoreResponse> listStores(Authentication authentication) {
        return repository.listStores(requireActor(authentication).userId());
    }

    @Transactional(readOnly = true)
    List<StoreMembershipResponse> listMemberships(UUID storeId, Authentication authentication) {
        SessionPrincipal actor = requireActor(authentication);
        requireStore(actor, storeId);
        return repository.listMemberships(storeId);
    }

    @Transactional(readOnly = true)
    MembershipLookupUserResponse lookup(UUID storeId, MembershipRequests.Lookup request, Authentication authentication) {
        SessionPrincipal actor = requireActor(authentication);
        requireStore(actor, storeId);
        String username = request.username() == null ? "" : EDGE_SPACE.matcher(request.username()).replaceAll("");
        if (!USERNAME.matcher(username).matches()) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "MEMBERSHIP_USERNAME_INVALID", "An exact valid username is required.");
        }
        return repository.lookup(username.toLowerCase(Locale.ROOT)).orElseThrow(() -> userNotFound());
    }

    @Transactional
    StoreMembershipResponse upsert(UUID storeId, UUID userId, MembershipRequests.Upsert request,
            Authentication authentication) {
        SessionPrincipal actor = requireActor(authentication);
        requireStore(actor, storeId);
        String reason = reason(request.reason());
        StoreRole role;
        try {
            role = StoreRole.valueOf(request.role() == null ? "" : request.role());
        } catch (IllegalArgumentException exception) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "MEMBERSHIP_ROLE_INVALID", "Only EMPLOYEE or STORE_MANAGER is permitted.");
        }
        IdentityRepository.TargetUser target = identity.lockUser(userId).orElseThrow(() -> userNotFound());
        repository.lockStore(storeId);
        MembershipStoreResponse store = requireStore(requireActor(authentication), storeId);
        if (!target.active()) throw userNotFound();
        StoreMembershipResponse previous = repository.findMembership(storeId, userId).orElse(null);
        if (previous != null && previous.active() && previous.role() == role) return previous;
        guardManager(storeId, previous, role, true);
        Instant now = clock.instant();
        repository.upsert(storeId, userId, role, now);
        repository.audit(actor.userId(), store, userId, "MEMBERSHIP_UPSERTED", previous, role, true, reason, now);
        return repository.findMembership(storeId, userId).orElseThrow();
    }

    @Transactional
    StoreMembershipResponse revoke(UUID storeId, UUID userId, MembershipRequests.Revoke request,
            Authentication authentication) {
        SessionPrincipal actor = requireActor(authentication);
        requireStore(actor, storeId);
        String reason = reason(request.reason());
        identity.lockUser(userId).orElseThrow(() -> membershipNotFound());
        repository.lockStore(storeId);
        MembershipStoreResponse store = requireStore(requireActor(authentication), storeId);
        StoreMembershipResponse previous = repository.findMembership(storeId, userId)
                .orElseThrow(() -> membershipNotFound());
        if (!previous.active()) {
            throw problem(HttpStatus.CONFLICT, "MEMBERSHIP_ALREADY_REVOKED", "The membership is already revoked.");
        }
        guardManager(storeId, previous, previous.role(), false);
        Instant now = clock.instant();
        repository.revoke(storeId, userId, now);
        repository.audit(actor.userId(), store, userId, "MEMBERSHIP_REVOKED", previous, previous.role(), false, reason, now);
        return repository.findMembership(storeId, userId).orElseThrow();
    }

    private void guardManager(UUID storeId, StoreMembershipResponse previous, StoreRole nextRole, boolean nextActive) {
        if (previous != null && previous.active() && previous.userActive() && previous.role() == StoreRole.STORE_MANAGER
                && (!nextActive || nextRole != StoreRole.STORE_MANAGER)
                && identity.activeStoreManagerIds(storeId).size() <= 1) {
            throw problem(HttpStatus.CONFLICT, "LAST_STORE_MANAGER_REQUIRED", "The active store must retain an active store manager.");
        }
    }

    private SessionPrincipal requireActor(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal actor)) {
            throw problem(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
        }
        if (!repository.hasCapability(actor)) {
            throw problem(HttpStatus.FORBIDDEN, "MEMBERSHIP_ADMIN_REQUIRED", "Active chain or regional management scope is required.");
        }
        return actor;
    }

    private MembershipStoreResponse requireStore(SessionPrincipal actor, UUID storeId) {
        return repository.findStore(actor.userId(), storeId).orElseThrow(() -> problem(HttpStatus.FORBIDDEN,
                "MEMBERSHIP_STORE_SCOPE_DENIED", "The store is outside active management scope."));
    }

    private String reason(String value) {
        String normalized = value == null ? "" : EDGE_SPACE.matcher(value).replaceAll("");
        if (normalized.isEmpty() || value.codePointCount(0, value.length()) > 500) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "MEMBERSHIP_REASON_INVALID", "A nonblank reason of 1–500 characters is required.");
        }
        return normalized;
    }

    private IdentityAdminException userNotFound() {
        return problem(HttpStatus.NOT_FOUND, "MEMBERSHIP_USER_NOT_FOUND", "The active user was not found.");
    }

    private IdentityAdminException membershipNotFound() {
        return problem(HttpStatus.NOT_FOUND, "MEMBERSHIP_NOT_FOUND", "The membership was not found.");
    }

    private IdentityAdminException problem(HttpStatus status, String code, String detail) {
        return new IdentityAdminException(status, code, detail);
    }
}
