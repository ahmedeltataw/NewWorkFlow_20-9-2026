import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

function Hello() {
  return <button type="button">Hello world</button>;
}

describe("BUG-P1-001 TSX transform verification", () => {
  it("renders JSX with automatic runtime", () => {
    render(<Hello />);
    expect(
      screen.getByRole("button", { name: "Hello world" }),
    ).toBeInTheDocument();
  });

  it("exposes the jest-axe accessibility matcher", async () => {
    const { container } = render(<Hello />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
