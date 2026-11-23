package vn.coopfood.kph.date;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Set;

import org.springframework.http.HttpStatus;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import vn.coopfood.kph.foundation.web.ApiProblemException;

record DateLotInput(String lookupStatus, String barcode, String skuCode, String productName,
        String lotCode, LocalDate manufacturedOn, LocalDate expiresOn, BigDecimal trackedQuantity, String unit) {
    private static final Set<String> FIELDS = Set.of("lookupStatus", "barcode", "skuCode", "productName",
            "lotCode", "manufacturedOn", "expiresOn", "trackedQuantity", "unit");

    static DateLotInput parse(ObjectNode body, boolean update) {
        for (String name : body.propertyNames()) {
            if (!FIELDS.contains(name) && !(update && (name.equals("expectedVersion") || name.equals("reason")))) {
                throw new ApiProblemException(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "Unknown DATE input field.");
            }
        }
        String status = text(body, "lookupStatus", 16, false);
        String barcode = text(body, "barcode", 128, true);
        if (!Set.of("FOUND","NOT_FOUND","MANUAL").contains(status) || status.equals("MANUAL") != (barcode == null)) {
            throw invalid("lookupStatus and barcode must describe the same lookup.");
        }
        String unit = text(body,"unit",2,false);
        String raw = text(body,"trackedQuantity",128,false);
        if (!raw.matches("[0-9]+(\\.[0-9]+)?")) throw invalid("A positive decimal string is required.");
        BigDecimal quantity = new BigDecimal(raw);
        if (quantity.signum() <= 0 || !Set.of("EA","kg").contains(unit)
                || (unit.equals("EA") && quantity.stripTrailingZeros().scale() > 0)) {
            throw invalid("Enter a positive quantity in kg or a whole positive quantity in EA.");
        }
        LocalDate manufactured = date(body,"manufacturedOn",true);
        LocalDate expires = date(body,"expiresOn",false);
        if (manufactured != null && !expires.isAfter(manufactured)) throw invalid("HSD must be after NSX.");
        return new DateLotInput(status, barcode, text(body,"skuCode",50,false), text(body,"productName",200,false),
                text(body,"lotCode",128,true), manufactured, expires, quantity, unit);
    }

    static String text(ObjectNode body, String name, int max, boolean nullable) {
        JsonNode value = body.get(name);
        if (value != null && value.isNull() && nullable) return null;
        if (value == null || !value.isString()) throw invalid("Invalid " + name + ".");
        String text = value.asString().strip();
        if (text.isEmpty() || text.codePointCount(0,text.length()) > max) throw invalid("Invalid " + name + ".");
        return text;
    }

    private static LocalDate date(ObjectNode body, String name, boolean nullable) {
        String text = text(body,name,10,nullable);
        if (text == null) return null;
        try {
            LocalDate value = LocalDate.parse(text);
            if (value.getYear() < 1) throw invalid("Invalid " + name + ".");
            return value;
        } catch (DateTimeParseException exception) {
            throw invalid("Invalid " + name + ".");
        }
    }

    static ApiProblemException invalid(String detail) {
        return new ApiProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "DATE_VALIDATION_ERROR", detail);
    }
}
