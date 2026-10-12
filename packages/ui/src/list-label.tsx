import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";
import { Tag, type TagTone } from "./tag";
import "./list-label.css";

export type ListLabelTone = "neutral" | "info" | "process" | "warning" | "danger" | "success";
export type ListLabelProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ListLabelTone;
  icon?: ReactNode;
  category?: string;
};

const tagTones: Record<ListLabelTone, TagTone> = {
  neutral: "gray", info: "blue", process: "blue", warning: "orange", danger: "red", success: "green",
};

/** Read-only label. The consumer owns the meaning; color always accompanies text. */
export function ListLabel({ children, className, icon, category, tone = "neutral", ...props }: ListLabelProps) {
  return <Tag {...props} tone={tagTones[tone]} className={cn("ui-label-palette", "ui-list-label", className)} data-tone={tone}>
    {category ? <span className="ui-list-label-category">{category}: </span> : null}
    {icon ? <span className="ui-list-label-icon" aria-hidden="true">{icon}</span> : null}
    <span className="ui-list-label-text">{children}</span>
  </Tag>;
}
