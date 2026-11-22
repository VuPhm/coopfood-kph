package vn.coopfood.kph.kph;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@Validated
class ChainKphController {

    private final KphService service;

    ChainKphController(KphService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/admin/kph")
    KphPage list(@RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate detectedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate detectedTo,
            @RequestParam(required = false) KphApprovalStatus approvalStatus,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int pageSize, Authentication authentication) {
        return service.listChain(storeId, detectedFrom, detectedTo, approvalStatus, page, pageSize, authentication);
    }

    @GetMapping("/api/v1/admin/kph/stores/{storeId}/records/{recordId}/photos/{ordinal}")
    ResponseEntity<byte[]> stampedPhoto(@PathVariable UUID storeId, @PathVariable UUID recordId,
            @PathVariable int ordinal, Authentication authentication) {
        return KphController.privatePhotoResponse(service.adminStampedPhoto(storeId, recordId, ordinal, authentication));
    }
}
