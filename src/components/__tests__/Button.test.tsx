import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../Button";

describe("Button", () => {
  it("renders with default type", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders different button types", () => {
    const { rerender } = render(<Button type="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("from-emerald-600");

    rerender(<Button type="danger">Danger</Button>);
    expect(screen.getByRole("button")).toHaveClass("from-rose-600");

    rerender(<Button type="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-slate-700");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
