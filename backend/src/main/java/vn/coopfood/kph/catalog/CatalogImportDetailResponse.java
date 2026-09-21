package vn.coopfood.kph.catalog;

import java.util.List;

record CatalogImportDetailResponse(
        CatalogImportBatchResponse batch,
        List<CatalogImportRowResponse> rows,
        int rowTotal,
        int rowOffset,
        int rowLimit) {
}
