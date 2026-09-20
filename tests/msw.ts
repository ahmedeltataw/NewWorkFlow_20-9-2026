import type { HttpHandler } from "msw";
import { afterAll, afterEach, beforeAll } from "vitest";

import { resetMockState } from "../src/mocks/handlers";
import { closeServer, listenServer, server } from "../src/mocks/server";

/**
 * Global MSW lifecycle for every vitest file.
 *
 * The server instance and its handler list are owned by
 * `src/mocks/server.ts` — NOT by this module. This module only wires that
 * single instance into vitest, so at most one `setupServer` interceptor is
 * ever active in the process.
 *
 * - `beforeAll` starts the server treating unhandled requests as failures.
 * - `afterEach` restores the T021 default handler list (`resetHandlers`
 *   reverts to the handlers baked into the server at creation) and resets
 *   the mock scenario state so one test's scenario/role/delay cannot leak
 *   into the next.
 * - `afterAll` closes the server.
 *
 * Starting the lifecycle twice in one file is a no-op: `listenServer`
 * guards against double-listen, so the second call is ignored.
 */
export function installMswLifecycle() {
  beforeAll(() => {
    listenServer();
  });

  afterEach(() => {
    server.resetHandlers();
    resetMockState();
  });

  afterAll(() => {
    closeServer();
  });
}

export function addMswHandlers(...handlers: HttpHandler[]) {
  server.use(...handlers);
}

export { server };
