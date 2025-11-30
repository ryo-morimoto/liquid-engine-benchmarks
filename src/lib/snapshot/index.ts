/**
 * Snapshot Module
 *
 * Provides snapshot testing functionality for verifying
 * Liquid template output consistency across implementations.
 *
 * Each adapter has its own snapshot, enabling:
 * 1. Self-verification: Compare against adapter's own previous output (default)
 * 2. Baseline comparison: Compare against shopify output (optional)
 */

import { compareSnapshots } from "./comparator";
import { loadSnapshot, saveSnapshot, snapshotExists } from "./store";

// Re-export types and utilities
export type { CompareResult } from "./comparator";
export { compareSnapshots } from "./comparator";
export {
  DEFAULT_SNAPSHOT_DIR,
  getSnapshotPath,
  loadSnapshot,
  saveSnapshot,
  snapshotExists,
} from "./store";

/**
 * Result of snapshot verification.
 */
export interface VerifyResult {
  /** Verification status */
  status: "pass" | "fail" | "missing";
  /** Diff content if verification failed */
  diff?: string;
  /** Adapter that was compared against (for baseline comparison mode) */
  comparedAgainst?: string;
}

/**
 * Update (save) a snapshot for a specific adapter.
 * Used when --update-snapshots flag is provided.
 *
 * @param scenarioKey Scenario identifier with scale (e.g., "unit/tags/for/small")
 * @param adapter Adapter name (e.g., "shopify", "keepsuit")
 * @param content Rendered output to save
 * @param baseDir Base directory for snapshots
 */
export async function updateSnapshot(
  scenarioKey: string,
  adapter: string,
  content: string,
  baseDir?: string
): Promise<void> {
  await saveSnapshot(scenarioKey, adapter, content, baseDir);
}

/**
 * Verify rendered output against stored snapshot.
 * By default, compares against the adapter's own previous output (self-verification).
 * If compareAgainst is specified, compares against that adapter's snapshot instead.
 *
 * @param scenarioKey Scenario identifier with scale
 * @param adapter Adapter name
 * @param actualOutput Rendered output from adapter
 * @param compareAgainst Optional adapter to compare against (for baseline comparison)
 * @param baseDir Base directory for snapshots
 * @returns Verification result with status and optional diff
 */
export async function verifySnapshot(
  scenarioKey: string,
  adapter: string,
  actualOutput: string,
  compareAgainst?: string,
  baseDir?: string
): Promise<VerifyResult> {
  // Determine which adapter's snapshot to compare against
  const targetAdapter = compareAgainst ?? adapter;

  // Check if snapshot exists
  if (!snapshotExists(scenarioKey, targetAdapter, baseDir)) {
    return { status: "missing" };
  }

  // Load expected output
  const expectedOutput = await loadSnapshot(scenarioKey, targetAdapter, baseDir);

  // Should not happen if snapshotExists returned true, but handle defensively
  if (expectedOutput === null) {
    return { status: "missing" };
  }

  // Compare outputs
  const result = compareSnapshots(expectedOutput, actualOutput);

  if (result.match) {
    return {
      status: "pass",
      ...(compareAgainst && { comparedAgainst: compareAgainst }),
    };
  }

  return {
    status: "fail",
    diff: result.diff,
    ...(compareAgainst && { comparedAgainst: compareAgainst }),
  };
}
