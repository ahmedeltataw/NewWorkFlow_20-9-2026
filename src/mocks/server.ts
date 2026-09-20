/**
 * T021 MSW node server for tests and tooling.
 *
 * Importing this module never pulls in browser-only code. The default
 * listen configuration treats any unhandled request as a failure so a test
 * cannot silently fall through to the network.
 *
 * This module is the single owner of the `setupServer` instance in the
 * process. The test harness (`tests/msw.ts`) imports `server` from here
 * instead of creating its own, so there is never more than one interceptor.
 * `server.resetHandlers()` always restores the T021 default handler list
 * because those handlers are baked into the server at creation time.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

const server = setupServer(...handlers);

let listening = false;

/** Start intercepting with unhandled requests treated as test failures. */
export function listenServer(): void {
  // No-op if already listening: starting the MSW interceptor twice in one
  // process is not supported, and T022's integration tests will boot this
  // same instance that the global lifecycle already started.
  if (listening) return;
  listening = true;
  server.listen({ onUnhandledRequest: "error" });
}

/** Stop intercepting. Safe to call when the server is not listening. */
export function closeServer(): void {
  if (!listening) return;
  listening = false;
  server.close();
}

export { server };
