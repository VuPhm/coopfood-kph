package vn.coopfood.kph.store;

import java.util.List;
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
        return repository.findActiveAccess(requirePrincipal(authentication).userId(), storeId)
                .orElseThrow(() -> new ApiProblemException(
                        HttpStatus.FORBIDDEN,
                        "STORE_ACCESS_DENIED",
                        "The store or its region is inactive, or the current user has no active scope for it."));
    }

    List<EffectiveStoreAccess> listActiveAccess(Authentication authentication) {
        return repository.findAllActiveAccess(requirePrincipal(authentication).userId()).stream()
                .map(access -> new EffectiveStoreAccess(
                        access.storeId(), access.storeCode(), access.storeName(),
                        new EffectiveStoreAccess.KphCapabilities(
                                access.canViewCreate(), access.canViewCreate(),
                                access.canReviewExport(), access.canReviewExport())))
                .toList();
    }

    private SessionPrincipal requirePrincipal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "AUTHENTICATION_REQUIRED",
                    "Authentication is required.");
        }
        return principal;
    }
}
