package vn.coopfood.kph.identity;

import java.util.Set;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String username,
        String displayName,
        boolean active,
        Set<GlobalRole> globalRoles) {

    public AdminUserResponse {
        globalRoles = Set.copyOf(globalRoles);
    }
}
