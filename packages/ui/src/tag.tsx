import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export type TagTone = "orange" | "green" | "red" | "blue" | "gray";

const tagVariants = cva(
  "inline-flex items-center justify-center font-extrabold tracking-normal whitespace-nowrap rounded-full border transition-colors",
  {
    variants: {
      tone: {
        orange: "border-amber-400/50 bg-[#ffedd5] text-[#8a4a00]",
        green: "border-brand/35 bg-[#d5f2e0] text-brand",
        red: "border-danger/35 bg-[#fee2e2] text-danger",
        blue: "border-blue-400/45 bg-[#dbeafe] text-[#1769aa]",
        gray: "border-border bg-[#e2e8e3] text-ink-muted",
      },
      size: {
        sm: "min-h-[1.5rem] px-2 py-0.5 text-[0.6875rem] leading-none",
        md: "min-h-[1.75rem] px-2.5 py-1 text-xs leading-none",
      },
    },
    defaultVariants: {
      tone: "gray",
      size: "md",
    },
  },
);

export type TagProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tagVariants> & {
    asChild?: boolean;
  };

export function Tag({ asChild, className, size, tone, ...props }: TagProps) {
  const Component = asChild ? Slot : "span";
  return <Component className={cn(tagVariants({ className, size, tone }))} {...props} />;
}
