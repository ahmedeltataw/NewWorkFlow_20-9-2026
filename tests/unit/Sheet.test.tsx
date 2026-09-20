import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sheet } from "../../src/components/primitives/Sheet";

type SheetHarnessProps = Omit<
  ComponentProps<typeof Sheet>,
  "open" | "onOpenChange"
> & { initialOpen?: boolean };

function ControlledHarness({
  initialOpen = false,
  children,
  ...props
}: SheetHarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <Sheet {...props} open={open} onOpenChange={setOpen}>
        <button type="button" onClick={() => setOpen(false)}>
          Close sheet
        </button>
        {children}
      </Sheet>
    </>
  );
}

function TrapHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open trap
      </button>
      <Sheet title="Trap" open={open} onOpenChange={setOpen}>
        <button type="button">Alpha</button>
        <button type="button">Beta</button>
        <button type="button">Gamma</button>
      </Sheet>
    </>
  );
}

function TwoSheetHarness() {
  const [outerOpen, setOuterOpen] = useState(false);
  const [innerOpen, setInnerOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuterOpen(true)}>
        Open outer
      </button>
      <Sheet title="Outer" open={outerOpen} onOpenChange={setOuterOpen}>
        <button type="button" onClick={() => setInnerOpen(true)}>
          Open inner
        </button>
        <button type="button" onClick={() => setOuterOpen(false)}>
          Close outer
        </button>
      </Sheet>
      <Sheet title="Inner" open={innerOpen} onOpenChange={setInnerOpen}>
        <button type="button" onClick={() => setInnerOpen(false)}>
          Close inner
        </button>
      </Sheet>
    </>
  );
}

afterEach(() => {
  document.body.style.overflow = "";
});

describe("T026 Sheet", () => {
  it("renders a labelled, modal dialog", () => {
    render(
      <Sheet open title="Edit filters" description="Adjust your results">
        <p>Body</p>
      </Sheet>,
    );
    const dialog = screen.getByRole("dialog", { name: "Edit filters" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-state", "open");
    const heading = screen.getByRole("heading", { name: "Edit filters" });
    const description = screen.getByText("Adjust your results");
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(dialog.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("opens from a trigger and closes via a close trigger inside", async () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness title="Filters">
        <span>Filter body</span>
      </ControlledHarness>,
    );
    const trigger = screen.getByRole("button", { name: "Open sheet" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close sheet" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape and reports the request", async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    const onOpenChange = vi.fn();
    function SpyHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open sheet
          </button>
          <Sheet
            onEscapeKeyDown={onEscape}
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
            title="Filters"
          >
            <button type="button">Apply</button>
          </Sheet>
        </>
      );
    }
    render(<SpyHarness />);
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the sheet open on Escape when closeOnEscape is false", async () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness closeOnEscape={false} title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("keeps the sheet open when onEscapeKeyDown prevents default", async () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness
        onEscapeKeyDown={(event) => event.preventDefault()}
        title="Filters"
      >
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness overlayClassName="test-overlay" title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    const overlay = document.querySelector(".test-overlay");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the sheet open on backdrop click when closeOnBackdropClick is false", () => {
    render(
      <ControlledHarness
        closeOnBackdropClick={false}
        initialOpen
        overlayClassName="test-overlay"
        title="Filters"
      >
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    const overlay = document.querySelector(".test-overlay");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("keeps the sheet open when onBackdropClick prevents default", () => {
    render(
      <ControlledHarness
        initialOpen
        onBackdropClick={(event) => event.preventDefault()}
        overlayClassName="test-overlay"
        title="Filters"
      >
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    const overlay = document.querySelector(".test-overlay");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("does not close when clicking inside the dialog body", () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness initialOpen title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    const apply = screen.getByRole("button", { name: "Apply" });
    user.click(apply);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("moves focus into the sheet on open", () => {
    render(
      <ControlledHarness initialOpen title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toHaveFocus();
  });

  it("traps Tab focus, cycling forward and backward", async () => {
    const user = userEvent.setup();
    render(<TrapHarness />);
    await user.click(screen.getByRole("button", { name: "Open trap" }));
    const dialog = screen.getByRole("dialog", { name: "Trap" });
    const alpha = screen.getByRole("button", { name: "Alpha" });
    const beta = screen.getByRole("button", { name: "Beta" });
    const gamma = screen.getByRole("button", { name: "Gamma" });
    expect(dialog).toHaveFocus();

    await user.tab();
    expect(alpha).toHaveFocus();
    await user.tab();
    expect(beta).toHaveFocus();
    await user.tab();
    expect(gamma).toHaveFocus();
    await user.tab();
    expect(alpha).toHaveFocus();

    await user.tab({ shift: true });
    expect(gamma).toHaveFocus();
    await user.tab({ shift: true });
    expect(beta).toHaveFocus();
  });

  it("cycles backward with Shift+Tab from the dialog panel", async () => {
    const user = userEvent.setup();
    render(<TrapHarness />);
    await user.click(screen.getByRole("button", { name: "Open trap" }));
    const dialog = screen.getByRole("dialog", { name: "Trap" });
    const gamma = screen.getByRole("button", { name: "Gamma" });
    expect(dialog).toHaveFocus();
    await user.tab({ shift: true });
    expect(gamma).toHaveFocus();
  });

  it("returns focus to the trigger on close", async () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    const trigger = screen.getByRole("button", { name: "Open sheet" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("locks body scroll on open and releases it on close", async () => {
    const user = userEvent.setup();
    render(
      <ControlledHarness title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    expect(document.body.style.overflow).toBe("");
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores a pre-existing body overflow value on close", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "scroll";
    render(
      <ControlledHarness title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("ref-counts the scroll lock across two open sheets", async () => {
    const user = userEvent.setup();
    render(<TwoSheetHarness />);
    await user.click(screen.getByRole("button", { name: "Open outer" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Open inner" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Close inner" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Close outer" }));
    expect(document.body.style.overflow).toBe("");
  });

  it("applies the responsive drawer-to-modal classes when responsive", () => {
    render(<Sheet open title="Panel" />);
    const dialog = screen.getByRole("dialog", { name: "Panel" });
    const positioner = dialog.parentElement!;
    expect(dialog.className).toContain("md:max-w-[30rem]");
    expect(positioner.className).toContain("md:items-center");
    expect(positioner.className).toContain("md:justify-center");
  });

  it("omits the responsive classes when responsive is off", () => {
    render(<Sheet open responsive={false} title="Panel" />);
    const dialog = screen.getByRole("dialog", { name: "Panel" });
    const positioner = dialog.parentElement!;
    expect(dialog.className).not.toContain("md:");
    expect(positioner.className).not.toContain("md:");
  });

  it.each([
    ["bottom", "items-end justify-center"],
    ["start", "items-stretch justify-start"],
    ["end", "items-stretch justify-end"],
  ] as const)("positions the %s placement", (placement, classes) => {
    render(<Sheet open placement={placement} title="Panel" />);
    const positioner = screen.getByRole("dialog").parentElement!;
    for (const token of classes.split(" ")) {
      expect(positioner.className).toContain(token);
    }
  });

  it("renders the bottom grabber only for bottom placement", () => {
    const { unmount } = render(<Sheet open title="Bottom" />);
    const bottom = screen.getByRole("dialog", { name: "Bottom" });
    const grabber = bottom.querySelector('[class~="rounded-full"]');
    expect(grabber).not.toBeNull();
    expect(grabber?.className).toContain("md:hidden");
    unmount();

    render(<Sheet open placement="start" title="Start" />);
    const start = screen.getByRole("dialog", { name: "Start" });
    expect(start.querySelector('[class~="rounded-full"]')).toBeNull();
  });

  it("renders the grabber for any placement when showGrabber is set", () => {
    render(<Sheet open placement="end" showGrabber title="Side panel" />);
    const dialog = screen.getByRole("dialog", { name: "Side panel" });
    expect(dialog.querySelector('[class~="rounded-full"]')).not.toBeNull();
  });

  it("uses logical transforms that flip with dir for start/end placements", () => {
    render(<Sheet open placement="start" title="Start panel" />);
    const start = screen.getByRole("dialog", { name: "Start panel" });
    expect(start.className).toContain("ltr:starting:-translate-x-full");
    expect(start.className).toContain("rtl:starting:translate-x-full");

    const { unmount } = render(
      <Sheet open placement="end" title="End panel" />,
    );
    const end = screen.getByRole("dialog", { name: "End panel" });
    expect(end.className).toContain("ltr:starting:translate-x-full");
    expect(end.className).toContain("rtl:starting:-translate-x-full");
    unmount();
  });

  it("uses logical corner radii for the bottom sheet", () => {
    render(<Sheet open title="Bottom sheet" />);
    const dialog = screen.getByRole("dialog", { name: "Bottom sheet" });
    expect(dialog.className).toContain("rounded-ss-xl rounded-se-xl");
    expect(dialog.className).not.toMatch(/\b(?:rounded-tl|rounded-tr)-/);
  });

  it("inerts background siblings on open and restores them on close", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ControlledHarness title="Filters">
        <button type="button">Apply</button>
      </ControlledHarness>,
    );
    expect(container).not.toHaveAttribute("inert");
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(container).toHaveAttribute("inert");
    await user.keyboard("{Escape}");
    expect(container).not.toHaveAttribute("inert");
  });

  it("keeps the outer sheet usable when the inner sheet closes", async () => {
    const user = userEvent.setup();
    const { container } = render(<TwoSheetHarness />);
    await user.click(screen.getByRole("button", { name: "Open outer" }));
    const outer = screen.getByRole("dialog", { name: "Outer" });
    const outerRoot = outer.parentElement!.parentElement!;
    expect(container).toHaveAttribute("inert");
    expect(outerRoot).not.toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Open inner" }));
    expect(container).toHaveAttribute("inert");
    expect(outerRoot).toHaveAttribute("inert");
    expect(
      screen.getByRole("dialog", { name: "Inner" }).parentElement!
        .parentElement!,
    ).not.toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Close inner" }));
    expect(
      screen.queryByRole("dialog", { name: "Inner" }),
    ).not.toBeInTheDocument();
    expect(outerRoot).not.toHaveAttribute("inert");
    expect(container).toHaveAttribute("inert");
    expect(screen.getByRole("dialog", { name: "Outer" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close outer" }));
    expect(container).not.toHaveAttribute("inert");
  });

  it("preserves a pre-existing inert sibling after close", () => {
    function PreInertHarness() {
      const [portalContainer, setPortalContainer] =
        useState<HTMLDivElement | null>(null);
      const [open, setOpen] = useState(true);
      return (
        <>
          <div ref={setPortalContainer} data-testid="portal-container">
            <button type="button" inert>
              Pre-inert sibling
            </button>
          </div>
          <Sheet
            container={portalContainer}
            open={open}
            onOpenChange={setOpen}
            title="Filters"
          >
            <button type="button" onClick={() => setOpen(false)}>
              Apply
            </button>
          </Sheet>
        </>
      );
    }

    const { container } = render(<PreInertHarness />);
    const portalRoot = screen.getByTestId("portal-container");
    const sibling = screen.getByRole("button", { name: "Pre-inert sibling" });
    expect(portalRoot.children.item(1)).not.toBeNull();
    expect(sibling).toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sibling).toHaveAttribute("inert");
    expect(container).not.toHaveAttribute("inert");
  });

  it("honours initialFocusRef over the panel", () => {
    function InitialFocusHarness() {
      const [open, setOpen] = useState(true);
      const focusRef = useRef<HTMLButtonElement>(null);
      return (
        <Sheet
          initialFocusRef={focusRef}
          open={open}
          onOpenChange={setOpen}
          title="Filters"
        >
          <button type="button" ref={focusRef}>
            Apply
          </button>
        </Sheet>
      );
    }

    render(<InitialFocusHarness />);
    expect(screen.getByRole("button", { name: "Apply" })).toHaveFocus();
  });

  it("is accessible while open", async () => {
    render(
      <Sheet open title="Confirm bid" description="This is a test dialog">
        <p>Are you sure you want to confirm this bid?</p>
        <button type="button">Confirm</button>
      </Sheet>,
    );
    expect(
      screen.getByRole("dialog", { name: "Confirm bid" }),
    ).toBeInTheDocument();
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
