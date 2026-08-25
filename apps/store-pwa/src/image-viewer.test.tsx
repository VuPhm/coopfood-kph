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
});
