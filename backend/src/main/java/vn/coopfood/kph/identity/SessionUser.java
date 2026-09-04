package vn.coopfood.kph.identity;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record SessionUser(
        UUID id,
        String username,
        String displayName,
        Set<GlobalRole> globalRoles,
        List<StoreContext> stores) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public SessionUser {
        globalRoles = Set.copyOf(globalRoles);
        stores = List.copyOf(stores);
    }
}
