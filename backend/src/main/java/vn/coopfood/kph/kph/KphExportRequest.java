package vn.coopfood.kph.kph;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

record KphExportRequest(
        @NotNull KphType type,
        @NotEmpty @Size(max = 500) List<@NotNull UUID> recordIds) {
}
