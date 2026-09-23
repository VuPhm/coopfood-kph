import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const mediaRoot = process.argv[2];
if (!mediaRoot) {
  throw new Error("Usage: node seed-foundation-paging-media.mjs <media-root>");
}

const target = path.join(path.resolve(mediaRoot), "foundation-paging");
const jpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYyLjI4LjEwMgD/2wBDAAgEBAQEBAUFBQUFBQYGBgYGBgYGBgYGBgYHBwcICAgHBwcGBgcHCAgICAkJCQgICAgJCQoKCgwMCwsODg4RERT/xABLAAEBAAAAAAAAAAAAAAAAAAAABwEBAAAAAAAAAAAAAAAAAAAAABABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAAgACAMBIgACEQADEQD/2gAMAwEAAhEDEQA/AL+AD//Z",
  "base64",
);

await mkdir(target, { recursive: true });
for (let ordinal = 1; ordinal <= 30; ordinal += 1) {
  await Promise.all([
    writeFile(path.join(target, `${ordinal}.original.jpg`), jpeg),
    writeFile(path.join(target, `${ordinal}.stamped.jpg`), jpeg),
  ]);
}
