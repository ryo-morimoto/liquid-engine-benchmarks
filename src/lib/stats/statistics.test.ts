/**
 * Unit tests for statistics
 */

import { describe, expect, test } from "bun:test";
import { addArrays, calculateMetrics, max, mean, median, min, stddev } from "./statistics";

describe("mean", () => {
  test("calculates mean of positive numbers", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  test("calculates mean of single value", () => {
    expect(mean([42])).toBe(42);
  });

  test("calculates mean with decimals", () => {
    expect(mean([1.5, 2.5, 3.5])).toBe(2.5);
  });

  test("throws on empty array", () => {
    expect(() => mean([])).toThrow("Cannot calculate mean of empty array");
  });
});

describe("stddev", () => {
  test("calculates population stddev", () => {
    // Population stddev of [2, 4, 4, 4, 5, 5, 7, 9] is 2
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(stddev(values)).toBe(2);
  });

  test("returns 0 for single value", () => {
    expect(stddev([42])).toBe(0);
  });

  test("returns 0 for identical values", () => {
    expect(stddev([5, 5, 5, 5])).toBe(0);
  });

  test("throws on empty array", () => {
    expect(() => stddev([])).toThrow("Cannot calculate stddev of empty array");
  });
});

describe("min", () => {
  test("finds minimum value", () => {
    expect(min([3, 1, 4, 1, 5, 9])).toBe(1);
  });

  test("handles single value", () => {
    expect(min([42])).toBe(42);
  });

  test("handles negative values", () => {
    expect(min([-5, -2, -10, 0])).toBe(-10);
  });

  test("throws on empty array", () => {
    expect(() => min([])).toThrow("Cannot calculate min of empty array");
  });
});

describe("max", () => {
  test("finds maximum value", () => {
    expect(max([3, 1, 4, 1, 5, 9])).toBe(9);
  });

  test("handles single value", () => {
    expect(max([42])).toBe(42);
  });

  test("handles negative values", () => {
    expect(max([-5, -2, -10, 0])).toBe(0);
  });

  test("throws on empty array", () => {
    expect(() => max([])).toThrow("Cannot calculate max of empty array");
  });
});

describe("median", () => {
  test("calculates median of odd-length array", () => {
    expect(median([1, 3, 5, 7, 9])).toBe(5);
  });

  test("calculates median of even-length array", () => {
    // Average of middle two values (3, 5)
    expect(median([1, 3, 5, 7])).toBe(4);
  });

  test("handles unsorted array", () => {
    expect(median([9, 1, 7, 3, 5])).toBe(5);
  });

  test("handles single value", () => {
    expect(median([42])).toBe(42);
  });

  test("handles two values", () => {
    expect(median([10, 20])).toBe(15);
  });

  test("throws on empty array", () => {
    expect(() => median([])).toThrow("Cannot calculate median of empty array");
  });
});

describe("calculateMetrics", () => {
  test("calculates all metrics", () => {
    const values = [1, 2, 3, 4, 5];
    const metrics = calculateMetrics(values);

    expect(metrics.mean_ms).toBe(3);
    expect(metrics.min_ms).toBe(1);
    expect(metrics.max_ms).toBe(5);
    expect(metrics.median_ms).toBe(3);
    // Verify stddev (manual calculation: sqrt(2) ≈ 1.414)
    expect(metrics.stddev_ms).toBeCloseTo(Math.sqrt(2), 10);
  });

  test("returns PhaseMetrics shape", () => {
    const metrics = calculateMetrics([1, 2, 3]);

    expect(metrics).toHaveProperty("mean_ms");
    expect(metrics).toHaveProperty("stddev_ms");
    expect(metrics).toHaveProperty("min_ms");
    expect(metrics).toHaveProperty("max_ms");
    expect(metrics).toHaveProperty("median_ms");
  });
});

describe("addArrays", () => {
  test("adds arrays element-wise", () => {
    expect(addArrays([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
  });

  test("handles zeros", () => {
    expect(addArrays([0, 0, 0], [1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("handles decimals", () => {
    expect(addArrays([1.5, 2.5], [0.5, 0.5])).toEqual([2, 3]);
  });

  test("throws on different lengths", () => {
    expect(() => addArrays([1, 2], [1, 2, 3])).toThrow("Arrays must have the same length");
  });
});
