package vn.coopfood.kph.kph;

import java.util.List;

record KphPage(List<KphRecordResponse> items, int page, int pageSize, long totalItems, long totalPages) {
}
