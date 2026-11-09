package vn.coopfood.kph.identity;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.deser.jdk.StringDeserializer;

final class MembershipRequests {
    private MembershipRequests() { }

    public record Lookup(@JsonDeserialize(using = StrictString.class) String username) {
        @JsonAnySetter
        void rejectUnknownProperty(String propertyName, Object ignoredValue) {
            throw new IllegalArgumentException("Unknown membership lookup property.");
        }
    }

    public record Upsert(@JsonDeserialize(using = StrictString.class) String role,
            @JsonDeserialize(using = StrictString.class) String reason) {
        @JsonAnySetter
        void rejectUnknownProperty(String propertyName, Object ignoredValue) {
            throw new IllegalArgumentException("Unknown membership upsert property.");
        }
    }

    public record Revoke(@JsonDeserialize(using = StrictString.class) String reason) {
        @JsonAnySetter
        void rejectUnknownProperty(String propertyName, Object ignoredValue) {
            throw new IllegalArgumentException("Unknown membership revoke property.");
        }
    }

    // Limit strict scalar handling to these new wire contracts; do not change
    // coercion behavior globally for existing endpoints.
    public static final class StrictString extends StringDeserializer {
        @Override
        public String deserialize(JsonParser parser, DeserializationContext context) {
            if (!parser.hasToken(JsonToken.VALUE_STRING)) {
                return (String) context.handleUnexpectedToken(String.class, parser);
            }
            return parser.getString();
        }
    }
}
