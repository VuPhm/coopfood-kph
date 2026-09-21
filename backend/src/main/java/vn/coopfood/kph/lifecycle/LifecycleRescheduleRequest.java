package vn.coopfood.kph.lifecycle;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LifecycleRescheduleRequest(
        @NotNull LocalDate effectiveDate,
        @NotNull @Size(min = 1, max = 500) String reason) {

    @JsonAnySetter
    void rejectUnknownProperty(String propertyName, Object ignoredValue) {
        throw new IllegalArgumentException("Unknown lifecycle reschedule property: " + propertyName);
    }
}
