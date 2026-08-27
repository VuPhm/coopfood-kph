import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvidenceImageViewer } from "./image-viewer";

describe("evidence image viewer", () => {
  it("requests close from Escape and an outside click", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<EvidenceImageViewer image={{ src: "/demo/evidence-cookie-front.svg", alt: "Ảnh kiểm tra" }} open onOpenChange={onOpenChange} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    rerender(<EvidenceImageViewer image={{ src: "/demo/evidence-cookie-front.svg", alt: "Ảnh kiểm tra" }} open onOpenChange={onOpenChange} />);
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("tracks the fine pointer with the legacy 2.5x lens and hides it on leave", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    render(<EvidenceImageViewer image={{ src: "/demo/evidence-cookie-front.svg", alt: "Ảnh kiểm tra" }} open onOpenChange={vi.fn()} />);
    const image = screen.getByAltText("Ảnh kiểm tra");
    vi.spyOn(image, "getBoundingClientRect").mockReturnValue({
      bottom: 450, height: 400, left: 100, right: 700, top: 50, width: 600, x: 100, y: 50, toJSON: () => undefined,
    });

    fireEvent.pointerMove(image, { clientX: 400, clientY: 250, pointerId: 1, pointerType: "mouse" });
    const lens = document.querySelector(".evidence-zoom-lens");
    expect(lens).toHaveClass("is-visible");
    expect(lens).toHaveStyle({ backgroundSize: "1500px 1000px" });

    fireEvent.pointerLeave(image);
    expect(lens).not.toHaveClass("is-visible");
  });

  it("shows only the evidence without an extra surface or operation note", () => {
    render(<EvidenceImageViewer image={{ src: "/demo/evidence-cookie-front.svg", alt: "Ảnh kiểm tra" }} open onOpenChange={vi.fn()} />);

    expect(screen.getByAltText("Ảnh kiểm tra")).toBeVisible();
    expect(screen.queryByText(/Rê chuột|chạm giữ|soi 2\.5/i)).not.toBeInTheDocument();
    expect(document.querySelector(".evidence-viewer-stage figcaption")).not.toBeInTheDocument();
  });

  it("sizes the transparent dialog frame to the evidence aspect ratio", () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    render(<EvidenceImageViewer image={{ src: "/demo/evidence-cookie-front.svg", alt: "Ảnh kiểm tra" }} open onOpenChange={vi.fn()} />);
    const image = screen.getByAltText("Ảnh kiểm tra");
    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 225 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, value: 150 });

    fireEvent.load(image);

    expect(screen.getByRole("dialog", { name: "Xem ảnh minh chứng" })).toHaveStyle({ width: "367px", height: "244px" });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: previousWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: previousHeight });
  });
});
