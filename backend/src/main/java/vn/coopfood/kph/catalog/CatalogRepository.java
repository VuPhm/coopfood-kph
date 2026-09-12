package vn.coopfood.kph.catalog;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.name;
import static org.jooq.impl.DSL.table;

import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.springframework.stereotype.Repository;

@Repository
class CatalogRepository {

    private static final Field<UUID> VERSION_ID = field(name("v", "id"), UUID.class);
    private static final Field<UUID> PRODUCT_ID = field(name("p", "id"), UUID.class);
    private static final Field<String> SKU = field(name("p", "sku_code"), String.class);
    private static final Field<String> PRODUCT_NAME = field(name("p", "product_name"), String.class);
    private static final Field<String> SUPPLIER_CODE = field(name("s", "supplier_code"), String.class);
    private static final Field<String> SUPPLIER_NAME = field(name("s", "supplier_name"), String.class);

    private final DSLContext database;

    CatalogRepository(DSLContext database) {
        this.database = database;
    }

    // One statement gives a consistent published version and product/supplier snapshot.
    // Empty result means no current catalog; null product means an exact lookup miss.
    Optional<LookupRow> lookupCurrent(String barcode) {
        return database.select(VERSION_ID, PRODUCT_ID, SKU, PRODUCT_NAME, SUPPLIER_CODE, SUPPLIER_NAME)
                .from(table(name("catalog_versions")).as("v"))
                .leftJoin(table(name("product_barcodes")).as("b"))
                .on(field(name("b", "catalog_version_id"), UUID.class).eq(VERSION_ID)
                        .and(field(name("b", "barcode"), String.class).eq(barcode))
                        .and(field(name("b", "active"), Boolean.class).isTrue()))
                .leftJoin(table(name("products")).as("p"))
                .on(PRODUCT_ID.eq(field(name("b", "product_id"), UUID.class))
                        .and(field(name("p", "catalog_version_id"), UUID.class).eq(VERSION_ID))
                        .and(field(name("p", "active"), Boolean.class).isTrue()))
                .leftJoin(table(name("product_suppliers")).as("ps"))
                .on(field(name("ps", "product_id"), UUID.class).eq(PRODUCT_ID)
                        .and(field(name("ps", "catalog_version_id"), UUID.class).eq(VERSION_ID))
                        .and(field(name("ps", "is_primary"), Boolean.class).isTrue()))
                .leftJoin(table(name("suppliers")).as("s"))
                .on(field(name("s", "id"), UUID.class).eq(field(name("ps", "supplier_id"), UUID.class))
                        .and(field(name("s", "catalog_version_id"), UUID.class).eq(VERSION_ID)))
                .where(field(name("v", "status"), String.class).eq("PUBLISHED")
                        .and(field(name("v", "is_current"), Boolean.class).isTrue()))
                .fetchOptional(row -> new LookupRow(
                        row.get(VERSION_ID), row.get(PRODUCT_ID), row.get(SKU), row.get(PRODUCT_NAME),
                        row.get(SUPPLIER_CODE), row.get(SUPPLIER_NAME)));
    }

    record LookupRow(UUID versionId, UUID productId, String skuCode, String name, String supplierCode, String supplierName) {}
}
