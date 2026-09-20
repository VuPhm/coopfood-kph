package vn.coopfood.kph.store;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;

@Service
class StoreAccessResolver {

    private final StoreAccessRepository repository;

    StoreAccessResolver(StoreAccessRepository repository) {
        this.repository = repository;
    }

    StoreAccessRepository.AccessSnapshot requireActiveStore(
            UUID storeId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "AUTHENTICATION_REQUIRED",
                    "Authentication is required.");
        }
        return repository.findActiveAccess(principal.userId(), storeId)
                .orElseThrow(() -> new ApiProblemException(
                        HttpStatus.FORBIDDEN,
                        "STORE_ACCESS_DENIED",
                        "The store or its region is inactive, or the current user has no active scope for it."));
    }
}
