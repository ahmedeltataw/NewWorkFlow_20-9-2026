/**
 * T021 MSW browser worker.
 *
 * Built only for browser bundles; never import this module from node or from
 * a test. The worker registers the same handlers the node server uses, so
 * development preview behaviour matches the test harness behaviour.
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
