import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginRequired } from "../../src/features/auth/LoginRequired";
import { useLoginIntentRestoration } from "../../src/features/auth/PhoneSignInEntry";
import { LocaleProvider } from "../../src/lib/i18n/locale-provider";
import {
  captureLoginIntent,
  restoreLoginIntent,
} from "../../src/lib/i18n/intent";

const storage = new Map<string, string>();
const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function SignInCompletion() {
  const restoreAfterSignIn = useLoginIntentRestoration();
  return <button onClick={restoreAfterSignIn}>Complete sign-in</button>;
}

beforeEach(() => {
  storage.clear();
  push.mockClear();
  replace.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
  });
});

describe("LoginRequired intent flow", () => {
  it("captures the favorite intent before navigating to the phone entry", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="en">
        <LoginRequired
          open
          onOpenChange={vi.fn()}
          intent={{ intent: "favorite", returnTo: "/auctions?status=live" }}
        />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(push).toHaveBeenCalledWith("/auth/phone");
    expect(restoreLoginIntent()).toEqual({
      intent: "favorite",
      returnTo: "/auctions?status=live",
    });
  });

  it("captures an API gate envelope and restores it only once", () => {
    captureLoginIntent({
      intent: "favorite",
      returnTo: "/auctions?status=live",
    });

    expect(restoreLoginIntent()).toEqual({
      intent: "favorite",
      returnTo: "/auctions?status=live",
    });
    expect(restoreLoginIntent()).toBeNull();
  });

  it("returns to the preserved destination only for the first completion", async () => {
    const user = userEvent.setup();
    captureLoginIntent({ intent: "favorite", returnTo: "/auctions/live-1" });
    render(<SignInCompletion />);

    await user.click(screen.getByRole("button", { name: "Complete sign-in" }));
    await user.click(screen.getByRole("button", { name: "Complete sign-in" }));

    expect(replace).toHaveBeenNthCalledWith(1, "/auctions/live-1");
    expect(replace).toHaveBeenNthCalledWith(2, "/");
  });

  it("ignores a stale or malformed stored value", () => {
    storage.set(
      "auction_login_intent",
      '{"intent":"favorite","returnTo":"https://other.example"}',
    );

    expect(restoreLoginIntent()).toBeNull();
  });
});
