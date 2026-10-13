import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PinGate } from "./pin-gate";
import { PwaStatus } from "./pwa-status";
import { WorkspaceLoader } from "./workspace-loader";
import "./styles.css";

document.addEventListener("keydown", (event) => {
  if (!event.altKey && !event.ctrlKey && !event.metaKey && document.documentElement.dataset.focusModality !== "keyboard") {
    document.documentElement.dataset.focusModality = "keyboard";
  }
}, true);
document.addEventListener("pointerdown", () => {
  if (document.documentElement.dataset.focusModality !== undefined) {
    delete document.documentElement.dataset.focusModality;
  }
}, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PwaStatus />
    <PinGate><WorkspaceLoader /></PinGate>
  </StrictMode>,
);
