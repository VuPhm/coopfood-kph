import { cn } from "./cn";
import type { ListLabelTone } from "./list-label";
import "./list-label.css";

/** Decorative summary cue. Always pair with a visible text label for its meaning. */
export function ListItemMarker({ tone = "neutral", variant = "dot", className }: { tone?: ListLabelTone; variant?: "dot" | "bar"; className?: string }) {
  return <span className={cn("ui-label-palette", "ui-list-item-marker", className)} data-tone={tone} data-variant={variant} aria-hidden="true" />;
}
