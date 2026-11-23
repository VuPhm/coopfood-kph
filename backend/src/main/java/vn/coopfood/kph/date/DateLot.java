package vn.coopfood.kph.date;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

record DateLot(UUID id, UUID storeId, String lookupStatus, String barcode, String skuCode, String productName,
        String supplierCode, String supplierName, String lotCode, LocalDate manufacturedOn, LocalDate expiresOn,
        String unit, String trackedQuantity, String processedQuantity, String remainingQuantity,
        String processingStatus, long version, Actor createdBy, Actor updatedBy, Instant createdAt, Instant updatedAt) {
    record Actor(UUID id, String displayName) {}
    record WriteResult(DateLot lot, boolean duplicateWarning) {}
    record Page(List<DateLot> items, int page, int pageSize, long totalItems, long totalPages, long attentionCount) {}
    record Suggestion(String skuCode, String productName) {}
}
