/**
 * Statistics Module
 *
 * Calculates statistical metrics (mean, stddev, min, max, median) from
 * benchmark measurements. All adapters use the same algorithm for consistency.
 */

import type { PhaseMetrics } from "../../types";

/**
 * Calculate the sum of an array.
 */
function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Calculate the arithmetic mean.
 */
export function mean(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate mean of empty array");
  }
  return sum(values) / values.length;
}

/**
 * Calculate the population standard deviation.
 * Uses population stddev (not sample) because benchmarks measure all iterations.
 */
export function stddev(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate stddev of empty array");
  }
  if (values.length === 1) {
    return 0;
  }
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(sum(squaredDiffs) / values.length);
}

/**
 * Find the minimum value.
 */
export function min(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate min of empty array");
  }
  return Math.min(...values);
}

/**
 * Find the maximum value.
 */
export function max(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate max of empty array");
  }
  return Math.max(...values);
}

/**
 * Calculate the median.
 */
export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate median of empty array");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // For even-length arrays, average the two middle values
    const left = sorted[mid - 1];
    const right = sorted[mid];
    if (left === undefined || right === undefined) {
      throw new Error("Unexpected undefined values in sorted array");
    }
    return (left + right) / 2;
  }
  const midValue = sorted[mid];
  if (midValue === undefined) {
    throw new Error("Unexpected undefined value at mid index");
  }
  return midValue;
}

/**
 * Calculate all phase metrics from an array of values.
 */
export function calculateMetrics(values: number[]): PhaseMetrics {
  return {
    mean_ms: mean(values),
    stddev_ms: stddev(values),
    min_ms: min(values),
    max_ms: max(values),
    median_ms: median(values),
  };
}

/**
 * Add two arrays element-wise.
 * Used to calculate total_ms = parse_ms + render_ms.
 */
export function addArrays(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error("Arrays must have the same length");
  }
  return a.map((v, i) => {
    const bValue = b[i];
    if (bValue === undefined) {
      throw new Error(`Unexpected undefined value at index ${i}`);
    }
    return v + bValue;
  });
}
