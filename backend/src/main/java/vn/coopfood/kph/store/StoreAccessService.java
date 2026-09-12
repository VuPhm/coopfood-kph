package vn.coopfood.kph.store;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;
import vn.coopfood.kph.identity.StoreContext;

@Service
public class StoreAccessService {

    public StoreContext requireMembership(UUID storeId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw new ApiProblemException(
                    HttpStatus.UNAUTHORIZED,
                    "AUTHENTICATION_REQUIRED",
                    "Authentication is required.");
        }
        return principal.user().stores().stream()
                .filter(store -> store.id().equals(storeId))
                .findFirst()
                .orElseThrow(() -> new ApiProblemException(
                        HttpStatus.FORBIDDEN,
                        "STORE_ACCESS_DENIED",
                        "The current user is not an active member of this store."));
    }
}
