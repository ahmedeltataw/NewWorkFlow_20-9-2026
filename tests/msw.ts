import type { HttpHandler } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

const server = setupServer();

export function installMswLifecycle() {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
}

export function addMswHandlers(...handlers: HttpHandler[]) {
  server.use(...handlers);
}

export { server };
