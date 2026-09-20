package vn.coopfood.kph.catalog;

import java.util.UUID;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.store.KphStoreAccessPolicy;

@Service
public class CatalogService {

    private final CatalogRepository repository;
    private final KphStoreAccessPolicy accessPolicy;

    CatalogService(CatalogRepository repository, KphStoreAccessPolicy accessPolicy) {
        this.repository = repository;
        this.accessPolicy = accessPolicy;
    }

    public BarcodeLookupResponse lookup(UUID storeId, String barcode, Authentication authentication) {
        accessPolicy.requireViewCreate(storeId, authentication);
        var row = resolve(barcode);
        if (row.isEmpty()) {
            return new BarcodeLookupResponse.NotFound(barcode);
        }
        var found = row.orElseThrow();
        return new BarcodeLookupResponse.Found(barcode, new BarcodeLookupResponse.Product(
                found.productId(), barcode, found.skuCode(), found.name(),
                new BarcodeLookupResponse.Supplier(found.supplierCode(), found.supplierName())));
    }

    public Optional<CatalogSnapshot> resolveCurrent(String barcode) {
        return resolve(barcode).map(row -> new CatalogSnapshot(
                row.versionId(), row.productId(), row.skuCode(), row.name(),
                row.supplierCode(), row.supplierName()));
    }

    private Optional<CatalogRepository.LookupRow> resolve(String barcode) {
        validateBarcode(barcode);
        var row = repository.lookupCurrent(barcode).orElseThrow(CatalogService::catalogUnavailable);
        if (row.productId() == null) {
            return Optional.empty();
        }
        if (row.supplierCode() == null || row.supplierName() == null) {
            throw catalogUnavailable();
        }
        return Optional.of(row);
    }

    private static void validateBarcode(String barcode) {
        if (barcode == null || barcode.isEmpty() || barcode.length() > 128) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Barcode must contain between 1 and 128 characters.");
        }
    }

    private static ApiProblemException catalogUnavailable() {
        return new ApiProblemException(HttpStatus.SERVICE_UNAVAILABLE, "CATALOG_UNAVAILABLE",
                "The published catalog is not ready for lookup.");
    }

    public record CatalogSnapshot(
            UUID catalogVersionId,
            UUID productId,
            String skuCode,
            String productName,
            String supplierCode,
            String supplierName) {
    }
}
