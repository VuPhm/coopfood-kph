package vn.coopfood.kph.identity;

import java.util.UUID;

public record MembershipStoreResponse(UUID id, String code, String name, UUID regionId, String regionCode, String regionName) {
}
