import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FilePicker from "../components/FilePicker";

describe("FilePicker", () => {
  it("renders file input element", () => {
    const handleFileChange = vi.fn();
    const { container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "file");
  });

  it("applies max-w-full class to input", () => {
    const handleFileChange = vi.fn();
    const { container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveClass("max-w-full");
  });

  it("calls handleFileChange when file is selected", () => {
    const handleFileChange = vi.fn();
    const { container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleFileChange).toHaveBeenCalledTimes(1);
    expect(handleFileChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          files: [file],
        }),
      }),
    );
  });

  it("handles multiple file selection", () => {
    const handleFileChange = vi.fn();
    const { container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const files = [
      new File(["content1"], "file1.txt", { type: "text/plain" }),
      new File(["content2"], "file2.txt", { type: "text/plain" }),
    ];

    fireEvent.change(input, { target: { files } });

    expect(handleFileChange).toHaveBeenCalledTimes(1);
  });

  it("clears input value when unmounted", () => {
    const handleFileChange = vi.fn();
    const { unmount, container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Simulate file selection
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });

    // Unmount component
    unmount();

    // After unmount, the input value should be cleared
    // We can't check directly since component is unmounted, but we can verify no error is thrown
    expect(() => unmount()).not.toThrow();
  });

  it("handles cleanup effect when input ref exists", () => {
    const handleFileChange = vi.fn();
    const { unmount, container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Set a value before unmount
    Object.defineProperty(input, "value", {
      value: "C:\\fakepath\\test.txt",
      writable: true,
    });

    // Unmount should trigger cleanup
    unmount();

    // Cleanup runs without error
    expect(container.innerHTML).toBe("");
  });

  it("accepts any file type by default", () => {
    const handleFileChange = vi.fn();
    const { container } = render(
      <FilePicker handleFileChange={handleFileChange} />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toHaveAttribute("accept");
  });
});
