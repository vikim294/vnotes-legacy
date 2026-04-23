import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react";
import useModal from "../components/useModal";

// Test component that uses the hook
const TestModalComponent = ({
  onModalVisible,
  closeOnClickMask = true,
}: {
  onModalVisible?: () => void;
  closeOnClickMask?: boolean;
}) => {
  const { Modal, openModal, closeModal } = useModal({
    onModalVisible,
  });

  return (
    <div>
      <button data-testid="open-btn" onClick={openModal}>
        Open
      </button>
      <button data-testid="close-btn" onClick={closeModal}>
        Close
      </button>
      <Modal
        header="Test Header"
        width={500}
        closeOnClickMask={closeOnClickMask}
      >
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    </div>
  );
};

describe("useModal", () => {
  it("does not render Modal initially", () => {
    render(<TestModalComponent />);

    expect(screen.queryByText("Test Header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("modal-content")).not.toBeInTheDocument();
  });

  it("renders Modal when openModal is called", () => {
    render(<TestModalComponent />);

    fireEvent.click(screen.getByTestId("open-btn"));

    expect(screen.getByText("Test Header")).toBeInTheDocument();
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
  });

  it("hides Modal when closeModal is called", () => {
    render(<TestModalComponent />);

    fireEvent.click(screen.getByTestId("open-btn"));
    expect(screen.getByText("Test Header")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-btn"));
    expect(screen.queryByText("Test Header")).not.toBeInTheDocument();
  });

  it("calls onModalVisible callback when Modal becomes visible", () => {
    const onModalVisible = vi.fn();
    render(<TestModalComponent onModalVisible={onModalVisible} />);

    fireEvent.click(screen.getByTestId("open-btn"));

    expect(onModalVisible).toHaveBeenCalledTimes(1);
  });

  it("does not call onModalVisible when Modal is closed", () => {
    const onModalVisible = vi.fn();
    render(<TestModalComponent onModalVisible={onModalVisible} />);

    fireEvent.click(screen.getByTestId("open-btn"));
    expect(onModalVisible).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("close-btn"));
    // Callback should not be called when closing
    expect(onModalVisible).toHaveBeenCalledTimes(1);
  });

  it("closes Modal when clicking mask (closeOnClickMask=true)", () => {
    render(<TestModalComponent closeOnClickMask={true} />);

    fireEvent.click(screen.getByTestId("open-btn"));
    expect(screen.getByText("Test Header")).toBeInTheDocument();

    // Click on the mask (the outer flex container)
    const mask = screen
      .getByText("Test Header")
      .closest(".fixed.inset-0") as HTMLElement;
    fireEvent.pointerDown(mask);

    expect(screen.queryByText("Test Header")).not.toBeInTheDocument();
  });

  it("does not close Modal when clicking mask (closeOnClickMask=false)", () => {
    render(<TestModalComponent closeOnClickMask={false} />);

    fireEvent.click(screen.getByTestId("open-btn"));
    expect(screen.getByText("Test Header")).toBeInTheDocument();

    // Click on the mask
    const mask = screen
      .getByText("Test Header")
      .closest(".fixed.inset-0") as HTMLElement;
    fireEvent.pointerDown(mask);

    // Modal should still be visible
    expect(screen.getByText("Test Header")).toBeInTheDocument();
  });

  it("does not close when clicking modal content", () => {
    render(<TestModalComponent closeOnClickMask={true} />);

    fireEvent.click(screen.getByTestId("open-btn"));
    expect(screen.getByText("Test Header")).toBeInTheDocument();

    // Click on modal content
    fireEvent.pointerDown(screen.getByTestId("modal-content"));

    // Modal should still be visible (stopPropagation prevents close)
    expect(screen.getByText("Test Header")).toBeInTheDocument();
  });

  it("does not close when clicking modal header", () => {
    render(<TestModalComponent closeOnClickMask={true} />);

    fireEvent.click(screen.getByTestId("open-btn"));

    // Click on modal header
    fireEvent.pointerDown(screen.getByText("Test Header"));

    // Modal should still be visible
    expect(screen.getByText("Test Header")).toBeInTheDocument();
  });

  it("applies custom width to Modal", () => {
    render(<TestModalComponent />);

    fireEvent.click(screen.getByTestId("open-btn"));

    const modalContainer = screen
      .getByText("Test Header")
      .closest("[style]") as HTMLElement;
    expect(modalContainer?.style.width).toBe("500px");
  });

  it("renders with correct CSS classes", () => {
    render(<TestModalComponent />);

    fireEvent.click(screen.getByTestId("open-btn"));

    const mask = screen.getByText("Test Header").closest(".fixed.inset-0");
    expect(mask).toHaveClass("bg-black/60");
    expect(mask).toHaveClass("z-50");
    expect(mask).toHaveClass("flex");
    expect(mask).toHaveClass("items-center");
    expect(mask).toHaveClass("justify-center");
  });

  it("renders footer when provided", () => {
    const ComponentWithFooter = () => {
      const { Modal, openModal } = useModal({});

      return (
        <div>
          <button data-testid="open-btn" onClick={openModal}>
            Open
          </button>
          <Modal
            header="Test Header"
            footer={<button data-testid="footer-btn">Footer Button</button>}
          >
            <div>Modal Content</div>
          </Modal>
        </div>
      );
    };

    render(<ComponentWithFooter />);

    fireEvent.click(screen.getByTestId("open-btn"));

    expect(screen.getByTestId("footer-btn")).toBeInTheDocument();
    expect(screen.getByTestId("footer-btn")).toHaveTextContent("Footer Button");
  });

  it("does not render when visible is false", () => {
    const { result } = renderHook(() => useModal({}));

    const { Modal } = result.current;

    // Render Modal component directly without calling openModal
    const { container } = render(<Modal header="Test">Content</Modal>);

    // Modal should not be in the document body
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
  });

  it("memoizes Modal component reference", () => {
    const { result } = renderHook(() => useModal({}));

    const firstModal = result.current.Modal;
    const secondModal = result.current.Modal;

    expect(firstModal).toBe(secondModal);
  });
});
