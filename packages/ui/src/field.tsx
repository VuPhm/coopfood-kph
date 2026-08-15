import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type FieldProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
};

export function Field({ className, error, hint, htmlFor, label, required, children, ...props }: FieldProps) {
  const description = error ?? hint;
  return (
    <div className={cn("grid gap-1.5", className)} {...props}>
      <label className="text-sm font-bold text-ink" htmlFor={htmlFor}>
        {label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {description ? (
        <p className={cn("text-xs text-ink-muted", error && "font-semibold text-danger")} role={error ? "alert" : undefined}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
