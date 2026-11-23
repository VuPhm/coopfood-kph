package vn.coopfood.kph.date;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;
import vn.coopfood.kph.identity.SessionPrincipal;

@Repository
class DateLotRepository {
    private final DSLContext db;
    DateLotRepository(DSLContext db) { this.db = db; }

    record Product(String sku, String name, UUID productId, UUID versionId, String supplierCode, String supplierName) {}
    record Entry(DateLot lot, Product product) {}
    record Receipt(String hash, String response) {}

    void lockCreate(UUID storeId, UUID actorId, String key) {
        db.fetch("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", "date-create:" + storeId + ":" + actorId + ":" + key);
    }

    // Two distinct submissions for the same SKU may coexist. Serialize their duplicate warning checks.
    void lockDuplicateCheck(UUID store, String sku) {
        db.fetch("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", "date-sku:" + store + ":" + sku);
    }

    Optional<Receipt> receipt(UUID store, UUID actor, String key) {
        return db.fetchOptional("""
                SELECT request_hash, response::text FROM date_lot_create_receipts
                WHERE store_id = ? AND actor_id = ? AND idempotency_key = ?
                """,store,actor,key).map(row -> new Receipt(row.get(0,String.class), row.get(1,String.class)));
    }

    void saveReceipt(UUID store, UUID actor, String key, String hash, UUID lot, String response) {
        db.execute("""
                INSERT INTO date_lot_create_receipts(store_id,actor_id,idempotency_key,request_hash,lot_id,response)
                VALUES (?,?,?,?,?,CAST(? AS jsonb))
                """,store,actor,key,hash,lot,response);
    }

    Optional<Entry> find(UUID store, UUID id, boolean lock) {
        return db.fetchOptional("SELECT * FROM date_lots WHERE store_id = ? AND id = ?" + (lock ? " FOR UPDATE" : ""),
                store,id).map(row -> new Entry(lot(row),new Product(row.get("sku_code",String.class),
                row.get("product_name",String.class),row.get("product_id",UUID.class),row.get("catalog_version_id",UUID.class),
                row.get("supplier_code",String.class),row.get("supplier_name",String.class))));
    }

    DateLot insert(UUID store, UUID lot, DateLotInput input, Product product, SessionPrincipal actor, Instant now) {
        return lot(db.fetchSingle("""
                INSERT INTO date_lots (id, store_id, lookup_status, barcode, sku_code, product_name,
                    product_id, catalog_version_id, supplier_code, supplier_name, lot_code, manufactured_on,
                    expires_on, unit, tracked_quantity, created_by, updated_by, created_by_name,
                    updated_by_name, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *
                """, lot,store,input.lookupStatus(),input.barcode(),product.sku(),product.name(),product.productId(),
                product.versionId(),product.supplierCode(),product.supplierName(),input.lotCode(),input.manufacturedOn(),
                input.expiresOn(),input.unit(),input.trackedQuantity(),actor.userId(),actor.userId(),
                actor.user().displayName(),actor.user().displayName(),Timestamp.from(now),Timestamp.from(now)));
    }

    DateLot update(UUID store, UUID id, DateLotInput input, Product product, SessionPrincipal actor, Instant now) {
        return lot(db.fetchSingle("""
                UPDATE date_lots SET lookup_status=?, barcode=?, sku_code=?, product_name=?, product_id=?,
                    catalog_version_id=?, supplier_code=?, supplier_name=?, lot_code=?, manufactured_on=?, expires_on=?,
                    unit=?, tracked_quantity=?, updated_by=?, updated_by_name=?, updated_at=?, version=version+1
                WHERE store_id=? AND id=? RETURNING *
                """,input.lookupStatus(),input.barcode(),product.sku(),product.name(),product.productId(),
                product.versionId(),product.supplierCode(),product.supplierName(),input.lotCode(),
                input.manufacturedOn(),input.expiresOn(),input.unit(),input.trackedQuantity(),actor.userId(),
                actor.user().displayName(),Timestamp.from(now),store,id));
    }

    boolean duplicate(DateLot lot) {
        return Boolean.TRUE.equals(db.fetchValue("""
                SELECT EXISTS (SELECT 1 FROM date_lots WHERE store_id=? AND sku_code=? AND id<>?
                    AND lot_code IS NOT DISTINCT FROM ? AND manufactured_on IS NOT DISTINCT FROM ? AND expires_on=?)
                """,lot.storeId(),lot.skuCode(),lot.id(),lot.lotCode(),lot.manufacturedOn(),lot.expiresOn()));
    }

    void audit(String action, DateLot after, String metadata) {
        db.execute("""
                INSERT INTO audit_events(id,actor_user_id,action,target_type,target_id,store_id,metadata,occurred_at)
                VALUES (?, ?, ?, 'DATE_LOT', ?, ?, CAST(? AS jsonb), ?)
                """,UUID.randomUUID(),after.updatedBy().id(),action,after.id(),after.storeId(),metadata,Timestamp.from(after.updatedAt()));
    }

    List<DateLot.Suggestion> suggest(UUID store, String q) {
        return db.fetch("""
                SELECT sku_code, product_name FROM (
                    SELECT DISTINCT ON (sku_code) sku_code, product_name, updated_at FROM date_lots
                    WHERE store_id=? ORDER BY sku_code, updated_at DESC, version DESC, id DESC
                ) latest
                WHERE strpos(lower(sku_code),lower(?))>0 OR strpos(lower(product_name),lower(?))>0
                ORDER BY updated_at DESC, sku_code COLLATE "C" LIMIT 10
                """,store,q,q).map(row -> new DateLot.Suggestion(row.get(0,String.class), row.get(1,String.class)));
    }

    private static final String ASSESSED = """
            WITH scoped AS (
                SELECT d.*, CAST(? AS date) AS today, expires_on-manufactured_on+1 AS days
                FROM date_lots d WHERE store_id=?
                  AND (strpos(lower(sku_code),lower(?))>0 OR strpos(lower(product_name),lower(?))>0
                    OR strpos(lower(barcode),lower(?))>0 OR strpos(lower(lot_code),lower(?))>0)
            ), assessed AS (
                SELECT scoped.*, CASE
                    WHEN today>expires_on THEN 'EXPIRED'
                    WHEN manufactured_on IS NULL THEN 'MISSING'
                    WHEN today<manufactured_on THEN 'BEFORE_NSX'
                    WHEN today>=expires_on-(CASE WHEN days<10 THEN 0 ELSE round(days*0.2)::int END) THEN 'DANGER'
                    WHEN days>=10 AND today>=expires_on-round(days*0.4)::int THEN 'WARNING'
                    ELSE 'SAFE' END AS phase FROM scoped
            )
            """;

    DateLot.Page page(UUID store, LocalDate today, String q, String phase, boolean attention, String sort, int page, int size) {
        String attentionPredicate = "phase NOT IN ('SAFE','BEFORE_NSX')";
        List<Object> scope = List.of(today,store,q,q,q,q);
        var args = new ArrayList<>(scope);
        String filter = "TRUE";
        if (phase != null) { filter += " AND phase=?"; args.add(phase); }
        if (attention) filter += " AND " + attentionPredicate;
        var counts = db.fetchSingle(ASSESSED + "SELECT count(*) FILTER (WHERE " + filter
                + "), count(*) FILTER (WHERE " + attentionPredicate + ") FROM assessed", args.toArray());
        long total = counts.get(0, Long.class);
        String order = switch (sort) {
            case "expiry" -> "expires_on ASC";
            case "name" -> "product_name COLLATE \"vi-x-icu\" ASC";
            default -> "created_at DESC";
        };
        args.add(size); args.add(((long) page - 1) * size);
        var items = db.fetch(ASSESSED + "SELECT * FROM assessed WHERE " + filter + " ORDER BY " + order
                + ", id ASC LIMIT ? OFFSET ?",args.toArray()).map(this::lot);
        return new DateLot.Page(items,page,size,total,(total+size-1)/size,counts.get(1,Long.class));
    }

    private DateLot lot(Record r) {
        String quantity = r.get("tracked_quantity",BigDecimal.class).toPlainString();
        return new DateLot(r.get("id",UUID.class),r.get("store_id",UUID.class),r.get("lookup_status",String.class),
                r.get("barcode",String.class),r.get("sku_code",String.class),r.get("product_name",String.class),
                r.get("supplier_code",String.class),r.get("supplier_name",String.class),r.get("lot_code",String.class),
                r.get("manufactured_on",LocalDate.class),r.get("expires_on",LocalDate.class),r.get("unit",String.class),
                quantity,"0",quantity,"OPEN",r.get("version",Long.class),
                new DateLot.Actor(r.get("created_by",UUID.class),r.get("created_by_name",String.class)),
                new DateLot.Actor(r.get("updated_by",UUID.class),r.get("updated_by_name",String.class)),
                r.get("created_at",Timestamp.class).toInstant(),r.get("updated_at",Timestamp.class).toInstant());
    }
}
