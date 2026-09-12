package vn.coopfood.kph.catalog;

import java.util.UUID;

public sealed interface BarcodeLookupResponse {

    record Found(String status, String barcode, Product product) implements BarcodeLookupResponse {
        Found(String barcode, Product product) {
            this("FOUND", barcode, product);
        }
    }

    record NotFound(String status, String barcode) implements BarcodeLookupResponse {
        NotFound(String barcode) {
            this("NOT_FOUND", barcode);
        }
    }

    record Product(UUID id, String barcode, String skuCode, String name, Supplier primarySupplier) {}

    record Supplier(String code, String name) {}
}
