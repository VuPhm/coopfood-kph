import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createConfig, lint } from "@redocly/openapi-core";
import Ajv2020 from "ajv/dist/2020.js";
import yaml from "js-yaml";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(repositoryRoot, "contracts/openapi/kph.openapi.yaml");
const fixturesRoot = path.join(repositoryRoot, "contracts/fixtures");
const manifestPath = path.join(fixturesRoot, "golden/fixture-manifest.json");
const provisioningPolicyFixturePath = path.join(
  fixturesRoot,
  "golden/identity/provisioning-policy-cases.json",
);
const contractSchemaId = "urn:coopfood-kph:openapi";
const acceptedKphLookupStatuses = ["FOUND", "NOT_FOUND", "MANUAL"];

const apiFixtureSchemas = new Map([
  ["api/session.json", "SessionResponse"],
  ["api/barcode-found.json", "BarcodeLookupResponse"],
  ["api/barcode-not-found.json", "BarcodeLookupResponse"],
  ["api/kph-record.json", "KphRecord"],
  ["api/kph-create.json", "KphCreateRequest"],
  ["api/kph-approval.json", "KphApprovalRequest"],
  ["api/kph-export.json", "KphExportRequest"],
  ["api/lifecycle-targets.json", "LifecycleTarget"],
  ["api/lifecycle-schedules.json", "LifecycleSchedule"],
  ["api/catalog-imports.json", "CatalogImportBatch"],
  ["api/catalog-import-detail.json", "CatalogImportDetail"],
  ["api/catalog-import-upload.json", "CatalogImportUploadResponse"],
]);

const acceptedKphPolicies = {
  TPCN: {
    conditions: ["NEAR_EXPIRY", "EXPIRED", "TORN_PACKAGING", "VACUUM_LEAK", "OTHER"],
    defaultCondition: "NEAR_EXPIRY",
    resolutions: ["CANCEL", "EXCHANGE", "RETURN", "OTHER"],
    defaultResolution: "CANCEL",
  },
  TPTS: {
    conditions: ["BRUISED_WATERLOGGED", "ROTTEN_MOLDY", "NEAR_EXPIRY", "EXPIRED", "OTHER"],
    defaultCondition: "BRUISED_WATERLOGGED",
    resolutions: ["CANCEL", "OTHER"],
    defaultResolution: "CANCEL",
  },
};

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findJsonFiles(entryPath)
        : Promise.resolve(entry.name.endsWith(".json") ? [entryPath] : []);
    }),
  );
  return nestedFiles.flat();
}

function problemLocation(problem) {
  const start = problem.location?.[0]?.start;
  return start ? `${start.line}:${start.col}` : "unknown location";
}

async function validateOpenApiStructure() {
  const config = await createConfig({
    rules: {
      struct: "error",
      "no-unresolved-refs": "error",
    },
  });
  const problems = await lint({ ref: contractPath, config });
  const errors = problems.filter((problem) => problem.severity === "error");
  assert.equal(
    errors.length,
    0,
    errors
      .map(
        (problem) =>
          `${problemLocation(problem)} [${problem.ruleId}] ${problem.message}`,
      )
      .join("\n"),
  );
}

async function validateManifestAndJsonSyntax() {
  const manifest = await readJson(manifestPath);
  assert.ok(Array.isArray(manifest.fixtures), "Fixture manifest must contain a fixtures array.");

  const resources = manifest.fixtures.map((entry) => entry.resource);
  assert.equal(
    new Set(resources).size,
    resources.length,
    "Fixture manifest must not contain duplicate resources.",
  );

  const actualApiResources = (await readdir(path.join(fixturesRoot, "api"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => `api/${entry.name}`);
  const mappedApiResources = [...apiFixtureSchemas.keys()];
  const manifestApiResources = resources.filter((resource) => resource.startsWith("api/"));
  assertExactSet(
    actualApiResources,
    mappedApiResources,
    "API fixture schema map must cover every contracts/fixtures/api/*.json file exactly.",
  );
  assertExactSet(
    actualApiResources,
    manifestApiResources,
    "Fixture manifest must cover every contracts/fixtures/api/*.json file exactly.",
  );

  for (const resource of resources) {
    assert.equal(typeof resource, "string", "Every fixture resource must be a string.");
    const resourcePath = path.resolve(fixturesRoot, resource);
    assert.ok(
      resourcePath.startsWith(`${fixturesRoot}${path.sep}`),
      `Fixture resource escapes contracts/fixtures: ${resource}`,
    );
    const resourceStat = await stat(resourcePath).catch(() => null);
    assert.ok(resourceStat?.isFile(), `Fixture resource does not exist: ${resource}`);
  }

  const jsonFiles = await findJsonFiles(fixturesRoot);
  await Promise.all(jsonFiles.map(readJson));
  return manifest;
}

function isDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

function isDateTime(value) {
  const match = /^(\d{4}-\d{2}-\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/.exec(
    value,
  );
  if (!match || !isDate(match[1])) return false;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  const offsetHour = match[6] === undefined ? 0 : Number(match[6]);
  const offsetMinute = match[7] === undefined ? 0 : Number(match[7]);
  return (
    hour <= 23 &&
    minute <= 59 &&
    second <= 60 &&
    offsetHour <= 23 &&
    offsetMinute <= 59
  );
}

function createFixtureValidator(openApi) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addFormat("uuid", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  ajv.addFormat("date", { type: "string", validate: isDate });
  ajv.addFormat("date-time", { type: "string", validate: isDateTime });
  ajv.addSchema(openApi, contractSchemaId);
  return ajv;
}

function componentSchemaRef(componentName) {
  return `${contractSchemaId}#/components/schemas/${componentName}`;
}

function validateFixture(ajv, componentName, fixture, fixtureLabel) {
  const valid = ajv.validate(componentSchemaRef(componentName), fixture);
  assert.ok(valid, `${fixtureLabel}: ${ajv.errorsText(ajv.errors, { separator: "\n" })}`);
}

function expectInvalid(ajv, componentName, fixture, expectedKeyword, assertionLabel) {
  const valid = ajv.validate(componentSchemaRef(componentName), fixture);
  assert.equal(valid, false, `${assertionLabel} unexpectedly passed validation.`);
  assert.ok(
    ajv.errors?.some((error) => error.keyword === expectedKeyword),
    `${assertionLabel} did not fail with ${expectedKeyword}: ${ajv.errorsText(ajv.errors)}`,
  );
}

async function validateApiFixtures(openApi) {
  const ajv = createFixtureValidator(openApi);
  const fixtures = new Map();

  for (const [resource, componentName] of apiFixtureSchemas) {
    const fixture = await readJson(path.join(fixturesRoot, resource));
    if (Array.isArray(fixture)) {
      fixture.forEach((item, index) => validateFixture(ajv, componentName, item, `${resource}[${index}]`));
    } else {
      validateFixture(ajv, componentName, fixture, resource);
    }
    fixtures.set(resource, fixture);
  }

  const extraProperty = structuredClone(fixtures.get("api/session.json"));
  extraProperty.user.unexpected = true;
  expectInvalid(
    ajv,
    "SessionResponse",
    extraProperty,
    "additionalProperties",
    "SessionResponse additional-property assertion",
  );

  const missingRequired = structuredClone(fixtures.get("api/session.json"));
  delete missingRequired.user.displayName;
  expectInvalid(
    ajv,
    "SessionResponse",
    missingRequired,
    "required",
    "SessionResponse required-field assertion",
  );

  const badDiscriminator = structuredClone(fixtures.get("api/barcode-found.json"));
  badDiscriminator.status = "UNKNOWN";
  expectInvalid(
    ajv,
    "BarcodeLookupResponse",
    badDiscriminator,
    "oneOf",
    "BarcodeLookupResponse discriminator assertion",
  );

  const badUuid = structuredClone(fixtures.get("api/session.json"));
  badUuid.user.id = "not-a-uuid";
  expectInvalid(ajv, "SessionResponse", badUuid, "format", "SessionResponse UUID assertion");

  const badCalendarDate = structuredClone(fixtures.get("api/kph-record.json"));
  badCalendarDate.detectedDate = "2026-02-30";
  expectInvalid(ajv, "KphRecord", badCalendarDate, "format", "KphRecord calendar-date assertion");

  const badDateTime = structuredClone(fixtures.get("api/kph-record.json"));
  badDateTime.createdAt = "2026-01-16T25:31:05+07:00";
  expectInvalid(ajv, "KphRecord", badDateTime, "format", "KphRecord date-time assertion");

  const badEnum = structuredClone(fixtures.get("api/kph-record.json"));
  badEnum.type = "UNKNOWN";
  expectInvalid(ajv, "KphRecord", badEnum, "enum", "KphRecord enum assertion");

  const notFound = fixtures.get("api/barcode-not-found.json");
  assert.equal(notFound.status, "NOT_FOUND", "Barcode not-found fixture must have status NOT_FOUND.");
  assert.equal(
    Object.hasOwn(notFound, "product"),
    false,
    "NOT_FOUND lookup must not infer a product; this does not prohibit direct manual KPH entry.",
  );

  const baseCreateRequest = fixtures.get("api/kph-create.json");
  validateFixture(
    ajv,
    "KphCreateRequest",
    baseCreateRequest,
    "KphCreateRequest whole EA quantity assertion",
  );

  const fractionalEach = structuredClone(baseCreateRequest);
  fractionalEach.quantity = 1.25;
  expectInvalid(
    ajv,
    "KphCreateRequest",
    fractionalEach,
    "multipleOf",
    "KphCreateRequest fractional EA quantity assertion",
  );

  const fractionalKg = structuredClone(baseCreateRequest);
  fractionalKg.unit = "kg";
  fractionalKg.quantity = 1.25;
  validateFixture(
    ajv,
    "KphCreateRequest",
    fractionalKg,
    "KphCreateRequest fractional kg quantity assertion",
  );

  for (const [type, policy] of Object.entries(acceptedKphPolicies)) {
    for (const condition of policy.conditions) {
      validateFixture(ajv, "KphCreateRequest", {
        ...baseCreateRequest, type, condition,
      }, `${type}/${condition} pilot condition must remain accepted`);
    }
  }
  for (const unit of ["EA", "kg"]) {
    for (const quantity of [0, -1]) {
      expectInvalid(ajv, "KphCreateRequest", {
        ...baseCreateRequest, unit, quantity,
      }, "exclusiveMinimum", `${unit} nonpositive quantity assertion`);
    }
  }
  expectInvalid(ajv, "KphCreateRequest", {
    ...baseCreateRequest, quantity: 1.0004,
  }, "multipleOf", "EA fractional precision must not round to a whole unit");
  validateFixture(ajv, "KphCreateRequest", {
    ...baseCreateRequest, unit: "kg", quantity: 0.0001,
  }, "Positive kg precision must not round to zero");
}

function enumValues(openApi, schemaName) {
  const values = openApi.components?.schemas?.[schemaName]?.enum;
  assert.ok(Array.isArray(values), `OpenAPI component ${schemaName} must define an enum.`);
  assert.equal(new Set(values).size, values.length, `${schemaName} enum contains duplicate values.`);
  return values;
}

function assertSameValues(actual, expected, label) {
  assert.deepEqual([...new Set(actual)].sort(), [...new Set(expected)].sort(), label);
}

function assertExactSet(actual, expected, label) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
}

async function validateGoldenKphEnums(openApi) {
  const cases = await readJson(path.join(fixturesRoot, "golden/kph/field-policy-cases.json"));
  assert.ok(Array.isArray(cases) && cases.length > 0, "Golden KPH field-policy cases must not be empty.");

  const fixtureTypes = cases.map((fixture) => fixture.type);
  assert.equal(
    new Set(fixtureTypes).size,
    fixtureTypes.length,
    "Golden KPH field-policy cases must define each KPH type exactly once.",
  );
  assertExactSet(
    fixtureTypes,
    Object.keys(acceptedKphPolicies),
    "Golden KPH policies differ from the accepted TPCN/TPTS policy set.",
  );

  for (const fixture of cases) {
    const acceptedPolicy = acceptedKphPolicies[fixture.type];
    assert.ok(acceptedPolicy, `${fixture.id} uses unsupported KPH type ${fixture.type}.`);
    assert.ok(fixture.conditions.includes(fixture.defaultCondition), `${fixture.id} has an invalid defaultCondition.`);
    assert.ok(fixture.resolutions.includes(fixture.defaultResolution), `${fixture.id} has an invalid defaultResolution.`);
    assert.equal(new Set(fixture.conditions).size, fixture.conditions.length, `${fixture.id} repeats a condition.`);
    assert.equal(new Set(fixture.resolutions).size, fixture.resolutions.length, `${fixture.id} repeats a resolution.`);
    assert.deepEqual(
      fixture.conditions,
      acceptedPolicy.conditions,
      `${fixture.id} conditions differ from the accepted ${fixture.type} policy.`,
    );
    assert.equal(
      fixture.defaultCondition,
      acceptedPolicy.defaultCondition,
      `${fixture.id} defaultCondition differs from the accepted ${fixture.type} policy.`,
    );
    assert.deepEqual(
      fixture.resolutions,
      acceptedPolicy.resolutions,
      `${fixture.id} resolutions differ from the accepted ${fixture.type} policy.`,
    );
    assert.equal(
      fixture.defaultResolution,
      acceptedPolicy.defaultResolution,
      `${fixture.id} defaultResolution differs from the accepted ${fixture.type} policy.`,
    );
  }

  assertSameValues(
    cases.map((fixture) => fixture.type),
    enumValues(openApi, "KphType"),
    "Golden KPH types differ from OpenAPI KphType.",
  );
  assertSameValues(
    cases.flatMap((fixture) => fixture.conditions),
    enumValues(openApi, "KphCondition"),
    "Golden KPH conditions differ from OpenAPI KphCondition.",
  );
  assertSameValues(
    cases.flatMap((fixture) => fixture.resolutions),
    enumValues(openApi, "KphResolution"),
    "Golden KPH resolutions differ from OpenAPI KphResolution.",
  );
  assertExactSet(
    enumValues(openApi, "KphLookupStatus"),
    acceptedKphLookupStatuses,
    "OpenAPI KphLookupStatus differs from the locked public contract.",
  );
}

function assertProvisioningCase(casesById, caseId, decision, reason) {
  const fixtureCase = casesById.get(caseId);
  assert.ok(fixtureCase, `Missing required provisioning policy case ${caseId}.`);
  assert.equal(fixtureCase.expected.decision, decision, `${caseId} decision changed.`);
  assert.equal(fixtureCase.expected.reason, reason, `${caseId} reason changed.`);
}

function assertNoSensitiveFixtureKeys(value, location = "fixture") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveFixtureKeys(entry, `${location}[${index}]`));
    return;
  }
  if (value === null || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(
      key,
      /(password|secret|hash|token|session)/i,
      `${location}.${key} must not model or contain credential material.`,
    );
    assertNoSensitiveFixtureKeys(child, `${location}.${key}`);
  }
}

async function validateProvisioningPolicyCases() {
  const fixture = await readJson(provisioningPolicyFixturePath);
  assert.equal(fixture.provenance, "synthetic", "Provisioning fixture must remain synthetic.");
  assert.equal(fixture.approvalStatus, "accepted", "P01 fixture must reflect owner acceptance.");
  assert.equal(fixture.policyVersion, 2, "Unexpected provisioning policy fixture version.");
  assert.equal(
    fixture.conventions?.listedGrantsAreActive,
    true,
    "Listed fixture grants must explicitly represent active grants.",
  );
  assert.equal(
    fixture.conventions?.storeRegionSource,
    "SERVER_AUTHORITY",
    "Store-to-region scope must be resolved by the server.",
  );
  assert.ok(Array.isArray(fixture.cases) && fixture.cases.length > 0, "Provisioning cases must not be empty.");
  assertNoSensitiveFixtureKeys(fixture);

  const caseIds = fixture.cases.map((fixtureCase) => fixtureCase.caseId);
  assert.equal(new Set(caseIds).size, caseIds.length, "Provisioning case IDs must be unique.");
  const casesById = new Map(fixture.cases.map((fixtureCase) => [fixtureCase.caseId, fixtureCase]));

  for (const fixtureCase of fixture.cases) {
    assert.match(fixtureCase.caseId, /^ID-P01-\d{3}$/, "Provisioning case ID must use ID-P01-NNN.");
    assert.ok(["ALLOW", "DENY"].includes(fixtureCase.expected?.decision), `${fixtureCase.caseId} has invalid decision.`);
    assert.equal(typeof fixtureCase.expected?.reason, "string", `${fixtureCase.caseId} must state a reason.`);
    assert.ok(Array.isArray(fixtureCase.expected?.effects), `${fixtureCase.caseId} effects must be an array.`);
  }

  assertProvisioningCase(casesById, "ID-P01-001", "ALLOW", "CHAIN_ADMIN_PROVISIONS_IDENTITY");
  assertProvisioningCase(casesById, "ID-P01-002", "DENY", "IDENTITY_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-003", "DENY", "IDENTITY_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-004", "ALLOW", "CHAIN_WIDE_ADMIN");
  assertProvisioningCase(casesById, "ID-P01-005", "ALLOW", "REGION_SCOPED_MANAGER");
  assertProvisioningCase(casesById, "ID-P01-006", "DENY", "SELF_LOCKOUT_FORBIDDEN");
  assertProvisioningCase(casesById, "ID-P01-007", "DENY", "LAST_ACTIVE_CHAIN_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-009", "DENY", "LAST_ACTIVE_CHAIN_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-010", "DENY", "LAST_ACTIVE_STORE_MANAGER_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-012", "DENY", "ACTIVE_STORE_MANAGER_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-013", "ALLOW", "ADMIN_RESETS_OTHER_USER");
  assertProvisioningCase(casesById, "ID-P01-014", "DENY", "USE_SELF_CHANGE");
  assertProvisioningCase(casesById, "ID-P01-016", "ALLOW", "FIRST_ADMIN_ONLY");
  assertProvisioningCase(casesById, "ID-P01-017", "DENY", "BOOTSTRAP_ALREADY_CONSUMED");
  assertProvisioningCase(casesById, "ID-P01-018", "ALLOW", "NO_ACTIVE_ADMIN");
  assertProvisioningCase(casesById, "ID-P01-019", "DENY", "ACTIVE_ADMIN_EXISTS");
  assertProvisioningCase(casesById, "ID-P01-020", "DENY", "SOFT_LIFECYCLE_ONLY");
  assertProvisioningCase(casesById, "ID-P01-021", "DENY", "IDENTITY_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-022", "DENY", "SOFT_LIFECYCLE_ONLY");
  assertProvisioningCase(casesById, "ID-P01-023", "DENY", "SOFT_LIFECYCLE_ONLY");
  assertProvisioningCase(casesById, "ID-P01-024", "DENY", "LAST_ACTIVE_STORE_MANAGER_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-025", "DENY", "LAST_ACTIVE_STORE_MANAGER_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-026", "DENY", "ACTIVE_REGION_ASSIGNMENT_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-027", "ALLOW", "STORE_SCOPED_MANAGER");
  assertProvisioningCase(casesById, "ID-P01-028", "DENY", "ACTIVE_STORE_MANAGER_MEMBERSHIP_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-029", "ALLOW", "REGION_SCOPED_MEMBERSHIP_ADMIN");
  assertProvisioningCase(casesById, "ID-P01-030", "DENY", "ACTIVE_REGION_ASSIGNMENT_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-031", "DENY", "CHAIN_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-032", "ALLOW", "CHAIN_ADMIN_MANAGES_REGION_SCOPE");
  assertProvisioningCase(casesById, "ID-P01-033", "DENY", "IDENTITY_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-034", "DENY", "CHAIN_ADMIN_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-035", "DENY", "ACTIVE_REGION_REQUIRED");
  assertProvisioningCase(casesById, "ID-P01-036", "ALLOW", "CHAIN_WIDE_ADMIN");

  assert.deepEqual(
    casesById.get("ID-P01-004").actor.globalRoles,
    ["CHAIN_ADMIN"],
    "Chain-wide KPH access must explicitly exercise CHAIN_ADMIN.",
  );
  assert.deepEqual(
    casesById.get("ID-P01-005").actor.regionAssignments,
    ["REGION-SOUTH"],
    "Regional KPH approval must require an explicit region assignment.",
  );
  assert.equal(
    casesById.get("ID-P01-005").context.storeRegion,
    "REGION-SOUTH",
    "Regional allow case must resolve a store inside the assigned region.",
  );
  assert.equal(
    casesById.get("ID-P01-026").context.storeRegion,
    "REGION-NORTH",
    "Regional deny case must exercise a valid store outside the assigned region.",
  );
  assert.deepEqual(
    casesById.get("ID-P01-027").actor.memberships,
    [{ store: "STORE-001", role: "STORE_MANAGER" }],
    "Store-scoped KPH export must require an explicit store manager membership.",
  );
  assert.ok(
    casesById.get("ID-P01-013").expected.effects.includes("INVALIDATE_EXISTING_ACCESS"),
    "Admin credential reset must invalidate existing access.",
  );
}

async function main() {
  await validateOpenApiStructure();
  const manifest = await validateManifestAndJsonSyntax();
  const openApi = yaml.load(await readFile(contractPath, "utf8"));
  assert.equal(openApi.openapi, "3.1.0", "Contract Lock requires OpenAPI 3.1.0.");
  await validateApiFixtures(openApi);
  await validateGoldenKphEnums(openApi);
  await validateProvisioningPolicyCases();
  console.log(
    `Contract Lock passed: ${manifest.fixtures.length} manifest resources, ${apiFixtureSchemas.size} API fixtures.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
