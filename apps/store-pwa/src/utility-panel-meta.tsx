import { CloseButton, DialogClose, cn } from "@coopfood-kph/ui";
import type { ReactNode } from "react";

type UtilityPanelMetaProps = {
  actionClassName?: string;
  actionControls?: string;
  actionExpanded?: boolean;
  actionIcon?: ReactNode;
  actionLabel: string;
  actionText?: string | undefined;
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
  actionText,
  className,
  dialogClose = false,
  label,
  onAction,
}: UtilityPanelMetaProps) {
  const action = !actionIcon && !actionText ? <CloseButton
    className={actionClassName}
    aria-controls={actionControls}
    aria-expanded={actionExpanded}
    aria-label={actionLabel}
    title={actionLabel}
    onClick={onAction}
  /> : (
    <button
      type="button"
      className={cn("utility-panel-action", actionClassName)}
      aria-controls={actionControls}
      aria-expanded={actionExpanded}
      aria-label={actionLabel}
      title={actionLabel}
      onClick={onAction}
    >
      <span className="utility-panel-action-visual" aria-hidden="true">{actionIcon}</span>
      {actionText ? <span className="utility-panel-action-text" aria-hidden="true">{actionText}</span> : null}
    </button>
  );

  return (
    <div className={cn("utility-panel-meta", className)}>
      {label ? <p>{label}</p> : null}
      {dialogClose ? <DialogClose asChild>{action}</DialogClose> : action}
    </div>
  );
}
