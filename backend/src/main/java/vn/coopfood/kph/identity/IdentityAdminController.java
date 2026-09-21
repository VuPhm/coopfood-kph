package vn.coopfood.kph.identity;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
class IdentityAdminController {

    private final IdentityAdminService service;

    IdentityAdminController(IdentityAdminService service) {
        this.service = service;
    }

    @GetMapping
    List<AdminUserResponse> list(Authentication authentication) {
        return service.listUsers(authentication);
    }

    @PostMapping("/{userId}/deactivate")
    AdminUserResponse deactivate(
            @PathVariable UUID userId,
            @Valid @RequestBody UserDeactivateRequest request,
            Authentication authentication) {
        return service.deactivate(userId, request, authentication);
    }
}
