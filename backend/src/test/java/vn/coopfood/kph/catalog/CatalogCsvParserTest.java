package vn.coopfood.kph.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import vn.coopfood.kph.foundation.web.ApiProblemException;

class CatalogCsvParserTest {

    private final CatalogCsvParser parser = new CatalogCsvParser();

    @Test
    void preservesIdentifiersAndParsesBomQuotedCommaAndEscapedQuote() {
        byte[] csv = ("\uFEFFNCC,Tên NCC,UPC,SKU,Tên sản phẩm\r\n"
                + "0007,\"NCC Demo, miền Nam\",0890123456789,SKU-000042,\"Sản phẩm \"\"A\"\"\"\r\n")
                .getBytes(StandardCharsets.UTF_8);

        CatalogCsvParser.ParsedBatch batch = parser.parse(csv);

        assertThat(batch.errorRowCount()).isZero();
        assertThat(batch.rows()).singleElement().satisfies(row -> {
            assertThat(row.rowNumber()).isEqualTo(2);
            assertThat(row.normalized().supplierCode()).isEqualTo("0007");
            assertThat(row.normalized().barcode()).isEqualTo("0890123456789");
            assertThat(row.normalized().supplierName()).isEqualTo("NCC Demo, miền Nam");
            assertThat(row.normalized().productName()).isEqualTo("Sản phẩm \"A\"");
        });
    }

    @Test
    void marksEveryDuplicateAndConflictingIdentityRow() {
        byte[] csv = ("NCC,Tên NCC,UPC,SKU,Tên sản phẩm\n"
                + "0007,NCC Một,00123,SKU-01,Sản phẩm Một\n"
                + "0007,NCC Hai,00123,SKU-01,Sản phẩm Hai\n")
                .getBytes(StandardCharsets.UTF_8);

        CatalogCsvParser.ParsedBatch batch = parser.parse(csv);

        assertThat(batch.errorRowCount()).isEqualTo(2);
        assertThat(batch.rows()).allSatisfy(row -> assertThat(row.validationMessages())
                .extracting(CatalogValidationMessage::code)
                .contains("DUPLICATE_BARCODE", "SUPPLIER_NAME_CONFLICT", "PRODUCT_NAME_CONFLICT"));
    }

    @Test
    void rejectsMalformedHeaderAndInvalidUtf8BeforeCreatingRows() {
        assertThatThrownBy(() -> parser.parse("NCC,UPC\n0007,00123\n".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(ApiProblemException.class)
                .extracting(exception -> ((ApiProblemException) exception).code())
                .isEqualTo("CATALOG_HEADER_INVALID");
        assertThatThrownBy(() -> parser.parse(new byte[] {(byte) 0xC3, (byte) 0x28}))
                .isInstanceOf(ApiProblemException.class)
                .extracting(exception -> ((ApiProblemException) exception).code())
                .isEqualTo("CATALOG_ENCODING_INVALID");
    }
}
