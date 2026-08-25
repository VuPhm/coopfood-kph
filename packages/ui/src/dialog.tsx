import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "./cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ children, className, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Close asChild>
        <DialogPrimitive.Overlay data-slot="dialog-overlay" className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-[3px]" />
      </DialogPrimitive.Close>
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 gap-6 overflow-y-auto overscroll-contain rounded-3xl border border-surface-strong bg-white p-5 shadow-2xl focus:outline-none sm:p-6",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Close data-slot="dialog-close" className="dialog-close-hit-area group absolute right-0 top-0 grid size-11 place-items-center rounded-xl bg-transparent text-ink-muted outline-none" aria-label="Đóng">
          <span className="dialog-close-visual grid size-7 place-items-center rounded-lg transition-colors group-hover:bg-surface-strong group-hover:text-ink" aria-hidden="true">
            <X size={16} />
          </span>
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-2 pr-12", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-xl font-black text-ink", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm leading-6 text-ink-muted", className)} {...props} />;
}
