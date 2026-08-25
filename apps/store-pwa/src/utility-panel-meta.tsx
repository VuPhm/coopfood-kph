import { DialogClose, cn } from "@coopfood-kph/ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type UtilityPanelMetaProps = {
  actionClassName?: string;
  actionControls?: string;
  actionExpanded?: boolean;
  actionIcon?: ReactNode;
  actionLabel: string;
  className?: string;
  dialogClose?: boolean;
  label?: string;
  onAction?: () => void;
};

export function UtilityPanelMeta({
  actionClassName,
  actionControls,
  actionExpanded,
  actionIcon,
  actionLabel,
  className,
  dialogClose = false,
  label,
  onAction,
}: UtilityPanelMetaProps) {
  const action = (
    <button
      type="button"
      className={cn("utility-panel-action", actionClassName)}
      aria-controls={actionControls}
      aria-expanded={actionExpanded}
      aria-label={actionLabel}
      title={actionLabel}
      onClick={onAction}
    >
      <span className="utility-panel-action-visual" aria-hidden="true">{actionIcon ?? <X />}</span>
    </button>
  );

  return (
    <div className={cn("utility-panel-meta", className)}>
      {label ? <p>{label}</p> : null}
      {dialogClose ? <DialogClose asChild>{action}</DialogClose> : action}
    </div>
  );
}
