import { Dialog, DialogContent, DialogTitle } from "@coopfood-kph/ui";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type SyntheticEvent } from "react";

export type ViewableEvidenceImage = { src: string; alt: string };

type LensState = CSSProperties & { visible: boolean; size: number };

const hiddenLens: LensState = { visible: false, size: 0 };
const VIEWER_MAX_WIDTH_REM = 72;
const VIEWER_MAX_HEIGHT_REM = 54;
const VIEWER_VIEWPORT_WIDTH_RATIO = 0.94;
const VIEWER_VIEWPORT_HEIGHT_RATIO = 0.9;

export function EvidenceImageViewer({ image, onOpenChange, open }: { image: ViewableEvidenceImage | null; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [lens, setLens] = useState<LensState>(hiddenLens);
  const [frame, setFrame] = useState<{ height: number; width: number } | null>(null);
  const naturalSize = useRef<{ height: number; width: number } | null>(null);

  function hideLens() {
    setLens(hiddenLens);
  }

  function fitFrame(width: number, height: number) {
    const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    const maxWidth = Math.min(window.innerWidth * VIEWER_VIEWPORT_WIDTH_RATIO, rootFontSize * VIEWER_MAX_WIDTH_REM);
    const maxHeight = Math.min(window.innerHeight * VIEWER_VIEWPORT_HEIGHT_RATIO, rootFontSize * VIEWER_MAX_HEIGHT_REM);
    const scale = Math.min(maxWidth / width, maxHeight / height);
    setFrame({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }

  function imageLoaded(event: SyntheticEvent<HTMLImageElement>) {
    hideLens();
    naturalSize.current = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
    fitFrame(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight);
  }

  useEffect(() => {
    if (!open) return;
    function resizeViewer() {
      if (naturalSize.current) fitFrame(naturalSize.current.width, naturalSize.current.height);
    }
    window.addEventListener("resize", resizeViewer);
    return () => window.removeEventListener("resize", resizeViewer);
  }, [open]);

  useEffect(() => {
    naturalSize.current = null;
    setFrame(null);
  }, [image?.src]);

  function updateLens(event: PointerEvent<HTMLImageElement>, touch: boolean) {
    if (!image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = touch ? Math.min(180, window.innerWidth - 24) : 240;
    const zoom = touch ? 2.75 : 2.5;
    const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
    const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
    const preferredTop = touch ? event.clientY - size - 28 : event.clientY - size / 2;
    const top = Math.min(window.innerHeight - size - 12, Math.max(12, preferredTop < 12 ? event.clientY + 28 : preferredTop));
    const left = Math.min(window.innerWidth - size - 12, Math.max(12, touch ? event.clientX - size / 2 : event.clientX + 20));
    setLens({
      visible: true,
      size,
      width: size,
      height: size,
      left,
      top,
      backgroundImage: `url("${image.src}")`,
      backgroundPosition: `${size / 2 - x * zoom}px ${size / 2 - y * zoom}px`,
      backgroundSize: `${rect.width * zoom}px ${rect.height * zoom}px`,
    });
  }

  function pointerMove(event: PointerEvent<HTMLImageElement>) {
    const touch = Boolean(event.pointerType && event.pointerType !== "mouse");
    if (touch && event.currentTarget.hasPointerCapture?.(event.pointerId) === false) return;
    if (!touch && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches === false) return;
    updateLens(event, touch);
  }

  function pointerDown(event: PointerEvent<HTMLImageElement>) {
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateLens(event, true);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { hideLens(); onOpenChange(next); }}>
      <DialogContent className="evidence-viewer-content" style={frame ?? undefined} onPointerDownOutside={hideLens}>
        <DialogTitle className="sr-only">Xem ảnh minh chứng</DialogTitle>
        {image ? (
          <figure className="evidence-viewer-stage">
            <img
              className="evidence-viewer-image"
              src={image.src}
              alt={image.alt}
              draggable={false}
              onLoad={imageLoaded}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerLeave={hideLens}
              onPointerUp={hideLens}
              onPointerCancel={hideLens}
              onLostPointerCapture={hideLens}
            />
          </figure>
        ) : null}
      </DialogContent>
      <div className={lens.visible ? "evidence-zoom-lens is-visible" : "evidence-zoom-lens"} style={lens} aria-hidden="true" />
    </Dialog>
  );
}
