import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./app";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

export default function Workspace() {
  return <QueryClientProvider client={queryClient}><App /></QueryClientProvider>;
}
