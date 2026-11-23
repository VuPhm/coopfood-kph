package vn.coopfood.kph.store;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;

@Service
public class DateStoreAccessPolicy {
    private final StoreAccessResolver resolver;

    DateStoreAccessPolicy(StoreAccessResolver resolver) {
        this.resolver = resolver;
    }

    public record Store(UUID id, String code, String name, List<String> capabilities) {}

    public List<Store> list(Authentication authentication) {
        return resolver.listActiveScopes(authentication).stream()
                .map(access -> new Store(access.storeId(), access.storeCode(), access.storeName(),
                        access.hasManagementScope() ? List.of("VIEW", "CREATE", "UPDATE", "REMIND", "PROCESS", "REPORT") : List.of("VIEW", "CREATE", "PROCESS")))
                .toList();
    }

    public void requireAccess(UUID storeId, Authentication authentication) {
        if (!resolver.requireActiveStore(storeId, authentication).canViewCreate()) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "DATE_ACCESS_DENIED", "DATE store access is required.");
        }
    }

    public void requireUpdate(UUID storeId, Authentication authentication) {
        if (!resolver.requireActiveStore(storeId, authentication).hasManagementScope()) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "DATE_UPDATE_DENIED", "DATE management scope is required.");
        }
    }

    public Store requireReport(UUID storeId, Authentication authentication) {
        var scope = resolver.requireActiveStore(storeId, authentication);
        if (!scope.hasManagementScope()) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "DATE_REPORT_DENIED", "Report management scope is required.");
        }
        return new Store(scope.storeId(), scope.storeCode(), scope.storeName(), List.of("REPORT"));
    }

    public void requireRemind(UUID storeId, Authentication authentication) {
        if (!resolver.requireActiveStore(storeId, authentication).hasManagementScope()) {
            throw new ApiProblemException(HttpStatus.FORBIDDEN, "DATE_REMIND_DENIED", "DATE management scope is required.");
        }
    }

    public void requireProcess(UUID storeId, Authentication authentication) { requireAccess(storeId, authentication); }
}
