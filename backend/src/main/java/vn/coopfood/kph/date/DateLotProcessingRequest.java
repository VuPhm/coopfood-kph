package vn.coopfood.kph.date;

import java.math.BigDecimal;
import java.util.Set;

import org.springframework.http.HttpStatus;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.kph.KphCreateRequest;

record DateLotProcessingRequest(long expectedVersion, KphCreateRequest kph) {
    static DateLotProcessingRequest parse(ObjectNode body, ObjectMapper mapper) {
        JsonNode version = body.get("expectedVersion"), kph = body.get("kph");
        if (body.size() != 2 || version == null || !version.isIntegralNumber() || !version.canConvertToLong()
                || version.longValue() < 1 || kph == null || !kph.isObject()) {
            throw invalid("expectedVersion and kph are required.");
        }
        Set<String> fields = Set.of("type", "detectedDate", "processedDate", "quantity", "unit", "condition",
                "conditionDetail", "resolution", "resolutionDetail", "note", "photoLastModified");
        for (String field : kph.propertyNames()) {
            if (!fields.contains(field)) throw invalid("Unsupported KPH processing field.");
        }
        JsonNode quantity=kph.get("quantity");
        if (quantity == null || !quantity.isString() || quantity.asString().length() > 128
                || !quantity.asString().matches("[0-9]+(\\.[0-9]+)?")) {
            throw invalid("KPH quantity must be a decimal string.");
        }
        try {
            return new DateLotProcessingRequest(version.longValue(), mapper.treeToValue(kph, KphCreateRequest.class));
        } catch (Exception exception) {
            throw invalid("Invalid KPH processing payload.");
        }
    }
    void validate(DateLot lot) {
        if (kph.type() == null || kph.detectedDate() == null || kph.condition() == null
                || kph.resolution() == null || kph.unit() == null) {
            throw invalid("KPH type, detectedDate, unit, condition, and resolution are required.");
        }
        if (kph.photoLastModified() != null && kph.photoLastModified().size() > 3) {
            throw invalid("Invalid photoLastModified.");
        }
        if (kph.quantity()==null || kph.quantity().signum()<=0 || kph.quantity().compareTo(new BigDecimal(lot.remainingQuantity()))>0)
            throw new ApiProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "DATE_PROCESS_QUANTITY_INVALID",
                    "Processing quantity must be positive and no greater than the remaining quantity.");
        if (!kph.unit().name().equals(lot.unit())) throw invalid("KPH unit must match the DATE lot.");
        if (lot.kphType() != null && !lot.kphType().equals(kph.type().name())) {
            throw invalid("KPH type must match the first processing.");
        }
    }
    static ApiProblemException invalid(String detail) { return new ApiProblemException(HttpStatus.UNPROCESSABLE_ENTITY,"DATE_PROCESS_INVALID",detail); }
}
