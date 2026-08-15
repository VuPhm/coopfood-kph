import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "AGENTS.md",
  "docs/CURRENT_STATE.md",
  "docs/NEXT.md",
  "docs/ENGINEERING_PRINCIPLES.md",
  "docs/product/DOMAIN_RULES.md",
  "contracts/openapi/kph.openapi.yaml",
];

const failures = [];
for (const path of required) {
  if (!existsSync(join(root, path))) failures.push(`Thiếu file bắt buộc: ${path}`);
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

for (const path of filesUnder(join(root, "contracts", "fixtures"))) {
  if (extname(path) !== ".json") continue;
  try {
    JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${relative(root, path)}: JSON không hợp lệ (${error.message})`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Docs/fixtures foundation hợp lệ.");
