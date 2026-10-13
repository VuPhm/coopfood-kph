import { beforeEach, expect, it } from "vitest";

import { DEMO_RECORDS } from "./demo-records";
import { loadPilotRecords, resetPilotDatabaseForTests, savePilotRecord } from "./record-store";

beforeEach(async () => resetPilotDatabaseForTests());

it("round-trips image bytes with FileReader when Blob.arrayBuffer is unavailable", async () => {
  const blob = new Blob([new Uint8Array([0, 255, 42])], { type: "image/jpeg" });
  expect(typeof blob.arrayBuffer).toBe("undefined"); // jsdom exercises the older browser path.
  await savePilotRecord({
    ...DEMO_RECORDS[0]!,
    photos: [{ id: "photo-test", src: "blob:test", alt: "Ảnh thử", fileName: "test.jpg", blob }],
  });
  const [loaded] = await loadPilotRecords();
  const restored = loaded!.photos[0]!.blob;
  expect(restored.type).toBe("image/jpeg");
  const reader = new FileReader();
  const bytes = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
  });
  reader.readAsArrayBuffer(restored);
  expect(new Uint8Array(await bytes)).toEqual(new Uint8Array([0, 255, 42]));
});
