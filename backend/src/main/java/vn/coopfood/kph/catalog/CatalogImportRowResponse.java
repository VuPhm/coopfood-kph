package vn.coopfood.kph.catalog;

import java.util.List;

record CatalogImportRowResponse(
        int rowNumber,
        CatalogImportRowStatus status,
        CatalogRowValues raw,
        CatalogRowValues normalized,
        List<CatalogValidationMessage> validationMessages) {
}
