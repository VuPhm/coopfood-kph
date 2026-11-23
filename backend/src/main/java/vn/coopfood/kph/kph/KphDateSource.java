package vn.coopfood.kph.kph;

import java.util.UUID;

public record KphDateSource(String lookupStatus, String barcode, UUID catalogVersionId, UUID productId,
        String skuCode, String productName, String supplierCode, String supplierName) {}
