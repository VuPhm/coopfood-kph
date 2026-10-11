import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DismissableLayerBranch } from "@radix-ui/react-dismissable-layer";
import { useRef, type ComponentProps } from "react";

import { cn } from "./cn";
import { CloseButton, type CloseButtonProps } from "./close-button";
import "./dialog.css";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export { DismissableLayerBranch };

export function DialogContent({ children, className, closeTone, closeLabel = "Đóng", onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { closeTone?: CloseButtonProps["tone"]; closeLabel?: string }) {
  const openedFrom = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay data-slot="dialog-overlay" className="fixed inset-0 z-50" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] transform-[translate(-50%,-50%)] gap-4 overflow-y-auto overscroll-contain rounded-3xl border border-surface-strong bg-white p-6 focus:outline-none",
          className,
        )}
        {...props}
        onOpenAutoFocus={event => {
          openedFrom.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={event => {
          onCloseAutoFocus?.(event);
          // Controlled dialogs often open from ordinary buttons without a Radix Trigger.
          if (!event.defaultPrevented && openedFrom.current?.isConnected) {
            event.preventDefault();
            // Preserve a caller's explicit focus move (for example after a successful scan).
            if (document.activeElement === document.body) openedFrom.current.focus();
          }
        }}
      >
        <DialogPrimitive.Close asChild>
          <CloseButton data-slot="dialog-close" aria-label={closeLabel} className="dialog-close-hit-area absolute right-3 top-3" tone={closeTone ?? "inverse"} />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("grid gap-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-base font-semibold text-ink", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm leading-6 text-ink-muted", className)} {...props} />;
}
