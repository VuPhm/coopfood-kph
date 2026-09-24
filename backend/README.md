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
`/actuator/info` and `POST /api/v1/auth/login`. Authenticated routes include
session, store-scoped catalog/KPH, credential self-change and the scoped Admin
APIs in the [OpenAPI contract](../contracts/openapi/kph.openapi.yaml); unmatched
routes remain denied by default. KPH create requires CSRF,
`Idempotency-Key` and one to three JPEG/PNG multipart photos. Local private
media is stored under `KPH_MEDIA_ROOT` (or `.data/kph-media` by default) and is
served only through the authorized stamped-photo endpoint.

Login reads active users, global roles and active store memberships from the
database. New password hashes use prefixed PBKDF2; legacy BCrypt hashes remain
verifiable under [ADR-0005](../docs/adr/0005-password-hash-migration.md).
Successful login returns a CSRF token for the `X-CSRF-TOKEN` header and creates
the HttpOnly `KPH_SESSION` cookie. There is no demo-user bootstrap or
self-service signup.

## Verify

```bash
./mvnw verify
```

The architecture test runs without infrastructure. Full verification requires a
running Docker-compatible runtime: PostgreSQL 17 integration tests use
Testcontainers and `@ServiceConnection`, and fail instead of silently skipping
when Docker is unavailable. For OrbStack, set
`DOCKER_HOST=unix://$HOME/.orbstack/run/docker.sock` when the default socket is not
available. KPH tests use a fixed business clock and a temporary media directory.

The `Verify Foundation` pull-request workflow runs frontend verification and
backend verification as separate jobs. Both must pass before accepting a slice;
this workflow does not deploy the Pilot.

## Module boundaries

- `catalog`: staging, publication and barcode lookup
- `identity`: users, roles and memberships
- `store`: store-scoped access boundary
- `kph`: KPH records, lifecycle and private evidence metadata
- `foundation`: narrowly shared web, security and time configuration

Do not introduce direct feature-to-feature cycles. Shared domain contracts should
stay small and explicit rather than growing a generic platform layer.

## Foundation-01 browser runtime

Use Java 21 explicitly when the system default is older. jOOQ OSS 3.20.17 is
pinned for PostgreSQL 17 (ADR-0003). The online media adapter uses
metadata-extractor 2.19.0, accepts JPEG/PNG originals up to 10 MiB per part and a
32 MiB multipart request, and rejects images exceeding 40 million decoded pixels
or 20,000 pixels on either axis. Original bytes are retained; EXIF orientation is
applied only to the stamped derivative. HEIC online is currently unsupported.

See `e2e/README.md` for the disposable synthetic database and browser suite.
Never use the E2E seed on a shared or operational database.
