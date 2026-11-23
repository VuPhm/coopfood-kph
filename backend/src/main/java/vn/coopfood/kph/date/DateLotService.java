package vn.coopfood.kph.date;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import vn.coopfood.kph.catalog.CatalogService;
import vn.coopfood.kph.date.DateLotRepository.Product;
import vn.coopfood.kph.foundation.time.TimeConfiguration;
import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.identity.SessionPrincipal;
import vn.coopfood.kph.store.DateStoreAccessPolicy;

@Service
class DateLotService {
    private final DateLotRepository lots;
    private final DateStoreAccessPolicy access;
    private final CatalogService catalog;
    private final ObjectMapper json;
    private final Clock clock;

    DateLotService(DateLotRepository lots, DateStoreAccessPolicy access, CatalogService catalog,
            ObjectMapper json, Clock clock) {
        this.lots = lots;
        this.access = access;
        this.catalog = catalog;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    DateLot.Page list(UUID store, String q, String phase, boolean attention, String sort, int page, int size,
            Authentication auth) {
        access.requireAccess(store,auth);
        if (phase != null && !Set.of("SAFE","WARNING","DANGER","EXPIRED","BEFORE_NSX","MISSING").contains(phase)
                || !Set.of("default","expiry","name").contains(sort) || page < 1 || size < 1 || size > 100) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid DATE list parameters.");
        }
        return lots.page(store, LocalDate.now(clock.withZone(TimeConfiguration.BUSINESS_ZONE)),
                query(q),phase,attention,sort,page,size);
    }

    @Transactional(readOnly = true)
    DateLot get(UUID store, UUID id, Authentication auth) {
        access.requireAccess(store,auth);
        return entry(store,id,false).lot();
    }

    @Transactional(readOnly = true)
    List<DateLot.Suggestion> suggestions(UUID store, String q, Authentication auth) {
        access.requireAccess(store,auth);
        return lots.suggest(store,query(q));
    }

    @Transactional
    DateLot.WriteResult create(UUID store, String key, ObjectNode body, Authentication auth) {
        access.requireAccess(store,auth);
        var actor = (SessionPrincipal) auth.getPrincipal();
        if (key.length()<16 || key.length()>128 || key.isBlank() || !key.equals(key.strip())) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Invalid Idempotency-Key.");
        }
        var input = DateLotInput.parse(body,false);
        String hash = fingerprint(input);
        lots.lockCreate(store, actor.userId(), key);
        var receipt = lots.receipt(store,actor.userId(),key);
        if (receipt.isPresent()) {
            if (!receipt.get().hash().equals(hash)) {
                throw new ApiProblemException(HttpStatus.CONFLICT,"IDEMPOTENCY_KEY_REUSED","This key identifies a different create.");
            }
            return json.readValue(receipt.get().response(),DateLot.WriteResult.class);
        }

        Product product = resolve(input);
        lots.lockDuplicateCheck(store, product.sku());
        var lot = lots.insert(store, UUID.randomUUID(), input, product, actor, clock.instant());
        var result = new DateLot.WriteResult(lot,lots.duplicate(lot));
        lots.audit("DATE_LOT_CREATED",lot,json.writeValueAsString(new Change(null,AuditSnapshot.from(lot),null)));
        lots.saveReceipt(store,actor.userId(),key,hash,lot.id(),json.writeValueAsString(result));
        return result;
    }

    @Transactional
    DateLot.WriteResult update(UUID store, UUID id, ObjectNode body, Authentication auth) {
        access.requireUpdate(store,auth);
        var current = entry(store,id,true);
        var input = DateLotInput.parse(body,true);
        var expected = body.get("expectedVersion");
        if (expected == null || !expected.isIntegralNumber() || !expected.canConvertToLong() || expected.asLong()<1) {
            throw DateLotInput.invalid("A positive expectedVersion is required.");
        }
        String reason = DateLotInput.text(body,"reason",500,false);
        if (current.lot().version() != expected.asLong()) {
            throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_VERSION_CONFLICT","Reload the lot before editing.");
        }
        boolean sameIdentity = current.lot().lookupStatus().equals(input.lookupStatus())
                && Objects.equals(current.lot().barcode(),input.barcode())
                && current.lot().skuCode().equals(input.skuCode()) && current.lot().productName().equals(input.productName());
        Product product = sameIdentity ? current.product() : resolve(input);
        lots.lockDuplicateCheck(store, product.sku());
        var updated = lots.update(store,id,input,product,(SessionPrincipal)auth.getPrincipal(),clock.instant());
        lots.audit("DATE_LOT_UPDATED",updated,json.writeValueAsString(new Change(AuditSnapshot.from(current.lot()),
                AuditSnapshot.from(updated),reason)));
        return new DateLot.WriteResult(updated,lots.duplicate(updated));
    }

    private DateLotRepository.Entry entry(UUID store, UUID id, boolean lock) {
        return lots.find(store,id,lock).orElseThrow(() ->
                new ApiProblemException(HttpStatus.NOT_FOUND,"DATE_LOT_NOT_FOUND","No such lot in this store."));
    }

    private Product resolve(DateLotInput input) {
        if (input.barcode() != null) {
            var resolved = catalog.resolveCurrent(input.barcode());
            if (resolved.isPresent() != input.lookupStatus().equals("FOUND")) {
                throw new ApiProblemException(HttpStatus.CONFLICT,"DATE_CATALOG_CHANGED","Look up the barcode again.");
            }
            if (resolved.isPresent()) {
                var value = resolved.get();
                return new Product(value.skuCode(),value.productName(),value.productId(),value.catalogVersionId(),
                        value.supplierCode(),value.supplierName());
            }
        }
        return new Product(input.skuCode(),input.productName(),null,null,null,null);
    }

    private String fingerprint(DateLotInput input) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(input)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String query(String q) {
        String term = q == null ? "" : q.strip();
        if (term.codePointCount(0,term.length())>200) {
            throw new ApiProblemException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Search term is too long.");
        }
        return term;
    }

    private record AuditSnapshot(String lookupStatus, String barcode, String skuCode, String productName,
            String lotCode, LocalDate manufacturedOn, LocalDate expiresOn, String unit,
            String trackedQuantity, long version) {
        static AuditSnapshot from(DateLot lot) {
            return new AuditSnapshot(lot.lookupStatus(), lot.barcode(), lot.skuCode(), lot.productName(),
                    lot.lotCode(), lot.manufacturedOn(), lot.expiresOn(), lot.unit(), lot.trackedQuantity(), lot.version());
        }
    }

    private record Change(AuditSnapshot before, AuditSnapshot after, String reason) {}
}
