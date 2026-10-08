import { useRef } from "react";

// Controlled screen dialogs have no Radix Trigger. Keep their opener locally,
// without changing the shared primitive or focus handling in legacy dialogs.
export function useDialogReturnFocus(enabled = true) {
  const opener = useRef<HTMLElement | null>(null);
  const openedRoute = useRef("");
  return {
    onOpenAutoFocus() {
      if (!enabled) return;
      openedRoute.current = window.location.hash;
      opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement : null;
    },
    onCloseAutoFocus(event: Event) {
      if (!enabled) return;
      event.preventDefault();
      const target = openedRoute.current === window.location.hash ? opener.current : null;
      const parentDialog = document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]');
      // A newly opened dialog owns focus. A nested viewer may return to its
      // parent, but must never pull focus out of another active modal.
      if (parentDialog && (!target || !parentDialog.contains(target))) return;
      let visible = !!target?.isConnected && !target.matches(':disabled') && !target.closest('[hidden], [inert]');
      for (let node = target; visible && node; node = node.parentElement) {
        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") visible = false;
      }
      if (visible) target?.focus({ preventScroll: true });
      else document.getElementById("store-content")?.focus({ preventScroll: true });
    },
  };
}
