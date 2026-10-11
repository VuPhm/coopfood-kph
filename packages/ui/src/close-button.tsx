import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "./cn";

export type CloseButtonProps = Omit<ComponentProps<"button">, "children"> & {
  tone?: "neutral" | "inverse";
};

/** A compact visual with a full touch target, shared by modal and inline dismissals. */
export function CloseButton({ className, tone = "neutral", "aria-label": label = "Đóng", type = "button", ...props }: CloseButtonProps) {
  return <button
    type={type}
    aria-label={label}
    data-close-tone={tone}
    className={cn("ui-close-button group grid size-11 shrink-0 place-items-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45", className)}
    {...props}
  >
    <span aria-hidden="true" className={cn(
      "dialog-close-visual grid size-9 place-items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none",
      tone === "inverse"
        ? "border-white/25 bg-black/10 text-white group-hover:bg-black/15 group-active:bg-black/20"
        : "border-brand/10 bg-brand-soft text-brand group-hover:bg-brand/15 group-active:bg-brand/20",
    )}><X size={20} strokeWidth={1.8} className="stroke-[1.8]" /></span>
  </button>;
}
