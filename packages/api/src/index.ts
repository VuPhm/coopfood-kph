import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./generated/schema";

export type { components, operations, paths } from "./generated/schema";

export type KphApiClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  getCsrfToken?: () => string | undefined;
};

export function createKphApiClient(options: KphApiClientOptions = {}) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? "",
    credentials: "include",
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });

  const csrf: Middleware = {
    onRequest({ request }) {
      const token = options.getCsrfToken?.();
      if (token && request.method !== "GET" && request.method !== "HEAD") {
        request.headers.set("X-CSRF-TOKEN", token);
      }
      return request;
    },
  };

  client.use(csrf);
  return client;
}
