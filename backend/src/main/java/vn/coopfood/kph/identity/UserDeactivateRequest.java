package vn.coopfood.kph.identity;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserDeactivateRequest(
        @NotNull @Size(min = 1, max = 500) String reason) {

    @JsonAnySetter
    void rejectUnknownProperty(String propertyName, Object ignoredValue) {
        throw new IllegalArgumentException("Unknown user deactivation property: " + propertyName);
    }
}
