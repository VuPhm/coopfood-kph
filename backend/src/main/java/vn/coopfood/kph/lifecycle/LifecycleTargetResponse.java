package vn.coopfood.kph.lifecycle;

import java.util.UUID;

public record LifecycleTargetResponse(
        LifecycleTargetType type,
        UUID id,
        String code,
        String name,
        UUID regionId,
        String regionCode,
        String regionName) {
}
