import { useSyncExternalStore } from "react";

const query = "(min-width: 900px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(query);
  if (!media) return () => {};
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getSnapshot() { return window.matchMedia?.(query).matches ?? window.innerWidth >= 900; }

export function useStoreDesktopLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
