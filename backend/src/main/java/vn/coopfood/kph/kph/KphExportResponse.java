package vn.coopfood.kph.kph;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

record KphExportResponse(
        UUID exportId,
        Instant exportedAt,
        KphRecordResponse.StoreSnapshot store,
        List<KphRecordResponse> records) {
}
