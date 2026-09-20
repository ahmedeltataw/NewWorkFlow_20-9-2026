import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../../src/components/primitives/Button";
import { Checkbox } from "../../src/components/primitives/Checkbox";
import { FieldHint } from "../../src/components/primitives/FieldHint";
import { Icon } from "../../src/components/primitives/Icon";
import { Input } from "../../src/components/primitives/Input";
import { Radio } from "../../src/components/primitives/Radio";
import { Select } from "../../src/components/primitives/Select";
import { Skeleton } from "../../src/components/primitives/Skeleton";
import { Switch } from "../../src/components/primitives/Switch";

const ICON_NAMES = [
  "spinner",
  "chevron-down",
  "chevron-up",
  "chevron-start",
  "chevron-end",
  "check",
  "dash",
  "close",
  "search",
  "alert",
  "eye",
  "eye-off",
] as const;

async function expectAxeClean(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe("T024 Button", () => {
  it("renders a button with an accessible name from its children", async () => {
    const { container } = render(<Button>Place bid</Button>);
    const button = screen.getByRole("button", { name: "Place bid" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
    await expectAxeClean(container);
  });

  it("uses aria-label as the accessible name when provided", () => {
    render(
      <Button aria-label="Place bid" disabled>
        Place bid
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Place bid" })).toBeDisabled();
  });

  it("is reachable by Tab and carries the documented focus ring", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button>First</Button>
        <Button>Second</Button>
      </>,
    );
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    await user.tab();
    expect(first).toHaveFocus();
    expect(first.className).toContain("focus-visible:outline-2");
    await user.tab();
    expect(second).toHaveFocus();
  });

  it("activates on Space and Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    button.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("is skipped by Tab and cannot activate while disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick} disabled>
          Blocked
        </Button>
        <Button onClick={onClick}>After</Button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Blocked" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders loading as disabled, aria-busy, with a spinner", () => {
    const { container } = render(
      <Button loading loadingLabel="Saving bid">
        Place bid
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving bid" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("keeps the children name while loading without a loadingLabel", () => {
    render(<Button loading>Place bid</Button>);
    const button = screen.getByRole("button", { name: "Place bid" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it.each([
    ["md", "h-10"],
    ["lg", "h-11"],
  ] as const)("renders the %s size", (size, token) => {
    render(<Button size={size}>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain(
      token,
    );
  });

  it.each([
    ["solid", "bg-action-primary"],
    ["outline", "border-stroke-heavy"],
  ] as const)("renders the %s variant", (variant, token) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain(
      token,
    );
  });

  it("fills the full width when fullWidth is set", () => {
    render(<Button fullWidth>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain(
      "w-full",
    );
  });
});

describe("T024 Input", () => {
  it("renders a labelled textbox", async () => {
    const { container } = render(
      <>
        <label htmlFor="name">Full name</label>
        <Input id="name" />
      </>,
    );
    expect(screen.getByRole("textbox", { name: "Full name" })).toBe(
      screen.getByLabelText("Full name"),
    );
    await expectAxeClean(container);
  });

  it("supports an aria-label as the accessible name", () => {
    render(<Input aria-label="Search auctions" />);
    expect(
      screen.getByRole("textbox", { name: "Search auctions" }),
    ).toBeInTheDocument();
  });

  it("receives focus via Tab and accepts typing", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="q">Search</label>
        <Input id="q" />
      </>,
    );
    const input = screen.getByRole("textbox", { name: "Search" });
    await user.tab();
    expect(input).toHaveFocus();
    expect(input.className).toContain("focus-visible:outline-2");
    await user.type(input, "bmw");
    expect(input).toHaveValue("bmw");
  });

  it("is skipped by Tab and cannot be edited while disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="a">Alpha</label>
        <Input id="a" disabled />
        <label htmlFor="b">Beta</label>
        <Input id="b" />
      </>,
    );
    const alpha = screen.getByLabelText("Alpha");
    const beta = screen.getByLabelText("Beta");
    await user.tab();
    expect(beta).toHaveFocus();
    await user.type(alpha, "x");
    expect(alpha).toHaveValue("");
    await user.type(beta, "y");
    expect(beta).toHaveValue("y");
  });

  it("is aria-busy and shows a spinner while loading", () => {
    const { container } = render(
      <>
        <label htmlFor="q">Search</label>
        <Input id="q" loading />
      </>,
    );
    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it.each([
    ["sm", "h-10"],
    ["lg", "h-11"],
  ] as const)("renders the %s size", (size, token) => {
    render(
      <>
        <label htmlFor="f">Field</label>
        <Input id="f" size={size} />
      </>,
    );
    expect(screen.getByRole("textbox").className).toContain(token);
  });
});

describe("T024 Select", () => {
  it("renders a labelled combobox", async () => {
    const { container } = render(
      <>
        <label htmlFor="cat">Category</label>
        <Select id="cat">
          <option>All</option>
          <option>Cars</option>
        </Select>
      </>,
    );
    expect(screen.getByRole("combobox", { name: "Category" })).toBeEnabled();
    await expectAxeClean(container);
  });

  it("receives focus via Tab and changes its value on user selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="cat">Category</label>
        <Select id="cat" onChange={onChange}>
          <option value="all">All</option>
          <option value="cars">Cars</option>
          <option value="plates">Plates</option>
        </Select>
      </>,
    );
    const select = screen.getByRole("combobox", { name: "Category" });
    await user.tab();
    expect(select).toHaveFocus();
    expect(select.className).toContain("focus-visible:outline-2");
    await user.selectOptions(select, "cars");
    expect(select).toHaveValue("cars");
    expect(onChange).toHaveBeenCalled();
  });

  it("is skipped by Tab and cannot change while disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="a">Alpha</label>
        <Select id="a" disabled>
          <option value="all">All</option>
          <option value="cars">Cars</option>
        </Select>
        <label htmlFor="b">Beta</label>
        <Select id="b">
          <option value="all">All</option>
          <option value="cars">Cars</option>
        </Select>
      </>,
    );
    const alpha = screen.getByRole("combobox", { name: "Alpha" });
    const beta = screen.getByRole("combobox", { name: "Beta" });
    await user.tab();
    expect(beta).toHaveFocus();
    await user.selectOptions(alpha, "cars");
    expect(alpha).toHaveValue("all");
  });

  it("is aria-busy and shows a spinner while loading", () => {
    const { container } = render(
      <>
        <label htmlFor="cat">Category</label>
        <Select id="cat" loading>
          <option>All</option>
        </Select>
      </>,
    );
    const select = screen.getByRole("combobox", { name: "Category" });
    expect(select).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it.each([
    ["sm", "h-10"],
    ["lg", "h-11"],
  ] as const)("renders the %s size", (size, token) => {
    render(
      <>
        <label htmlFor="f">Field</label>
        <Select id="f" size={size}>
          <option>All</option>
        </Select>
      </>,
    );
    expect(screen.getByRole("combobox").className).toContain(token);
  });
});

describe("T024 Checkbox", () => {
  it("renders a labelled checkbox and toggles on Space", async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox label="Notify me" />);
    const checkbox = screen.getByRole("checkbox", { name: "Notify me" });
    expect(checkbox).not.toBeChecked();
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
    await expectAxeClean(container);
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Agree" />);
    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("reports the mixed state when indeterminate", () => {
    render(<Checkbox label="Select all" indeterminate />);
    expect(
      screen.getByRole("checkbox", { name: "Select all" }),
    ).toBePartiallyChecked();
  });

  it("forwards controlled checked state and change events", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Agree" checked onChange={onChange} />);
    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(onChange).toHaveBeenCalled();
  });

  it("is skipped by Tab and cannot be checked while disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox label="Blocked" disabled />
        <Checkbox label="Allowed" />
      </>,
    );
    const blocked = screen.getByRole("checkbox", { name: "Blocked" });
    const allowed = screen.getByRole("checkbox", { name: "Allowed" });
    await user.tab();
    expect(allowed).toHaveFocus();
    await user.click(blocked);
    expect(blocked).not.toBeChecked();
  });

  it.each([
    ["sm", "h-5 w-5"],
    ["md", "h-6 w-6"],
    ["lg", "h-7 w-7"],
  ] as const)("renders the %s box size", (size, token) => {
    const { container } = render(<Checkbox label="Size" size={size} />);
    const box = container.querySelector("span[aria-hidden='true']");
    expect(box?.className).toContain(token);
  });
});

describe("T024 Radio", () => {
  it("renders labelled radios and selects the focused one on Space", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Radio name="payment" label="Wallet" value="wallet" />
        <Radio name="payment" label="Card" value="card" />
      </>,
    );
    const wallet = screen.getByRole("radio", { name: "Wallet" });
    wallet.focus();
    await user.keyboard(" ");
    expect(wallet).toBeChecked();
    expect(screen.getByRole("radio", { name: "Card" })).not.toBeChecked();
    await expectAxeClean(container);
  });

  it("moves the checked state with arrow keys within a same-name group", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="payment" label="Wallet" value="wallet" />
        <Radio name="payment" label="Card" value="card" />
        <Radio name="payment" label="Bank" value="bank" />
      </>,
    );
    const wallet = screen.getByRole("radio", { name: "Wallet" });
    const card = screen.getByRole("radio", { name: "Card" });
    const bank = screen.getByRole("radio", { name: "Bank" });
    wallet.focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    expect(card).toBeChecked();
    await user.keyboard("{ArrowDown}");
    expect(bank).toBeChecked();
    await user.keyboard("{ArrowUp}");
    expect(card).toBeChecked();
  });

  it("is skipped by Tab and cannot be selected while disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="g" label="Blocked" value="blocked" disabled />
        <Radio name="g" label="Allowed" value="allowed" />
      </>,
    );
    const blocked = screen.getByRole("radio", { name: "Blocked" });
    const allowed = screen.getByRole("radio", { name: "Allowed" });
    await user.tab();
    expect(allowed).toHaveFocus();
    await user.click(blocked);
    expect(blocked).not.toBeChecked();
  });

  it.each([
    ["sm", "h-5 w-5"],
    ["md", "h-6 w-6"],
    ["lg", "h-7 w-7"],
  ] as const)("renders the %s size", (size, token) => {
    const { container } = render(<Radio label="Size" size={size} />);
    const box = container.querySelector("span[aria-hidden='true']");
    expect(box?.className).toContain(token);
  });
});

describe("T024 Switch", () => {
  it("renders a labelled switch that toggles on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch label="Notifications" />);
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await expectAxeClean(container);
  });

  it("uses a non-string label as its accessible name", async () => {
    const { container } = render(
      <Switch label={<strong>Email alerts</strong>} />,
    );
    expect(
      screen.getByRole("switch", { name: "Email alerts" }),
    ).toBeInTheDocument();
    await expectAxeClean(container);
  });

  it("toggles with Space and Enter", async () => {
    const user = userEvent.setup();
    render(<Switch label="Dark mode" defaultChecked />);
    const toggle = screen.getByRole("switch", { name: "Dark mode" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("honours the controlled checked prop and reports changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch checked={false} onCheckedChange={onCheckedChange} label="A" />,
    );
    const toggle = screen.getByRole("switch", { name: "A" });
    await user.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("is skipped by Tab and does not toggle while disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <>
        <Switch label="Blocked" disabled onCheckedChange={onCheckedChange} />
        <Switch label="Allowed" />
      </>,
    );
    const blocked = screen.getByRole("switch", { name: "Blocked" });
    const allowed = screen.getByRole("switch", { name: "Allowed" });
    await user.tab();
    expect(allowed).toHaveFocus();
    await user.click(blocked);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(blocked).toHaveAttribute("aria-checked", "false");
  });
});

describe("T024 Icon", () => {
  it("renders every documented icon name as an aria-hidden, non-focusable svg", () => {
    for (const name of ICON_NAMES) {
      const { container } = render(<Icon name={name} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    }
  });

  it("renders distinct path content per icon name", () => {
    const check = render(<Icon name="check" />);
    const close = render(<Icon name="close" />);
    expect(check.container.querySelector("svg")?.innerHTML).not.toBe(
      close.container.querySelector("svg")?.innerHTML,
    );
  });

  it.each([
    ["xs", "h-4 w-4"],
    ["sm", "h-5 w-5"],
    ["md", "h-6 w-6"],
    ["lg", "h-7 w-7"],
  ] as const)("renders the %s size", (size, token) => {
    const { container } = render(<Icon name="search" size={size} />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      token,
    );
  });

  it("renders the spin animation when spinning", () => {
    const { container } = render(<Icon name="spinner" spin />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "animate-spin",
    );
  });

  it("renders the RTL mirror class when mirrorInRtl is set", () => {
    const { container } = render(<Icon name="chevron-start" mirrorInRtl />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "rtl:-scale-x-100",
    );
  });

  it("can expose an accessible name when made visible", () => {
    render(
      <Icon name="search" aria-hidden={false} role="img" aria-label="Search" />,
    );
    expect(screen.getByRole("img", { name: "Search" })).toBeInTheDocument();
  });

  it("renders decorative icons without axe violations", async () => {
    const { container } = render(
      <>
        <Icon name="search" />
        <Icon name="chevron-down" />
      </>,
    );
    await expectAxeClean(container);
  });
});

describe("T024 Skeleton", () => {
  it("renders a single decorative skeleton block", async () => {
    const { container } = render(<Skeleton />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton.className).toContain("animate-pulse");
    await expectAxeClean(container);
  });

  it("renders the requested number of lines", () => {
    render(<Skeleton lines={3} />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
  });

  it("clamps lines to at least one", () => {
    render(<Skeleton lines={0} />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(1);
  });

  it.each([
    ["text", "h-3"],
    ["circle", "rounded-full"],
    ["rectangle", "h-5"],
  ] as const)("renders the %s variant shape", (variant, token) => {
    const { container } = render(<Skeleton variant={variant} />);
    expect(
      container.querySelector("[data-testid='skeleton']")?.className,
    ).toContain(token);
  });
});

describe("T024 FieldHint", () => {
  it("renders hint text under its id", () => {
    render(<FieldHint id="email-hint">Use your work email</FieldHint>);
    const hint = screen.getByText("Use your work email");
    expect(hint).toHaveAttribute("id", "email-hint");
  });

  it("associates with a field as its accessible description", async () => {
    const { container } = render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" aria-describedby="email-hint" />
        <FieldHint id="email-hint" tone="error">
          Enter a valid email
        </FieldHint>
      </>,
    );
    expect(
      screen.getByRole("textbox", { name: "Email" }),
    ).toHaveAccessibleDescription("Enter a valid email");
    await expectAxeClean(container);
  });

  it("renders the default tone", () => {
    render(<FieldHint id="h">Ok</FieldHint>);
    expect(screen.getByText("Ok").className).toContain("text-text-sub-text");
  });

  it("renders the error tone", () => {
    render(
      <FieldHint id="h" tone="error">
        Nope
      </FieldHint>,
    );
    expect(screen.getByText("Nope").className).toContain("text-status-error");
  });

  it("renders an optional leading icon", () => {
    const { container } = render(
      <FieldHint id="h" icon="alert">
        Careful
      </FieldHint>,
    );
    expect(screen.getByText("Careful")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it.each([
    ["sm", "text-caption"],
    ["lg", "text-body-sm"],
  ] as const)("renders the %s size", (size, token) => {
    render(
      <FieldHint id="h" size={size}>
        Text
      </FieldHint>,
    );
    expect(screen.getByText("Text").className).toContain(token);
  });
});
