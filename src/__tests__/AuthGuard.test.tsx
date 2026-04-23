import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import AuthGuard from "../components/AuthGuard";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test component that renders when authenticated
const TestComponent = () => (
  <div data-testid="protected-content">Protected</div>
);
const UnauthorizedComponent = () => (
  <div data-testid="unauthorized">Unauthorized</div>
);

const renderWithRouter = (
  initialPath: string,
  options: { hasToken?: boolean; tokenValid?: boolean } = {},
) => {
  const { hasToken = false, tokenValid = false } = options;

  // Setup localStorage mock
  localStorageMock.getItem.mockReturnValue(hasToken ? "valid-token" : null);
  mockFetch.mockResolvedValue({ ok: tokenValid });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/noteDetails/:id"
          element={
            <AuthGuard>
              <TestComponent />
            </AuthGuard>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedComponent />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Public paths", () => {
    it("renders content for public path /noteDetails/49 without authentication", async () => {
      renderWithRouter("/noteDetails/49");

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("renders content for public path /noteDetails/22 without authentication", async () => {
      renderWithRouter("/noteDetails/22");

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  describe("Protected paths - no token", () => {
    it("redirects to /unauthorized when no token in localStorage", async () => {
      renderWithRouter("/noteDetails/1", { hasToken: false });

      await waitFor(() => {
        expect(screen.getByTestId("unauthorized")).toBeInTheDocument();
      });
    });

    it("checks localStorage for token", async () => {
      renderWithRouter("/noteDetails/1", { hasToken: false });

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith("vnote");
      });
    });
  });

  describe("Protected paths - invalid token", () => {
    it("redirects to /unauthorized when token is invalid", async () => {
      renderWithRouter("/noteDetails/1", { hasToken: true, tokenValid: false });

      await waitFor(() => {
        expect(screen.getByTestId("unauthorized")).toBeInTheDocument();
      });
    });

    it("calls verify token API with stored token", async () => {
      localStorageMock.getItem.mockReturnValue("my-test-token");
      mockFetch.mockResolvedValue({ ok: false });

      render(
        <MemoryRouter initialEntries={["/noteDetails/1"]}>
          <Routes>
            <Route
              path="/noteDetails/:id"
              element={
                <AuthGuard>
                  <TestComponent />
                </AuthGuard>
              }
            />
            <Route path="/unauthorized" element={<UnauthorizedComponent />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/auth/verify"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: "my-test-token" }),
          },
        );
      });
    });

    it("removes invalid token from localStorage", async () => {
      renderWithRouter("/noteDetails/1", { hasToken: true, tokenValid: false });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("vnote");
      });
    });
  });

  describe("Protected paths - valid token", () => {
    it("renders protected content when token is valid", async () => {
      renderWithRouter("/noteDetails/1", { hasToken: true, tokenValid: true });

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      });
    });

    it("does not remove token when valid", async () => {
      renderWithRouter("/noteDetails/1", { hasToken: true, tokenValid: true });

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      });

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("Loading state", () => {
    it("renders nothing while checking authentication", async () => {
      // Delay fetch response
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true }), 100),
          ),
      );

      renderWithRouter("/noteDetails/1", { hasToken: true });

      // Initially should render nothing (null)
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.queryByTestId("unauthorized")).not.toBeInTheDocument();
    });
  });

  describe("API errors", () => {
    it("redirects to unauthorized when API throws error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      renderWithRouter("/noteDetails/1", { hasToken: true });

      await waitFor(() => {
        expect(screen.getByTestId("unauthorized")).toBeInTheDocument();
      });
    });
  });
});
