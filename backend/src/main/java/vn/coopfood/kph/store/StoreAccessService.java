package vn.coopfood.kph.store;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;
import vn.coopfood.kph.identity.StoreRole;

@Service
public class StoreAccessService {

    private final StoreAccessRepository repository;

    public StoreAccessService(StoreAccessRepository repository) {
        this.repository = repository;
    }

    public AuthorizedStore requireMembership(UUID storeId, Authentication authentication) {
        StoreAccessRepository.AccessSnapshot access = activeAccess(storeId, authentication);
        if (access.membershipRole() == null && !access.regionManager() && !access.chainAdmin()) {
            throw forbidden("STORE_ACCESS_DENIED",
                    "The current user has no active store, region or chain scope for this store.");
        }
        return authorizedStore(access);
    }

    public AuthorizedStore requireStoreManager(UUID storeId, Authentication authentication) {
        StoreAccessRepository.AccessSnapshot access = activeAccess(storeId, authentication);
        if (access.membershipRole() != StoreRole.STORE_MANAGER
                && !access.regionManager()
                && !access.chainAdmin()) {
            throw forbidden("STORE_MANAGER_REQUIRED",
                    "Active manager scope for this store, its region or the chain is required.");
        }
        return authorizedStore(access);
    }

    private StoreAccessRepository.AccessSnapshot activeAccess(UUID storeId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "AUTHENTICATION_REQUIRED",
                    "Authentication is required.");
        }
        return repository.findActiveAccess(principal.userId(), storeId)
                .orElseThrow(() -> forbidden(
                        "STORE_ACCESS_DENIED",
                        "The store is inactive or the current user has no active scope for it."));
    }

    private AuthorizedStore authorizedStore(StoreAccessRepository.AccessSnapshot access) {
        return new AuthorizedStore(access.storeId(), access.storeCode(), access.storeName());
    }

    private ApiProblemException forbidden(String code, String detail) {
        return new ApiProblemException(HttpStatus.FORBIDDEN, code, detail);
    }

    public record AuthorizedStore(UUID id, String code, String name) {
    }
}
