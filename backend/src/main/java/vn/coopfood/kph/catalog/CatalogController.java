package vn.coopfood.kph.catalog;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog/barcodes")
class CatalogController {

    private final CatalogService catalog;

    CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/{barcode}")
    BarcodeLookupResponse lookup(
            @PathVariable String barcode,
            @RequestParam UUID storeId,
            Authentication authentication) {
        return catalog.lookup(storeId, barcode, authentication);
    }
}
