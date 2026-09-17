package vn.coopfood.kph.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import vn.coopfood.kph.foundation.web.ApiProblemException;
import vn.coopfood.kph.store.StoreAccessRepository;
import vn.coopfood.kph.store.StoreAccessRepository.AccessSnapshot;
import vn.coopfood.kph.store.StoreAccessService;

class StoreAccessServiceTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID STORE_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");

    private FakeStoreAccessRepository repository;
    private StoreAccessService service;
    private UsernamePasswordAuthenticationToken authentication;

    @BeforeEach
    void setUp() {
        repository = new FakeStoreAccessRepository();
        service = new StoreAccessService(repository);
        SessionPrincipal principal = new SessionPrincipal(new SessionUser(
                USER_ID, "manager.demo", "Manager Demo", Set.of(), List.of()));
        authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, principal.authorities());
    }

    @Test
    void permitsMembershipRegionAndChainScopesForStoreWork() {
        for (AccessSnapshot access : List.of(
                access(StoreRole.EMPLOYEE, false, false),
                access(null, true, false),
                access(null, false, true))) {
            repository.answers.add(Optional.of(access));

            assertThat(service.requireMembership(STORE_ID, authentication))
                    .isEqualTo(new StoreAccessService.AuthorizedStore(STORE_ID, "0001", "Nguyễn Kiệm"));
        }
    }

    @Test
    void managerActionsAcceptOnlyStoreRegionOrChainManagerScope() {
        repository.answers.add(Optional.of(access(StoreRole.STORE_MANAGER, false, false)));
        repository.answers.add(Optional.of(access(null, true, false)));
        repository.answers.add(Optional.of(access(null, false, true)));
        repository.answers.add(Optional.of(access(StoreRole.EMPLOYEE, false, false)));

        service.requireStoreManager(STORE_ID, authentication);
        service.requireStoreManager(STORE_ID, authentication);
        service.requireStoreManager(STORE_ID, authentication);
        assertThatThrownBy(() -> service.requireStoreManager(STORE_ID, authentication))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(problem.code()).isEqualTo("STORE_MANAGER_REQUIRED");
                });
    }

    @Test
    void deniesValidButOutOfScopeOrInactiveStore() {
        repository.answers.add(Optional.of(access(null, false, false)));
        repository.answers.add(Optional.empty());

        assertThatThrownBy(() -> service.requireMembership(STORE_ID, authentication))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(problem.code()).isEqualTo("STORE_ACCESS_DENIED");
                });
        assertThatThrownBy(() -> service.requireMembership(STORE_ID, authentication))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(problem.code()).isEqualTo("STORE_ACCESS_DENIED");
                });
    }

    @Test
    void rejectsMissingAuthenticationBeforeQueryingScope() {
        assertThatThrownBy(() -> service.requireMembership(STORE_ID, null))
                .isInstanceOfSatisfying(ApiProblemException.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(problem.code()).isEqualTo("AUTHENTICATION_REQUIRED");
                });
    }

    private AccessSnapshot access(StoreRole membership, boolean regionManager, boolean chainAdmin) {
        return new AccessSnapshot(
                STORE_ID, "0001", "Nguyễn Kiệm", membership, regionManager, chainAdmin);
    }

    private static final class FakeStoreAccessRepository extends StoreAccessRepository {
        private final List<Optional<AccessSnapshot>> answers = new ArrayList<>();
        private int index;

        private FakeStoreAccessRepository() {
            super(null);
        }

        @Override
        public Optional<AccessSnapshot> findActiveAccess(UUID userId, UUID storeId) {
            return answers.get(index++);
        }
    }
}
