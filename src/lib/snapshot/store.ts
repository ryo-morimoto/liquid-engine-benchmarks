/**
 * Snapshot Store Module
 *
 * Handles the storage and retrieval of snapshot files.
 * Snapshots are stored per adapter, allowing each implementation
 * to have its own baseline for self-verification.
 *
 * Directory structure:
 *   __snapshots__/{scenario}/{scale}/{adapter}.snap
 *
 * Example:
 *   __snapshots__/unit/tags/for/small/shopify.snap
 *   __snapshots__/unit/tags/for/small/keepsuit.snap
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Default snapshot directory relative to project root.
 */
export const DEFAULT_SNAPSHOT_DIR = join(import.meta.dirname, "../../../__snapshots__");

/**
 * Generate the file path for a snapshot.
 *
 * @param scenarioKey Scenario identifier with scale (e.g., "unit/tags/for/small")
 * @param adapter Adapter name (e.g., "shopify", "keepsuit")
 * @param baseDir Base directory for snapshots
 * @returns Absolute path to the snapshot file
 */
export function getSnapshotPath(
  scenarioKey: string,
  adapter: string,
  baseDir: string = DEFAULT_SNAPSHOT_DIR
): string {
  return join(baseDir, scenarioKey, `${adapter}.snap`);
}

/**
 * Save snapshot content to file.
 * Creates parent directories if they don't exist.
 *
 * @param scenarioKey Scenario identifier with scale
 * @param adapter Adapter name
 * @param content Rendered output to save
 * @param baseDir Base directory for snapshots
 */
export async function saveSnapshot(
  scenarioKey: string,
  adapter: string,
  content: string,
  baseDir: string = DEFAULT_SNAPSHOT_DIR
): Promise<void> {
  const path = getSnapshotPath(scenarioKey, adapter, baseDir);
  const dir = dirname(path);

  // Create parent directories if needed
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  await Bun.write(path, content);
}

/**
 * Load snapshot content from file.
 *
 * @param scenarioKey Scenario identifier with scale
 * @param adapter Adapter name
 * @param baseDir Base directory for snapshots
 * @returns Snapshot content, or null if file doesn't exist
 */
export async function loadSnapshot(
  scenarioKey: string,
  adapter: string,
  baseDir: string = DEFAULT_SNAPSHOT_DIR
): Promise<string | null> {
  const path = getSnapshotPath(scenarioKey, adapter, baseDir);

  if (!existsSync(path)) {
    return null;
  }

  return await Bun.file(path).text();
}

/**
 * Check if a snapshot file exists.
 *
 * @param scenarioKey Scenario identifier with scale
 * @param adapter Adapter name
 * @param baseDir Base directory for snapshots
 * @returns true if snapshot exists
 */
export function snapshotExists(
  scenarioKey: string,
  adapter: string,
  baseDir: string = DEFAULT_SNAPSHOT_DIR
): boolean {
  const path = getSnapshotPath(scenarioKey, adapter, baseDir);
  return existsSync(path);
}
