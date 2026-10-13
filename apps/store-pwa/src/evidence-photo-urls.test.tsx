import { cleanup, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { DemoPhoto } from "./demo-records";
import { useEvidencePhotoUrls } from "./evidence-photo-urls";

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
beforeEach(() => {
  let sequence = 0;
  URL.createObjectURL = vi.fn(() => `blob:test-${sequence++}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });

function Gallery({ photos }: { photos: readonly DemoPhoto[] }) {
  const resolved = useEvidencePhotoUrls(photos);
  return <>{resolved.map((photo) => <img key={photo.id} src={photo.src || undefined} alt={photo.alt} />)}</>;
}
const photo = (blob: Blob): DemoPhoto => ({ id: "same-id", src: "", alt: "Ảnh thử", blob });

it("replaces a photo URL when its bytes change and never revokes static assets", () => {
  const firstBlob = new Blob(["first"]);
  const secondBlob = new Blob(["second"]);
  const first = [photo(firstBlob), { id: "static", src: "/demo/static.svg", alt: "Ảnh demo" }];
  const view = render(<Gallery photos={first} />);
  expect(screen.getByAltText("Ảnh thử")).toHaveAttribute("src", "blob:test-0");
  view.rerender(<Gallery photos={first} />);
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  view.rerender(<Gallery photos={[photo(secondBlob), first[1]!]} />);
  expect(screen.getByAltText("Ảnh thử")).toHaveAttribute("src", "blob:test-1");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-0");
  view.unmount();
  expect(URL.createObjectURL).toHaveBeenNthCalledWith(2, secondBlob);
  expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([["blob:test-0"], ["blob:test-1"]]);
});

it("balances resource ownership under StrictMode effect replay", () => {
  const view = render(<StrictMode><Gallery photos={[photo(new Blob(["test"]))]} /></StrictMode>);
  const created = vi.mocked(URL.createObjectURL).mock.results.map((result) => result.value as string);
  expect(screen.getByAltText("Ảnh thử")).toHaveAttribute("src", created.at(-1));
  view.unmount();
  expect(vi.mocked(URL.revokeObjectURL).mock.calls.map(([url]) => url).sort()).toEqual(created.sort());
});
