package vn.coopfood.kph.catalog;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;

import vn.coopfood.kph.foundation.web.ApiProblemException;

final class CatalogCsvParser {

    private static final List<String> HEADER = List.of("NCC", "Tên NCC", "UPC", "SKU", "Tên sản phẩm");
    private static final int MAX_ROWS = 50_000;

    ParsedBatch parse(byte[] bytes) {
        String content = decode(bytes);
        if (content.startsWith("\uFEFF")) content = content.substring(1);
        List<List<String>> records = records(content);
        if (records.isEmpty()) {
            throw problem("CATALOG_FILE_EMPTY", "Catalog CSV must contain a header and at least one data row.");
        }
        if (!records.getFirst().equals(HEADER)) {
            throw problem("CATALOG_HEADER_INVALID",
                    "Catalog CSV header must be: NCC,Tên NCC,UPC,SKU,Tên sản phẩm.");
        }

        List<MutableRow> rows = new ArrayList<>();
        for (int index = 1; index < records.size(); index++) {
            List<String> values = records.get(index);
            if (values.stream().allMatch(String::isEmpty)) continue;
            if (rows.size() == MAX_ROWS) {
                throw problem("CATALOG_ROW_LIMIT_EXCEEDED", "Catalog CSV cannot exceed 50000 data rows.");
            }
            CatalogRowValues raw = values(values);
            CatalogRowValues normalized = normalize(raw);
            MutableRow row = new MutableRow(index + 1, raw, normalized);
            if (values.size() != HEADER.size()) {
                row.add("COLUMN_COUNT_INVALID", "row", "Dòng phải có đúng 5 cột.");
            }
            required(row, "supplierCode", normalized.supplierCode(), "Mã NCC là bắt buộc.");
            required(row, "supplierName", normalized.supplierName(), "Tên NCC là bắt buộc.");
            required(row, "barcode", normalized.barcode(), "UPC là bắt buộc.");
            required(row, "skuCode", normalized.skuCode(), "SKU là bắt buộc.");
            required(row, "productName", normalized.productName(), "Tên sản phẩm là bắt buộc.");
            rows.add(row);
        }
        if (rows.isEmpty()) {
            throw problem("CATALOG_FILE_EMPTY", "Catalog CSV must contain at least one data row.");
        }

        markConflicts(rows, MutableRow::supplierCode, MutableRow::supplierName,
                "SUPPLIER_NAME_CONFLICT", "supplierName", "Cùng mã NCC phải có cùng tên NCC.");
        markConflicts(rows, MutableRow::skuCode, MutableRow::productName,
                "PRODUCT_NAME_CONFLICT", "productName", "Cùng SKU phải có cùng tên sản phẩm.");
        markDuplicates(rows);
        return new ParsedBatch(rows.stream().map(MutableRow::freeze).toList());
    }

    private String decode(byte[] bytes) {
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes)).toString();
        } catch (CharacterCodingException exception) {
            throw problem("CATALOG_ENCODING_INVALID", "Catalog CSV must use valid UTF-8.");
        }
    }

    private List<List<String>> records(String content) {
        List<List<String>> records = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        boolean afterQuote = false;

        for (int index = 0; index < content.length(); index++) {
            char value = content.charAt(index);
            if (quoted) {
                if (value == '"') {
                    if (index + 1 < content.length() && content.charAt(index + 1) == '"') {
                        field.append('"');
                        index++;
                    } else {
                        quoted = false;
                        afterQuote = true;
                    }
                } else {
                    field.append(value);
                }
                continue;
            }
            if (afterQuote) {
                if (value == ',') {
                    row.add(field.toString());
                    field.setLength(0);
                    afterQuote = false;
                } else if (value == '\r' || value == '\n') {
                    row.add(field.toString());
                    records.add(List.copyOf(row));
                    row.clear();
                    field.setLength(0);
                    afterQuote = false;
                    if (value == '\r' && index + 1 < content.length() && content.charAt(index + 1) == '\n') index++;
                } else {
                    throw problem("CATALOG_CSV_MALFORMED", "Unexpected character after a quoted CSV field.");
                }
                continue;
            }
            if (value == '"') {
                if (!field.isEmpty()) {
                    throw problem("CATALOG_CSV_MALFORMED", "A quoted CSV field must start with a quote.");
                }
                quoted = true;
            } else if (value == ',') {
                row.add(field.toString());
                field.setLength(0);
            } else if (value == '\r' || value == '\n') {
                row.add(field.toString());
                records.add(List.copyOf(row));
                row.clear();
                field.setLength(0);
                if (value == '\r' && index + 1 < content.length() && content.charAt(index + 1) == '\n') index++;
            } else {
                field.append(value);
            }
        }
        if (quoted) throw problem("CATALOG_CSV_MALFORMED", "Catalog CSV contains an unclosed quoted field.");
        if (afterQuote || !field.isEmpty() || !row.isEmpty()) {
            row.add(field.toString());
            records.add(List.copyOf(row));
        }
        return records;
    }

    private CatalogRowValues values(List<String> values) {
        return new CatalogRowValues(value(values, 0), value(values, 1), value(values, 2),
                value(values, 3), value(values, 4));
    }

    private String value(List<String> values, int index) {
        return index < values.size() ? values.get(index) : "";
    }

    private CatalogRowValues normalize(CatalogRowValues raw) {
        return new CatalogRowValues(raw.supplierCode().trim(), raw.supplierName().trim(),
                raw.barcode().trim(), raw.skuCode().trim(), raw.productName().trim());
    }

    private void required(MutableRow row, String field, String value, String message) {
        if (value.isEmpty()) row.add("REQUIRED", field, message);
    }

    private void markConflicts(List<MutableRow> rows,
            java.util.function.Function<MutableRow, String> key,
            java.util.function.Function<MutableRow, String> label,
            String code, String field, String message) {
        Map<String, List<MutableRow>> grouped = new LinkedHashMap<>();
        rows.stream().filter(row -> !key.apply(row).isEmpty())
                .forEach(row -> grouped.computeIfAbsent(key.apply(row), ignored -> new ArrayList<>()).add(row));
        grouped.values().stream()
                .filter(group -> group.stream().map(label).filter(value -> !value.isEmpty()).distinct().count() > 1)
                .flatMap(List::stream)
                .forEach(row -> row.add(code, field, message));
    }

    private void markDuplicates(List<MutableRow> rows) {
        Map<String, List<MutableRow>> grouped = new LinkedHashMap<>();
        rows.stream().filter(row -> !row.barcode().isEmpty())
                .forEach(row -> grouped.computeIfAbsent(row.barcode(), ignored -> new ArrayList<>()).add(row));
        grouped.values().stream().filter(group -> group.size() > 1).flatMap(List::stream)
                .forEach(row -> row.add("DUPLICATE_BARCODE", "barcode", "UPC bị lặp trong cùng file."));
    }

    private ApiProblemException problem(String code, String message) {
        return new ApiProblemException(HttpStatus.UNPROCESSABLE_ENTITY, code, message);
    }

    record ParsedBatch(List<ParsedRow> rows) {
        int errorRowCount() {
            return (int) rows.stream().filter(row -> row.status() == CatalogImportRowStatus.ERROR).count();
        }
    }

    record ParsedRow(int rowNumber, CatalogImportRowStatus status, CatalogRowValues raw,
            CatalogRowValues normalized, List<CatalogValidationMessage> validationMessages) {
    }

    private static final class MutableRow {
        private final int rowNumber;
        private final CatalogRowValues raw;
        private final CatalogRowValues normalized;
        private final List<CatalogValidationMessage> messages = new ArrayList<>();

        private MutableRow(int rowNumber, CatalogRowValues raw, CatalogRowValues normalized) {
            this.rowNumber = rowNumber;
            this.raw = raw;
            this.normalized = normalized;
        }

        private String supplierCode() { return normalized.supplierCode(); }
        private String supplierName() { return normalized.supplierName(); }
        private String barcode() { return normalized.barcode(); }
        private String skuCode() { return normalized.skuCode(); }
        private String productName() { return normalized.productName(); }

        private void add(String code, String field, String message) {
            CatalogValidationMessage candidate = new CatalogValidationMessage(code, field, message);
            if (!messages.contains(candidate)) messages.add(candidate);
        }

        private ParsedRow freeze() {
            return new ParsedRow(rowNumber,
                    messages.isEmpty() ? CatalogImportRowStatus.VALID : CatalogImportRowStatus.ERROR,
                    raw, normalized, List.copyOf(messages));
        }
    }
}
