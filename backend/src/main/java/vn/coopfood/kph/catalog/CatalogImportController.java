package vn.coopfood.kph.catalog;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/catalog/imports")
class CatalogImportController {

    private final CatalogImportService service;

    CatalogImportController(CatalogImportService service) {
        this.service = service;
    }

    @GetMapping
    List<CatalogImportBatchResponse> list(Authentication authentication) {
        return service.list(authentication);
    }

    @GetMapping("/{batchId}")
    CatalogImportDetailResponse detail(
            @PathVariable UUID batchId,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "200") int limit,
            Authentication authentication) {
        return service.detail(batchId, offset, limit, authentication);
    }

    @PostMapping
    ResponseEntity<CatalogImportUploadResponse> upload(
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {
        CatalogImportUploadResponse response = service.upload(file, authentication);
        return ResponseEntity.status(response.replayed() ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }
}
