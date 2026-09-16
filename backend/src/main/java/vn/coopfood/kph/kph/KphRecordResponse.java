package vn.coopfood.kph.kph;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public record KphRecordResponse(
        UUID id,
        KphType type,
        LocalDate detectedDate,
        LocalDate processedDate,
        BigDecimal quantity,
        KphUnit unit,
        KphCondition condition,
        String conditionDetail,
        KphResolution resolution,
        String resolutionDetail,
        String barcode,
        String lookupStatus,
        CatalogSnapshot catalogSnapshot,
        String lifecycleState,
        KphApprovalStatus approvalStatus,
        ActorSnapshot reviewedBy,
        Instant reviewedAt,
        String note,
        StoreSnapshot store,
        ActorSnapshot detectedBy,
        List<Photo> photos,
        Instant createdAt) {

    public record CatalogSnapshot(
            String skuCode,
            String productName,
            String supplierCode,
            String supplierName) {
    }

    public record StoreSnapshot(UUID id, String code, String name) {
    }

    public record ActorSnapshot(UUID id, String displayName) {
    }

    public record Photo(int ordinal, String stampedContentPath, Instant capturedAt) {
    }

    static final class Builder {
        private final UUID id;
        private final KphType type;
        private final LocalDate detectedDate;
        private final LocalDate processedDate;
        private final BigDecimal quantity;
        private final KphUnit unit;
        private final KphCondition condition;
        private final String conditionDetail;
        private final KphResolution resolution;
        private final String resolutionDetail;
        private final String barcode;
        private final String lookupStatus;
        private final CatalogSnapshot catalogSnapshot;
        private final String lifecycleState;
        private final KphApprovalStatus approvalStatus;
        private final ActorSnapshot reviewedBy;
        private final Instant reviewedAt;
        private final String note;
        private final StoreSnapshot store;
        private final ActorSnapshot detectedBy;
        private final Instant createdAt;
        private final List<Photo> photos = new ArrayList<>();

        Builder(UUID id, KphType type, LocalDate detectedDate, LocalDate processedDate, BigDecimal quantity,
                KphUnit unit, KphCondition condition, String conditionDetail, KphResolution resolution,
                String resolutionDetail, String barcode, String lookupStatus, CatalogSnapshot catalogSnapshot,
                String lifecycleState, KphApprovalStatus approvalStatus, ActorSnapshot reviewedBy, Instant reviewedAt,
                String note, StoreSnapshot store, ActorSnapshot detectedBy, Instant createdAt) {
            this.id = id;
            this.type = type;
            this.detectedDate = detectedDate;
            this.processedDate = processedDate;
            this.quantity = quantity;
            this.unit = unit;
            this.condition = condition;
            this.conditionDetail = conditionDetail;
            this.resolution = resolution;
            this.resolutionDetail = resolutionDetail;
            this.barcode = barcode;
            this.lookupStatus = lookupStatus;
            this.catalogSnapshot = catalogSnapshot;
            this.lifecycleState = lifecycleState;
            this.approvalStatus = approvalStatus;
            this.reviewedBy = reviewedBy;
            this.reviewedAt = reviewedAt;
            this.note = note;
            this.store = store;
            this.detectedBy = detectedBy;
            this.createdAt = createdAt;
        }

        void photo(Photo photo) {
            photos.add(photo);
        }

        KphRecordResponse build() {
            return new KphRecordResponse(id, type, detectedDate, processedDate, quantity, unit, condition,
                    conditionDetail, resolution, resolutionDetail, barcode, lookupStatus, catalogSnapshot,
                    lifecycleState, approvalStatus, reviewedBy, reviewedAt, note, store, detectedBy,
                    List.copyOf(photos), createdAt);
        }
    }
}
