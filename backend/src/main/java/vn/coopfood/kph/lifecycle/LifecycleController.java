package vn.coopfood.kph.lifecycle;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/lifecycle")
class LifecycleController {

    private final LifecycleService service;

    LifecycleController(LifecycleService service) {
        this.service = service;
    }

    @GetMapping("/targets")
    List<LifecycleTargetResponse> listTargets(Authentication authentication) {
        return service.listTargets(authentication);
    }

    @GetMapping("/schedules")
    List<LifecycleScheduleResponse> listSchedules(Authentication authentication) {
        return service.listSchedules(authentication);
    }

    @PostMapping("/schedules")
    ResponseEntity<LifecycleScheduleResponse> create(
            @Valid @RequestBody LifecycleScheduleCreateRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, authentication));
    }

    @PutMapping("/schedules/{scheduleId}")
    LifecycleScheduleResponse reschedule(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody LifecycleRescheduleRequest request,
            Authentication authentication) {
        return service.reschedule(scheduleId, request, authentication);
    }

    @PostMapping("/schedules/{scheduleId}/cancel")
    LifecycleScheduleResponse cancel(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody LifecycleReasonRequest request,
            Authentication authentication) {
        return service.cancel(scheduleId, request, authentication);
    }

    @PostMapping("/schedules/{scheduleId}/execute")
    LifecycleScheduleResponse execute(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody LifecycleReasonRequest request,
            Authentication authentication) {
        return service.execute(scheduleId, request, authentication);
    }
}
