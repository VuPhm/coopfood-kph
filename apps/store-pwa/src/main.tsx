import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";
import { App } from "./app";
import { StoreApp } from "./store-app";

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
    {import.meta.env.VITE_STORE_APP_MOCK === "true" ? <StoreApp /> : (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    )}
  </StrictMode>,
);
