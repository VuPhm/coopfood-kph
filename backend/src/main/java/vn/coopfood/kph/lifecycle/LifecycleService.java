package vn.coopfood.kph.lifecycle;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;

@Service
class LifecycleService {

    static final int MINIMUM_LEAD_DAYS = 30;

    private final LifecycleRepository repository;
    private final Clock clock;

    LifecycleService(LifecycleRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    List<LifecycleTargetResponse> listTargets(Authentication authentication) {
        UUID actorId = requireLifecycleActor(authentication).userId();
        return repository.listAuthorizedTargets(actorId);
    }

    @Transactional(readOnly = true)
    List<LifecycleScheduleResponse> listSchedules(Authentication authentication) {
        UUID actorId = requireLifecycleActor(authentication).userId();
        return repository.listAuthorizedSchedules(actorId);
    }

    @Transactional
    LifecycleScheduleResponse create(LifecycleScheduleCreateRequest request, Authentication authentication) {
        SessionPrincipal actor = requireLifecycleActor(authentication);
        String reason = normalizeReason(request.reason());
        validateEffectiveDate(request.effectiveDate());
        LifecycleRepository.TargetRecord target = requireAuthorizedTarget(
                actor.userId(), request.targetType(), request.targetId());
        requireActiveTarget(target);

        UUID scheduleId = UUID.randomUUID();
        Instant now = clock.instant();
        try {
            repository.insertSchedule(scheduleId, request.targetType(), request.targetId(),
                    request.effectiveDate(), reason, actor.userId(), now);
        } catch (DuplicateKeyException exception) {
            throw problem(HttpStatus.CONFLICT, "LIFECYCLE_SCHEDULE_EXISTS",
                    "This target already has a pending deactivation schedule.");
        }
        repository.insertAudit(actor.userId(), action(request.targetType(), "SCHEDULED"),
                request.targetType(), request.targetId(), storeId(target.response()), scheduleId,
                request.effectiveDate(), reason, now);
        return repository.findSchedule(scheduleId).orElseThrow();
    }

    @Transactional
    LifecycleScheduleResponse reschedule(UUID scheduleId, LifecycleRescheduleRequest request,
            Authentication authentication) {
        SessionPrincipal actor = requireLifecycleActor(authentication);
        String reason = normalizeReason(request.reason());
        validateEffectiveDate(request.effectiveDate());
        LifecycleScheduleResponse schedule = requirePendingSchedule(scheduleId, actor.userId());
        requireActiveTarget(requireAuthorizedTarget(actor.userId(), schedule.target().type(), schedule.target().id()));
        Instant now = clock.instant();
        repository.reschedule(scheduleId, request.effectiveDate(), reason, actor.userId(), now);
        repository.insertAudit(actor.userId(), action(schedule.target().type(), "RESCHEDULED"),
                schedule.target().type(), schedule.target().id(), storeId(schedule.target()), scheduleId,
                request.effectiveDate(), reason, now);
        return repository.findSchedule(scheduleId).orElseThrow();
    }

    @Transactional
    LifecycleScheduleResponse cancel(UUID scheduleId, LifecycleReasonRequest request,
            Authentication authentication) {
        SessionPrincipal actor = requireLifecycleActor(authentication);
        String reason = normalizeReason(request.reason());
        LifecycleScheduleResponse schedule = requirePendingSchedule(scheduleId, actor.userId());
        Instant now = clock.instant();
        repository.cancel(scheduleId, reason, actor.userId(), now);
        repository.insertAudit(actor.userId(), action(schedule.target().type(), "CANCELLED"),
                schedule.target().type(), schedule.target().id(), storeId(schedule.target()), scheduleId,
                schedule.effectiveDate(), reason, now);
        return repository.findSchedule(scheduleId).orElseThrow();
    }

    @Transactional
    LifecycleScheduleResponse execute(UUID scheduleId, LifecycleReasonRequest request,
            Authentication authentication) {
        SessionPrincipal actor = requireLifecycleActor(authentication);
        String reason = normalizeReason(request.reason());
        LifecycleScheduleResponse schedule = requirePendingSchedule(scheduleId, actor.userId());
        LifecycleRepository.TargetRecord target = requireAuthorizedTarget(
                actor.userId(), schedule.target().type(), schedule.target().id());
        requireActiveTarget(target);
        LocalDate today = LocalDate.now(clock);
        if (today.isBefore(schedule.effectiveDate())) {
            throw problem(HttpStatus.CONFLICT, "LIFECYCLE_SCHEDULE_NOT_DUE",
                    "The target cannot be deactivated before the scheduled effective date.");
        }

        Instant now = clock.instant();
        if (schedule.target().type() == LifecycleTargetType.REGION) {
            if (repository.countActiveStores(schedule.target().id()) > 0) {
                throw problem(HttpStatus.CONFLICT, "REGION_HAS_ACTIVE_STORES",
                        "Deactivate every store in the region before deactivating the region.");
            }
            repository.deactivateRegion(schedule.target().id(), now);
        } else {
            if (!target.regionActive()) {
                throw problem(HttpStatus.CONFLICT, "STORE_REGION_INACTIVE",
                        "The store region must remain active until store deactivation completes.");
            }
            if (repository.countActiveStoreManagers(schedule.target().id()) == 0) {
                throw problem(HttpStatus.CONFLICT, "ACTIVE_STORE_MANAGER_REQUIRED",
                        "The active store must still have an active STORE_MANAGER at execution time.");
            }
            repository.deactivateStore(schedule.target().id(), now);
        }

        repository.markExecuted(scheduleId, reason, actor.userId(), now);
        repository.insertAudit(actor.userId(), schedule.target().type().name() + "_DEACTIVATED",
                schedule.target().type(), schedule.target().id(), storeId(schedule.target()), scheduleId,
                schedule.effectiveDate(), reason, now);
        return repository.findSchedule(scheduleId).orElseThrow();
    }

    private SessionPrincipal requireLifecycleActor(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw problem(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
        }
        if (!repository.hasLifecycleCapability(principal.userId())) {
            throw problem(HttpStatus.FORBIDDEN, "LIFECYCLE_ADMIN_REQUIRED",
                    "Active chain or regional lifecycle scope is required.");
        }
        return principal;
    }

    private LifecycleRepository.TargetRecord requireAuthorizedTarget(
            UUID actorId, LifecycleTargetType targetType, UUID targetId) {
        return repository.findAuthorizedTarget(actorId, targetType, targetId).orElseThrow(() -> {
            if (repository.targetExists(targetType, targetId)) {
                return problem(HttpStatus.FORBIDDEN, "LIFECYCLE_TARGET_SCOPE_DENIED",
                        "The target is outside the actor's active lifecycle scope.");
            }
            return problem(HttpStatus.NOT_FOUND, "LIFECYCLE_TARGET_NOT_FOUND",
                    "The lifecycle target does not exist.");
        });
    }

    private LifecycleScheduleResponse requirePendingSchedule(UUID scheduleId, UUID actorId) {
        LifecycleScheduleResponse schedule = repository.lockSchedule(scheduleId)
                .orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "LIFECYCLE_SCHEDULE_NOT_FOUND",
                        "The lifecycle schedule does not exist."));
        // Scope must be checked before disclosing whether a schedule is terminal.
        requireAuthorizedTarget(actorId, schedule.target().type(), schedule.target().id());
        if (schedule.status() != LifecycleScheduleStatus.SCHEDULED) {
            throw problem(HttpStatus.CONFLICT, "LIFECYCLE_SCHEDULE_FINAL",
                    "A cancelled or executed lifecycle schedule cannot be changed.");
        }
        return schedule;
    }

    private void validateEffectiveDate(LocalDate effectiveDate) {
        LocalDate minimum = LocalDate.now(clock).plusDays(MINIMUM_LEAD_DAYS);
        if (effectiveDate.isBefore(minimum)) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "EFFECTIVE_DATE_TOO_SOON",
                    "The effective date must be at least 30 calendar days after the server date.");
        }
    }

    private void requireActiveTarget(LifecycleRepository.TargetRecord target) {
        if (!target.active()) {
            throw problem(HttpStatus.CONFLICT, "LIFECYCLE_TARGET_INACTIVE",
                    "Only an active target can be scheduled or deactivated.");
        }
        if (target.response().type() == LifecycleTargetType.STORE && !target.regionActive()) {
            throw problem(HttpStatus.CONFLICT, "STORE_REGION_INACTIVE",
                    "An active store requires an active region.");
        }
    }

    private String normalizeReason(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty() || normalized.length() > 500) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "LIFECYCLE_REASON_INVALID",
                    "A reason from 1 to 500 characters is required.");
        }
        return normalized;
    }

    private String action(LifecycleTargetType targetType, String suffix) {
        return targetType.name() + "_DEACTIVATION_" + suffix;
    }

    private UUID storeId(LifecycleTargetResponse target) {
        return target.type() == LifecycleTargetType.STORE ? target.id() : null;
    }

    private ApiProblemException problem(HttpStatus status, String code, String detail) {
        return new ApiProblemException(status, code, detail);
    }
}
