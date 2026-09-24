import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { ClientStoreDemo } from "./demo/client-store-demo";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

document.addEventListener("keydown", (event) => {
  if (!event.altKey && !event.ctrlKey && !event.metaKey) {
    document.documentElement.dataset.focusModality = "keyboard";
  }
}, true);
document.addEventListener("pointerdown", () => {
  delete document.documentElement.dataset.focusModality;
}, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {import.meta.env.VITE_CLIENT_STORE_DEMO === "true" && import.meta.env.VITE_KPH_ONLINE === "true"
        ? <ClientStoreDemo><App /></ClientStoreDemo>
        : <App />}
    </QueryClientProvider>
  </StrictMode>,
);
