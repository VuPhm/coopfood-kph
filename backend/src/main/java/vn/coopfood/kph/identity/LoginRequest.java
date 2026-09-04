package vn.coopfood.kph.identity;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotNull @Size(min = 1, max = 100) String username,
        @NotNull @Size(min = 1, max = 256) String password) {

    @JsonAnySetter
    void rejectUnknownProperty(String propertyName, Object ignoredValue) {
        throw new IllegalArgumentException("Unknown login property: " + propertyName);
    }
}
