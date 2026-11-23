package vn.coopfood.kph.date;

import java.util.List;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.node.ObjectNode;
import vn.coopfood.kph.store.DateStoreAccessPolicy;

@RestController
@RequestMapping("/api/v1")
class DateLotController {
    private final DateLotService service;
    private final DateStoreAccessPolicy access;

    DateLotController(DateLotService service, DateStoreAccessPolicy access) {
        this.service = service;
        this.access = access;
    }

    @GetMapping("/date/stores")
    ResponseEntity<List<DateStoreAccessPolicy.Store>> stores(Authentication auth) {
        return ok(access.list(auth));
    }

    @GetMapping("/stores/{storeId}/date-lots")
    ResponseEntity<DateLot.Page> list(@PathVariable UUID storeId, @RequestParam(required=false) String q,
            @RequestParam(required=false) String phase, @RequestParam(defaultValue="false") boolean attentionOnly,
            @RequestParam(defaultValue="default") String sort, @RequestParam(defaultValue="1") int page,
            @RequestParam(defaultValue="25") int pageSize, Authentication auth) {
        return ok(service.list(storeId,q,phase,attentionOnly,sort,page,pageSize,auth));
    }

    @GetMapping("/stores/{storeId}/date-lots/{lotId}")
    ResponseEntity<DateLot> get(@PathVariable UUID storeId, @PathVariable UUID lotId, Authentication auth) {
        return ok(service.get(storeId,lotId,auth));
    }

    @PutMapping("/stores/{storeId}/date-lots/{lotId}/reminder")
    ResponseEntity<DateLot> scheduleReminder(@PathVariable UUID storeId, @PathVariable UUID lotId,
            @RequestBody ObjectNode body, Authentication auth) {
        return ok(service.scheduleReminder(storeId,lotId,body,auth));
    }

    @GetMapping("/stores/{storeId}/date-sku-suggestions")
    ResponseEntity<List<DateLot.Suggestion>> suggestions(@PathVariable UUID storeId, @RequestParam(required=false) String q,
            Authentication auth) {
        return ok(service.suggestions(storeId,q,auth));
    }

    @PostMapping("/stores/{storeId}/date-lots")
    ResponseEntity<DateLot.WriteResult> create(@PathVariable UUID storeId, @RequestHeader("Idempotency-Key") String key,
            @RequestBody ObjectNode body, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore()).body(service.create(storeId,key,body,auth));
    }

    @PatchMapping("/stores/{storeId}/date-lots/{lotId}")
    ResponseEntity<DateLot.WriteResult> update(@PathVariable UUID storeId, @PathVariable UUID lotId,
            @RequestBody ObjectNode body, Authentication auth) {
        return ok(service.update(storeId,lotId,body,auth));
    }

    @PostMapping(value="/stores/{storeId}/date-lots/{lotId}/kph",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<DateLotProcessingReceipt> process(@PathVariable UUID storeId,@PathVariable UUID lotId,
            @RequestHeader("Idempotency-Key") String key,@RequestPart("payload") ObjectNode body,
            @RequestPart("photos") List<MultipartFile> photos,Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(service.process(storeId,lotId,key,body,photos,auth));
    }

    private static <T> ResponseEntity<T> ok(T value) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value);
    }
}
