import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "./cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border-2 border-surface-strong bg-white px-3 text-base text-ink outline-none transition-[background-color,border-color,box-shadow] placeholder:text-ink-muted/70 hover:border-brand/25 hover:bg-brand-soft/40 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-focus aria-invalid:border-danger/45 aria-invalid:bg-danger-soft aria-invalid:ring-3 aria-invalid:ring-danger/30 disabled:bg-ink/5 disabled:text-ink-muted",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
