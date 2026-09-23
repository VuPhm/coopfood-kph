package vn.coopfood.kph.kph;

import java.util.List;

record KphRecordPageResponse(
        List<KphRecordResponse> items,
        int page,
        int pageSize,
        long totalItems,
        long totalPages,
        TypeTotals typeTotals) {

    record TypeTotals(long tpcn, long tpts) {
    }
}
