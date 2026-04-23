import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  flattenTree,
  findDescendantsByIdInFlatTree,
  findAncestorsByIdInFlatTreeMap,
  getDistanceBetweenTwoPoints,
  debounce,
  handleTapEnter,
  noop,
} from "../lib";
import type { NodeData } from "../types";

describe("flattenTree", () => {
  it("flattens a simple tree", () => {
    const tree: NodeData = {
      id: 1,
      label: "Root",
      x: 0,
      y: 0,
      children: [
        { id: 2, label: "Child 1", x: 10, y: 10 },
        { id: 3, label: "Child 2", x: 20, y: 20 },
      ],
    };

    const result = flattenTree(tree);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 1, label: "Root", x: 0, y: 0 });
    expect(result[1]).toEqual({
      id: 2,
      pid: 1,
      label: "Child 1",
      x: 10,
      y: 10,
    });
    expect(result[2]).toEqual({
      id: 3,
      pid: 1,
      label: "Child 2",
      x: 20,
      y: 20,
    });
  });

  it("flattens nested tree", () => {
    const tree: NodeData = {
      id: 1,
      label: "Root",
      x: 0,
      y: 0,
      children: [
        {
          id: 2,
          label: "Child",
          x: 10,
          y: 10,
          children: [{ id: 3, label: "Grandchild", x: 20, y: 20 }],
        },
      ],
    };

    const result = flattenTree(tree);

    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      id: 3,
      pid: 2,
      label: "Grandchild",
      x: 20,
      y: 20,
    });
  });

  it("removes children property from result", () => {
    const tree: NodeData = {
      id: 1,
      label: "Root",
      x: 0,
      y: 0,
      children: [{ id: 2, label: "Child", x: 10, y: 10 }],
    };

    const result = flattenTree(tree);

    expect(result[0].children).toBeUndefined();
  });

  it("handles tree with no children", () => {
    const tree: NodeData = {
      id: 1,
      label: "Root",
      x: 0,
      y: 0,
    };

    const result = flattenTree(tree);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, label: "Root", x: 0, y: 0 });
  });
});

describe("findDescendantsByIdInFlatTree", () => {
  const flatTree: NodeData[] = [
    { id: 1, label: "Root", x: 0, y: 0 },
    { id: 2, pid: 1, label: "Child 1", x: 10, y: 10 },
    { id: 3, pid: 1, label: "Child 2", x: 20, y: 20 },
    { id: 4, pid: 2, label: "Grandchild", x: 30, y: 30 },
    { id: 5, pid: 4, label: "Great-grandchild", x: 40, y: 40 },
  ];

  it("finds direct children", () => {
    const result = findDescendantsByIdInFlatTree(flatTree, 1);

    expect(result).toHaveLength(4);
    expect(result.map((n) => n.id)).toContain(2);
    expect(result.map((n) => n.id)).toContain(3);
    expect(result.map((n) => n.id)).toContain(4);
    expect(result.map((n) => n.id)).toContain(5);
  });

  it("finds nested descendants", () => {
    const result = findDescendantsByIdInFlatTree(flatTree, 2);

    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toContain(4);
    expect(result.map((n) => n.id)).toContain(5);
  });

  it("returns empty array for leaf node", () => {
    const result = findDescendantsByIdInFlatTree(flatTree, 5);

    expect(result).toEqual([]);
  });

  it("returns empty array for non-existent id", () => {
    const result = findDescendantsByIdInFlatTree(flatTree, 999);

    expect(result).toEqual([]);
  });
});

describe("findAncestorsByIdInFlatTreeMap", () => {
  const flatTreeMap = new Map<number | string, NodeData>([
    [1, { id: 1, label: "Root", x: 0, y: 0 }],
    [2, { id: 2, pid: 1, label: "Child", x: 10, y: 10 }],
    [3, { id: 3, pid: 2, label: "Grandchild", x: 20, y: 20 }],
    [4, { id: 4, pid: 3, label: "Great-grandchild", x: 30, y: 30 }],
  ]);

  it("finds all ancestors", () => {
    const result = findAncestorsByIdInFlatTreeMap(flatTreeMap, 4);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(1);
  });

  it("finds single ancestor", () => {
    const result = findAncestorsByIdInFlatTreeMap(flatTreeMap, 2);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("returns empty array for root node", () => {
    const result = findAncestorsByIdInFlatTreeMap(flatTreeMap, 1);

    expect(result).toEqual([]);
  });

  it("returns empty array for non-existent id", () => {
    const result = findAncestorsByIdInFlatTreeMap(flatTreeMap, 999);

    expect(result).toEqual([]);
  });

  it("handles null pid", () => {
    const mapWithNull = new Map<number | string, NodeData>([
      [1, { id: 1, pid: null, label: "Root", x: 0, y: 0 }],
      [2, { id: 2, pid: 1, label: "Child", x: 10, y: 10 }],
    ]);

    const result = findAncestorsByIdInFlatTreeMap(mapWithNull, 2);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe("getDistanceBetweenTwoPoints", () => {
  it("calculates distance between two points", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };

    const result = getDistanceBetweenTwoPoints(p1, p2);

    expect(result).toBe(5);
  });

  it("returns 0 for same point", () => {
    const p1 = { x: 5, y: 5 };

    const result = getDistanceBetweenTwoPoints(p1, p1);

    expect(result).toBe(0);
  });

  it("handles negative coordinates", () => {
    const p1 = { x: -1, y: -1 };
    const p2 = { x: 2, y: 3 };

    const result = getDistanceBetweenTwoPoints(p1, p2);

    expect(result).toBeCloseTo(5, 5);
  });

  it("handles horizontal line", () => {
    const p1 = { x: 0, y: 5 };
    const p2 = { x: 10, y: 5 };

    const result = getDistanceBetweenTwoPoints(p1, p2);

    expect(result).toBe(10);
  });

  it("handles vertical line", () => {
    const p1 = { x: 3, y: 0 };
    const p2 = { x: 3, y: 8 };

    const result = getDistanceBetweenTwoPoints(p1, p2);

    expect(result).toBe(8);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls function after wait time", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn("arg");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg");
  });

  it("resets timer on multiple calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn("first");
    vi.advanceTimersByTime(50);
    debouncedFn("second");
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  it("calls function only once after rapid calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn("a");
    debouncedFn("b");
    debouncedFn("c");

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });
});

describe("handleTapEnter", () => {
  it("calls callback on Enter key", () => {
    const callback = vi.fn();
    const handler = handleTapEnter(callback);

    const event = {
      key: "Enter",
      shiftKey: false,
    } as React.KeyboardEvent<HTMLInputElement>;

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call callback on Shift+Enter", () => {
    const callback = vi.fn();
    const handler = handleTapEnter(callback);

    const event = {
      key: "Enter",
      shiftKey: true,
    } as React.KeyboardEvent<HTMLInputElement>;

    handler(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it("does not call callback on other keys", () => {
    const callback = vi.fn();
    const handler = handleTapEnter(callback);

    const event = {
      key: "Escape",
      shiftKey: false,
    } as React.KeyboardEvent<HTMLInputElement>;

    handler(event);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe("noop", () => {
  it("is a function that does nothing", () => {
    expect(noop).toBeInstanceOf(Function);
    expect(() => noop()).not.toThrow();
    expect(noop()).toBeUndefined();
  });
});
