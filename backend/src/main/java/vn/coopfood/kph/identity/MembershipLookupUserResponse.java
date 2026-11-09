package vn.coopfood.kph.identity;

import java.util.UUID;

public record MembershipLookupUserResponse(UUID id, String username, String displayName) {
}
