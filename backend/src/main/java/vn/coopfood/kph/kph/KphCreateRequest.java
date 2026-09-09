package vn.coopfood.kph.kph;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record KphCreateRequest(
        @NotNull KphType type,
        @NotNull LocalDate detectedDate,
        LocalDate processedDate,
        @NotNull @Positive BigDecimal quantity,
        @NotNull KphUnit unit,
        @NotNull KphCondition condition,
        @Size(max = 255) String conditionDetail,
        @NotNull KphResolution resolution,
        @Size(max = 255) String resolutionDetail,
        @Size(max = 128) String barcode,
        @Size(max = 50) String manualSkuCode,
        @Size(max = 200) String manualProductName,
        @Size(max = 150) String manualSupplierName,
        @Size(max = 255) String note,
        @Size(max = 3)
        List<Instant> photoLastModified) {
}
