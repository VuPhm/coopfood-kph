package vn.coopfood.kph.identity;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record SessionPrincipal(SessionUser user, long credentialVersion) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public SessionPrincipal(SessionUser user) {
        this(user, 1L);
    }

    public UUID userId() {
        return user.id();
    }

    public Collection<? extends GrantedAuthority> authorities() {
        return user.globalRoles().stream()
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.name()))
                .toList();
    }
}
