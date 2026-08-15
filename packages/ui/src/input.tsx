import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "./cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[10px] border border-line bg-white px-3 text-base text-ink outline-none placeholder:text-ink-muted/70 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-lime-300/70 disabled:bg-black/5",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
