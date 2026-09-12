package vn.coopfood.kph.identity;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

public record StoreContext(UUID id, String code, String name, StoreRole role) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
