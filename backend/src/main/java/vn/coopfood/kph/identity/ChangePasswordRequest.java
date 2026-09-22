package vn.coopfood.kph.identity;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotNull @Size(min = 1, max = 256) String currentPassword,
        @NotNull @Size(min = 1, max = 256) String newPassword) {

    @JsonAnySetter
    void rejectUnknownProperty(String propertyName, Object ignoredValue) {
        throw new IllegalArgumentException("Unknown password-change property: " + propertyName);
    }
}

