package vn.coopfood.kph.lifecycle;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LifecycleReasonRequest(@NotNull @Size(min = 1, max = 500) String reason) {

    @JsonAnySetter
    void rejectUnknownProperty(String propertyName, Object ignoredValue) {
        throw new IllegalArgumentException("Unknown lifecycle reason property: " + propertyName);
    }
}
