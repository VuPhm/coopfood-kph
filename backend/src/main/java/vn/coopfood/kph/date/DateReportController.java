package vn.coopfood.kph.date;

import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/date-reports")
class DateReportController {
    private final DateReportService service;

    DateReportController(DateReportService service) { this.service=service; }

    @GetMapping("/source")
    ResponseEntity<?> source(@PathVariable UUID storeId, @RequestParam(defaultValue="ALL") DateReportService.Collection collection,
            @RequestParam(defaultValue="") @Size(max=128) String q, @RequestParam(defaultValue="false") boolean attentionOnly,
            @RequestParam(defaultValue="1") @Min(1) int page, @RequestParam(defaultValue="25") @Min(1) @Max(100) int pageSize,
            Authentication auth) {
        return ok(service.source(storeId,collection,q,attentionOnly,page,pageSize,auth));
    }

    @PostMapping
    ResponseEntity<?> create(@PathVariable UUID storeId, @Valid @RequestBody DateReportService.Create body,
            @RequestHeader("Idempotency-Key") @NotBlank @Size(min=16,max=128) String key, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(cache()).body(service.create(storeId,body,key,auth));
    }

    @GetMapping
    ResponseEntity<?> list(@PathVariable UUID storeId, @RequestParam(defaultValue="") @Size(max=128) String q,
            @RequestParam(defaultValue="1") @Min(1) int page, @RequestParam(defaultValue="25") @Min(1) @Max(100) int pageSize,
            Authentication auth) {
        return ok(service.list(storeId,q,page,pageSize,auth));
    }

    @GetMapping("/{reportId}")
    ResponseEntity<?> detail(@PathVariable UUID storeId, @PathVariable UUID reportId, Authentication auth) {
        return ok(service.detail(storeId,reportId,auth));
    }

    @GetMapping("/{reportId}/rows")
    ResponseEntity<?> rows(@PathVariable UUID storeId, @PathVariable UUID reportId,
            @RequestParam(defaultValue="1") @Min(1) int page, @RequestParam(defaultValue="25") @Min(1) @Max(100) int pageSize,
            Authentication auth) {
        return ok(service.rows(storeId,reportId,page,pageSize,auth));
    }

    private static CacheControl cache() { return CacheControl.noStore().cachePrivate(); }
    private static <T> ResponseEntity<T> ok(T value) { return ResponseEntity.ok().cacheControl(cache()).body(value); }
}
