/**
 * Client-only MSW startup shared by the application shell and API requests.
 *
 * Startup is browser-only. Development enables mocking by default; a public
 * build flag enables it for production builds used by browser tests. The shared
 * promise makes early requests wait for interception.
 */
let workerStart: Promise<void> | undefined;
let startupErrorLogged = false;

export function startBrowserMockWorker(): Promise<void> {
  if (
    typeof window === "undefined" ||
    (process.env.NODE_ENV !== "development" &&
      process.env.NEXT_PUBLIC_API_MOCKING !== "enabled")
  ) {
    return Promise.resolve();
  }

  workerStart ??= import("./browser")
    .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
    .then(() => {
      document.documentElement.dataset.mswReady = "true";
    })
    .catch((error: unknown) => {
      workerStart = undefined;
      if (!startupErrorLogged) {
        startupErrorLogged = true;
        console.error("Mock service worker failed to start", error);
      }
      throw error;
    });

  return workerStart;
}
