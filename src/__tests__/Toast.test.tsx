import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { Toast } from "../components/Toast";

describe("Toast", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("renders toast with default info type", async () => {
    await act(async () => {
      Toast.show("Hello World");
    });

    const toast = document.querySelector(".toast-wrapper");
    expect(toast).toBeInTheDocument();
    expect(toast?.textContent).toBe("Hello World");
  });

  it("renders toast with error type", async () => {
    await act(async () => {
      Toast.show("Error message", "error");
    });

    const toast = document.querySelector(".toast-wrapper");
    expect(toast).toBeInTheDocument();
    expect(toast?.textContent).toBe("Error message");
  });

  it("auto-removes toast after 3 seconds", async () => {
    await act(async () => {
      Toast.show("Temporary message");
    });

    expect(document.querySelector(".toast-wrapper")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(document.querySelector(".toast-wrapper")).not.toBeInTheDocument();
  });

  it("static error method renders error toast", async () => {
    await act(async () => {
      Toast.error("Something went wrong");
    });

    const toast = document.querySelector(".toast-wrapper");
    expect(toast).toBeInTheDocument();
    expect(toast?.textContent).toBe("Something went wrong");
  });

  it("static warning method renders warning toast", async () => {
    await act(async () => {
      Toast.warning("Be careful");
    });

    const toast = document.querySelector(".toast-wrapper");
    expect(toast).toBeInTheDocument();
    expect(toast?.textContent).toBe("Be careful");
  });

  it("static success method renders success toast", async () => {
    await act(async () => {
      Toast.success("Operation completed");
    });

    const toast = document.querySelector(".toast-wrapper");
    expect(toast).toBeInTheDocument();
    expect(toast?.textContent).toBe("Operation completed");
  });

  it("renders multiple toasts simultaneously", async () => {
    await act(async () => {
      Toast.show("First");
      Toast.show("Second");
      Toast.show("Third");
    });

    const toasts = document.querySelectorAll(".toast-wrapper");
    expect(toasts).toHaveLength(3);
  });

  it("each toast removes independently", async () => {
    await act(async () => {
      Toast.show("First");
    });

    await act(async () => {
      Toast.show("Second");
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // 两个 toast 都还在（只过了 1.5s，每个只过了 0.75s 左右，但都小于 3s）
    const toastsAfter1_5s = document.querySelectorAll(".toast-wrapper");
    expect(toastsAfter1_5s).toHaveLength(2);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // 所有 toast 都应该消失了
    const toastsAfter4_5s = document.querySelectorAll(".toast-wrapper");
    expect(toastsAfter4_5s).toHaveLength(0);
  });

  it("creates toast with correct positioning classes", async () => {
    await act(async () => {
      Toast.show("Positioned toast");
    });

    const toastContent = document.querySelector(".toast-wrapper > div");
    expect(toastContent).toHaveClass("fixed");
    expect(toastContent).toHaveClass("top-10");
    expect(toastContent).toHaveClass("left-1/2");
    expect(toastContent).toHaveClass("-translate-x-1/2");
    expect(toastContent).toHaveClass("z-[100]");
  });
});
