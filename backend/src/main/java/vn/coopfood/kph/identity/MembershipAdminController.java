package vn.coopfood.kph.identity;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
class MembershipAdminController {
    private final MembershipAdminService service;

    MembershipAdminController(MembershipAdminService service) {
        this.service = service;
    }

    @GetMapping("/membership-stores")
    List<MembershipStoreResponse> stores(Authentication authentication) {
        return service.listStores(authentication);
    }

    @GetMapping("/stores/{storeId}/memberships")
    List<StoreMembershipResponse> memberships(@PathVariable UUID storeId, Authentication authentication) {
        return service.listMemberships(storeId, authentication);
    }

    @PostMapping("/stores/{storeId}/membership-user-lookup")
    MembershipLookupUserResponse lookup(@PathVariable UUID storeId,
            @RequestBody MembershipRequests.Lookup request, Authentication authentication) {
        return service.lookup(storeId, request, authentication);
    }

    @PutMapping("/stores/{storeId}/memberships/{userId}")
    StoreMembershipResponse upsert(@PathVariable UUID storeId, @PathVariable UUID userId,
            @RequestBody MembershipRequests.Upsert request, Authentication authentication) {
        return service.upsert(storeId, userId, request, authentication);
    }

    @PostMapping("/stores/{storeId}/memberships/{userId}/revoke")
    StoreMembershipResponse revoke(@PathVariable UUID storeId, @PathVariable UUID userId,
            @RequestBody MembershipRequests.Revoke request, Authentication authentication) {
        return service.revoke(storeId, userId, request, authentication);
    }
}
