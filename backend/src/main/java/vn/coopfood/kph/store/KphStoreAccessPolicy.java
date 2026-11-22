package vn.coopfood.kph.store;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;

@Service
public class KphStoreAccessPolicy {

    private final StoreAccessResolver resolver;

    KphStoreAccessPolicy(StoreAccessResolver resolver) {
        this.resolver = resolver;
    }

    public StoreRef requireViewCreate(UUID storeId, Authentication authentication) {
        StoreAccessRepository.AccessSnapshot access = resolver.requireActiveStore(storeId, authentication);
        if (!access.canViewCreate()) {
            throw forbidden(
                    "STORE_ACCESS_DENIED",
                    "Active store membership, region scope or chain scope is required for KPH access.");
        }
        return storeRef(access);
    }

    public StoreRef requireReview(UUID storeId, Authentication authentication) {
        StoreAccessRepository.AccessSnapshot access = resolver.requireActiveStore(storeId, authentication);
        if (!access.canReview()) {
            throw forbidden("STORE_MANAGER_REQUIRED", "Active store manager membership in this store is required for review.");
        }
        return storeRef(access);
    }

    public StoreRef requireExport(UUID storeId, Authentication authentication) {
        StoreAccessRepository.AccessSnapshot access = resolver.requireActiveStore(storeId, authentication);
        if (!access.canExport()) {
            throw forbidden(
                    "STORE_MANAGER_REQUIRED",
                    "Active KPH manager scope for this store, its region or the chain is required.");
        }
        return storeRef(access);
    }

    private StoreRef storeRef(StoreAccessRepository.AccessSnapshot access) {
        return new StoreRef(access.storeId(), access.storeCode(), access.storeName());
    }

    private ApiProblemException forbidden(String code, String detail) {
        return new ApiProblemException(HttpStatus.FORBIDDEN, code, detail);
    }
}
