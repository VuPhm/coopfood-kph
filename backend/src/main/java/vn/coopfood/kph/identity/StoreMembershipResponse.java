package vn.coopfood.kph.identity;

import java.util.UUID;

public record StoreMembershipResponse(UUID userId, String username, String displayName, boolean userActive, StoreRole role, boolean active) {
}
