# Co.op Food KPH backend

Lean Java 21/Spring Boot modular monolith. PostgreSQL is the system of record;
Flyway owns schema changes and jOOQ is the SQL access layer. Feature HTTP APIs
will be added only with the OpenAPI contract that consumes them.

## Run

Set `KPH_DATABASE_URL`, `KPH_DATABASE_USERNAME` and `KPH_DATABASE_PASSWORD`, then:

```bash
./mvnw spring-boot:run
```

Public operational endpoints are limited to `/actuator/health`, its probe paths,
and `/actuator/info`. All other routes are denied until identity endpoints and
their explicit authorization rules are implemented.

## Verify

```bash
./mvnw verify
```

The architecture test runs without infrastructure. The clean-database smoke test
uses PostgreSQL 17 through Testcontainers and `@ServiceConnection`; it is skipped
only when a Docker-compatible runtime is unavailable.

## Module boundaries

- `catalog`: staging, publication and barcode lookup
- `identity`: users, roles and memberships
- `store`: store-scoped access boundary
- `kph`: KPH records, lifecycle and private evidence metadata
- `foundation`: narrowly shared web, security and time configuration

Do not introduce direct feature-to-feature cycles. Shared domain contracts should
stay small and explicit rather than growing a generic platform layer.
