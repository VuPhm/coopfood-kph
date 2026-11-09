package vn.coopfood.kph.store;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class KphStoreDiscoveryController {
    private final StoreAccessResolver resolver;

    KphStoreDiscoveryController(StoreAccessResolver resolver) {
        this.resolver = resolver;
    }

    @GetMapping("/api/v1/kph/stores")
    ResponseEntity<List<KphStoreAccess>> listMyStoreAccess(Authentication authentication) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(resolver.listActiveAccess(authentication));
    }
}
