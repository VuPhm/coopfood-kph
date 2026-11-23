package vn.coopfood.kph.date;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import vn.coopfood.kph.foundation.time.TimeConfiguration;
import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;
import vn.coopfood.kph.store.DateStoreAccessPolicy;

@Service
class DateReportService {
    enum Collection { ALL, OPEN, RESOLVED }
    record Selected(@NotNull UUID lotId, @Min(1) long version) {}
    record Create(@NotBlank @Size(max=120) String title, @NotNull LocalDate periodStart, @NotNull LocalDate periodEnd,
                  @NotEmpty @Size(max=1000) List<@NotNull @Valid Selected> items) {
        Create { title = title == null ? null : title.strip(); }
    }
    record Store(UUID id, String code, String name) {}
    record Summary(UUID id, String title, LocalDate periodStart, LocalDate periodEnd, LocalDate asOf,
                   Instant createdAt, Store store, DateLot.Actor createdBy, int rowCount, String totalEa, String totalKg) {}
    record Page<T>(List<T> items, int page, int pageSize, long totalItems, long totalPages) {}

    private final DSLContext db;
    private final DateLotRepository lots;
    private final DateStoreAccessPolicy access;
    private final ObjectMapper json;
    private final Clock clock;

    DateReportService(DSLContext db, DateLotRepository lots, DateStoreAccessPolicy access, ObjectMapper json, Clock clock) {
        this.db=db;
        this.lots=lots;
        this.access=access;
        this.json=json;
        this.clock=clock;
    }

    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    DateLot.Page source(UUID store, Collection collection, String q, boolean attention, int page, int size, Authentication auth) {
        access.requireReport(store,auth);
        return lots.page(store,LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE)),q.strip(),null,
                attention,"expiry",page,size,collection.name());
    }

    @Transactional
    Summary create(UUID storeId, Create request, String key, Authentication auth) {
        var store = access.requireReport(storeId,auth);
        var actor = ((SessionPrincipal)auth.getPrincipal()).user();
        var selected = request.items().stream().sorted(Comparator.comparing(Selected::lotId)).toList();
        var ids = selected.stream().map(Selected::lotId).distinct().toList();
        if (ids.size()!=selected.size()) throw problem(HttpStatus.UNPROCESSABLE_ENTITY,"DATE_REPORT_DUPLICATE_LOT");

        String signature = fingerprint(json.writeValueAsString(List.of(storeId,request.title(),request.periodStart(),request.periodEnd(),selected)));
        db.fetch("SELECT pg_advisory_xact_lock(hashtextextended(?,0))","date-report:"+actor.id()+":"+key);
        var replay = db.fetchOne("SELECT * FROM date_reports WHERE actor_user_id=? AND idempotency_key=?",actor.id(),key);
        if (replay!=null) {
            if (!signature.equals(replay.get("request_hash",String.class))) throw problem(HttpStatus.CONFLICT,"IDEMPOTENCY_CONFLICT");
            return summary(replay);
        }
        var now = clock.instant();
        var date = now.atZone(TimeConfiguration.BUSINESS_ZONE).toLocalDate();
        if (date.isBefore(request.periodStart()) || date.isAfter(request.periodEnd())) {
            throw problem(HttpStatus.UNPROCESSABLE_ENTITY,"DATE_REPORT_PERIOD_CLOSED");
        }

        var rows = lots.reportSnapshots(storeId,ids,date);
        if (rows.size()!=ids.size()) throw problem(HttpStatus.NOT_FOUND,"DATE_REPORT_LOT_NOT_FOUND");
        var versions = selected.stream().collect(Collectors.toMap(Selected::lotId,Selected::version));
        for (var row : rows) {
            if (versions.get(row.id())!=row.version()) throw problem(HttpStatus.CONFLICT,"DATE_REPORT_SOURCE_CHANGED");
        }
        UUID id = UUID.randomUUID();
        var header=db.fetchSingle("""
                INSERT INTO date_reports(id,store_id,actor_user_id,idempotency_key,request_hash,title,period_start,period_end,
                    as_of,created_at,snapshot_store_code,snapshot_store_name,snapshot_actor_name,row_count,total_ea,total_kg)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *
                """,id,storeId,actor.id(),key,signature,request.title(),request.periodStart(),request.periodEnd(),date,
                Timestamp.from(now),store.code(),store.name(),actor.displayName(),rows.size(),remaining(rows,"EA"),remaining(rows,"kg"));
        var insert = db.batch("INSERT INTO date_report_rows(report_id,ordinal,lot_id,snapshot) VALUES(?,?,?,CAST(? AS jsonb))");
        int ordinal=0;
        for (var row : rows) insert.bind(id,++ordinal,row.id(),json.writeValueAsString(row));
        insert.execute();
        db.execute("""
                INSERT INTO audit_events(id,actor_user_id,action,target_type,target_id,store_id,metadata,occurred_at)
                VALUES(?,?,'DATE_REPORT_CREATED','DATE_REPORT',?,?,jsonb_build_object('rowCount',CAST(? AS int)),?)
                """,UUID.randomUUID(),actor.id(),id,storeId,rows.size(),Timestamp.from(now));
        return summary(header);
    }

    private static BigDecimal remaining(List<DateLot> rows,String unit) {
        return rows.stream().filter(row -> row.unit().equals(unit)).map(row -> new BigDecimal(row.remainingQuantity()))
                .reduce(BigDecimal.ZERO,BigDecimal::add);
    }

    @Transactional(readOnly=true)
    Summary detail(UUID store, UUID id, Authentication auth) {
        access.requireReport(store,auth);
        var row=db.fetchOne("SELECT * FROM date_reports WHERE store_id=? AND id=?",store,id);
        if (row==null) throw problem(HttpStatus.NOT_FOUND,"DATE_REPORT_NOT_FOUND");
        return summary(row);
    }

    @Transactional(readOnly=true)
    Page<DateLot> rows(UUID store, UUID id, int page, int size, Authentication auth) {
        var header=detail(store,id,auth);
        var items=db.fetch("SELECT snapshot::text FROM date_report_rows WHERE report_id=? ORDER BY ordinal LIMIT ? OFFSET ?",
                id,size,(long)(page-1)*size).map(row -> json.readValue(row.get(0,String.class),DateLot.class));
        return new Page<>(items,page,size,header.rowCount(),(header.rowCount()+size-1)/size);
    }

    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    Page<Summary> list(UUID store, String q, int page, int size, Authentication auth) {
        access.requireReport(store,auth);
        String filter=" FROM date_reports WHERE store_id=? AND strpos(lower(title||' '||id::text),lower(?))>0";
        long total=db.fetchSingle("SELECT count(*)"+filter,store,q.strip()).get(0,Long.class);
        var items=db.fetch("SELECT *"+filter+" ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?",store,q.strip(),size,
                (long)(page-1)*size).map(this::summary);
        return new Page<>(items,page,size,total,(total+size-1)/size);
    }

    private Summary summary(Record r) {
        return new Summary(r.get("id",UUID.class),r.get("title",String.class),r.get("period_start",LocalDate.class),
                r.get("period_end",LocalDate.class),r.get("as_of",LocalDate.class),r.get("created_at",Timestamp.class).toInstant(),
                new Store(r.get("store_id",UUID.class),r.get("snapshot_store_code",String.class),r.get("snapshot_store_name",String.class)),
                new DateLot.Actor(r.get("actor_user_id",UUID.class),r.get("snapshot_actor_name",String.class)),r.get("row_count",Integer.class),
                r.get("total_ea",BigDecimal.class).toBigIntegerExact().toString(),r.get("total_kg",BigDecimal.class).toPlainString());
    }

    private static String fingerprint(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
    private static ApiProblemException problem(HttpStatus status,String code) {
        return new ApiProblemException(status,code,"Cannot complete this DATE report request.");
    }
}
