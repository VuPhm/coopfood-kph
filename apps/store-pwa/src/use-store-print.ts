import { useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  const media = window.matchMedia?.("print");
  media?.addEventListener?.("change", notify);
  return () => media?.removeEventListener?.("change", notify);
};

// Print is an output medium, not a user-selectable screen layout.
export function useStorePrint() {
  return useSyncExternalStore(subscribe, () => window.matchMedia?.("print")?.matches ?? false, () => false);
}
