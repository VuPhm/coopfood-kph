package vn.coopfood.kph.lifecycle;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LifecycleScheduleResponse(
        UUID id,
        LifecycleTargetResponse target,
        LocalDate effectiveDate,
        LifecycleScheduleStatus status,
        String reason,
        ActorSnapshot createdBy,
        Instant createdAt,
        ActorSnapshot updatedBy,
        Instant updatedAt,
        Instant cancelledAt,
        Instant executedAt) {

    public record ActorSnapshot(UUID id, String displayName) {
    }
}
