package vn.coopfood.kph.kph;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@Validated
@RequestMapping("/api/v1/stores/{storeId}/kph")
class KphController {

    private final KphService service;

    KphController(KphService service) {
        this.service = service;
    }

    @GetMapping
    KphRecordPageResponse list(@PathVariable UUID storeId, @RequestParam(required = false) KphType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate detectedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate detectedTo,
            @RequestParam(required = false) KphApprovalStatus approvalStatus,
            @RequestParam(required = false) KphHistorySort sort,
            @RequestParam(defaultValue = "descending") KphHistorySortDirection direction,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int pageSize,
            Authentication authentication) {
        return service.list(storeId, type, detectedFrom, detectedTo, approvalStatus, sort, direction,
                page, pageSize, authentication);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<KphRecordResponse> create(@PathVariable UUID storeId,
            @Valid @RequestPart("payload") KphCreateRequest payload,
            @RequestPart("photos") List<MultipartFile> photos,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(storeId, payload, photos, idempotencyKey, authentication));
    }

    @PutMapping("/{recordId}/approval")
    KphRecordResponse review(@PathVariable UUID storeId, @PathVariable UUID recordId,
            @Valid @RequestBody KphApprovalRequest request, Authentication authentication) {
        return service.review(storeId, recordId, request, authentication);
    }

    @PostMapping("/exports")
    KphExportResponse prepareExport(@PathVariable UUID storeId,
            @Valid @RequestBody KphExportRequest request, Authentication authentication) {
        return service.prepareExport(storeId, request, authentication);
    }

    @GetMapping("/{recordId}/photos/{ordinal}")
    ResponseEntity<byte[]> stampedPhoto(@PathVariable UUID storeId, @PathVariable UUID recordId,
            @PathVariable int ordinal, Authentication authentication) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore().cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(service.stampedPhoto(storeId, recordId, ordinal, authentication));
    }
}
