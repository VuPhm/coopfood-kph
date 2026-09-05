package vn.coopfood.kph.catalog;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.store.StoreAccessService;

@Service
class CatalogService {

    private final CatalogRepository repository;
    private final StoreAccessService storeAccess;

    CatalogService(CatalogRepository repository, StoreAccessService storeAccess) {
        this.repository = repository;
        this.storeAccess = storeAccess;
    }

    BarcodeLookupResponse lookup(UUID storeId, String barcode, Authentication authentication) {
        storeAccess.requireMembership(storeId, authentication);
        if (barcode == null || barcode.isEmpty() || barcode.length() > 128) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Barcode must contain between 1 and 128 characters.");
        }
        var row = repository.lookupCurrent(barcode).orElseThrow(CatalogService::catalogUnavailable);
        if (row.productId() == null) {
            return new BarcodeLookupResponse.NotFound(barcode);
        }
        if (row.supplierCode() == null || row.supplierName() == null) {
            throw catalogUnavailable();
        }
        return new BarcodeLookupResponse.Found(barcode, new BarcodeLookupResponse.Product(
                row.productId(), barcode, row.skuCode(), row.name(),
                new BarcodeLookupResponse.Supplier(row.supplierCode(), row.supplierName())));
    }

    private static ApiProblemException catalogUnavailable() {
        return new ApiProblemException(HttpStatus.SERVICE_UNAVAILABLE, "CATALOG_UNAVAILABLE",
                "The published catalog is not ready for lookup.");
    }
}
