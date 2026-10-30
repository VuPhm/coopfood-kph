package vn.coopfood.kph.store;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EffectiveStoreAccess(UUID id, String code, String name, KphCapabilities kph) {
    public record KphCapabilities(boolean view, boolean create, boolean review, @JsonProperty("export") boolean exportAllowed) {
    }
}
