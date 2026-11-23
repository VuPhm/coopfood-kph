package vn.coopfood.kph.date;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

record DateLot(UUID id, UUID storeId, String lookupStatus, String barcode, String skuCode, String productName,
        String supplierCode, String supplierName, String lotCode, LocalDate manufacturedOn, LocalDate expiresOn,
        String unit, String trackedQuantity, String processedQuantity, String remainingQuantity,
        String processingStatus, long version, Actor createdBy, Actor updatedBy, Instant createdAt, Instant updatedAt,
        String kphType, List<ProcessingReceipt> processingHistory, LocalDate remindOn, String reminderState) {
    DateLot {
        if (reminderState == null) reminderState = "NONE";
    }
    record Actor(UUID id, String displayName) {}
    record WriteResult(DateLot lot, boolean duplicateWarning) {}
    record Page(List<DateLot> items, int page, int pageSize, long totalItems, long totalPages, long attentionCount) {}
    record Suggestion(String skuCode, String productName) {}
    record ProcessingReceipt(UUID recordId, String quantity, String unit, long sourceVersion, long resultingVersion,
            String remainingAfter, Instant processedAt, Actor actor) {}
    record Processed(DateLotProcessingReceipt receipt, DateLot lot) {}

    DateLot withReminderState(LocalDate today) {
        String state = remindOn == null || "RESOLVED".equals(processingStatus) ? "NONE"
                : remindOn.isAfter(today) ? "SCHEDULED" : "DUE";
        return new DateLot(id,storeId,lookupStatus,barcode,skuCode,productName,supplierCode,supplierName,lotCode,
                manufacturedOn,expiresOn,unit,trackedQuantity,processedQuantity,remainingQuantity,processingStatus,
                version,createdBy,updatedBy,createdAt,updatedAt,kphType,processingHistory,
                "RESOLVED".equals(processingStatus) ? null : remindOn,state);
    }
}
