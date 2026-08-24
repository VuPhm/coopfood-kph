import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-[background-color,color,transform,box-shadow] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-active",
        secondary: "border-2 border-brand/20 bg-brand-soft text-brand hover:border-brand/35 hover:bg-brand/15 active:bg-brand/20",
        danger: "bg-danger text-white hover:bg-red-700",
        ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink active:bg-surface-strong",
      },
      size: {
        default: "h-11",
        icon: "size-11 shrink-0 p-0",
        large: "min-h-13 px-5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ asChild, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}
