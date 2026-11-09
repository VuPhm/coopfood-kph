package vn.coopfood.kph.store;

import java.util.List;
import java.util.UUID;

public record KphStoreAccess(UUID id, String code, String name, List<Capability> capabilities) {
    public enum Capability { VIEW, CREATE, REVIEW, EXPORT }
}
