package vn.coopfood.kph.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.store.StoreAccessService;

class StoreAccessServiceTest {

    private static final UUID ALLOWED_STORE = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID OTHER_STORE = UUID.fromString("20000000-0000-4000-8000-000000000002");

    private final StoreAccessService service = new StoreAccessService();

    @Test
    void acceptsOnlyMembershipPresentInTheRefreshedPrincipal() {
        StoreContext expected = new StoreContext(ALLOWED_STORE, "0001", "Nguyễn Kiệm", StoreRole.EMPLOYEE);
        var authentication = authenticationWith(List.of(expected));

        assertThat(service.requireMembership(ALLOWED_STORE, authentication)).isEqualTo(expected);
    }

    @Test
    void rejectsCrossStoreAccess() {
        var authentication = authenticationWith(List.of(
                new StoreContext(ALLOWED_STORE, "0001", "Nguyễn Kiệm", StoreRole.EMPLOYEE)));

        assertThatThrownBy(() -> service.requireMembership(OTHER_STORE, authentication))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(problem.code()).isEqualTo("STORE_ACCESS_DENIED");
                });
    }

    @Test
    void rejectsMissingAuthentication() {
        assertThatThrownBy(() -> service.requireMembership(ALLOWED_STORE, null))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(problem.code()).isEqualTo("AUTHENTICATION_REQUIRED");
                });
    }

    @Test
    void requiresTheStoreManagerMembershipAndDoesNotTreatChainAdminAsABypass() {
        StoreContext manager = new StoreContext(ALLOWED_STORE, "0001", "Nguyễn Kiệm", StoreRole.STORE_MANAGER);
        assertThat(service.requireStoreManager(ALLOWED_STORE, authenticationWith(List.of(manager))))
                .isEqualTo(manager);

        SessionUser chainAdminEmployee = new SessionUser(
                UUID.fromString("10000000-0000-4000-8000-000000000001"),
                "admin.demo",
                "Admin Demo",
                Set.of(GlobalRole.CHAIN_ADMIN),
                List.of(new StoreContext(ALLOWED_STORE, "0001", "Nguyễn Kiệm", StoreRole.EMPLOYEE)));
        SessionPrincipal principal = new SessionPrincipal(chainAdminEmployee);
        var authentication = UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities());

        assertThatThrownBy(() -> service.requireStoreManager(ALLOWED_STORE, authentication))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(problem.code()).isEqualTo("STORE_MANAGER_REQUIRED");
                });
    }

    private UsernamePasswordAuthenticationToken authenticationWith(List<StoreContext> stores) {
        SessionUser user = new SessionUser(
                UUID.fromString("10000000-0000-4000-8000-000000000001"),
                "employee.demo",
                "Nhân viên Demo",
                Set.of(),
                stores);
        SessionPrincipal principal = new SessionPrincipal(user);
        return UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities());
    }
}
