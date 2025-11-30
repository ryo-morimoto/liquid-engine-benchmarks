/**
 * Snapshot Comparator Module
 *
 * Compares expected and actual output using exact string matching.
 * Generates human-readable diffs for mismatches.
 */

/**
 * Result of snapshot comparison.
 */
export interface CompareResult {
  /** Whether the outputs match exactly */
  match: boolean;
  /** Human-readable diff if outputs don't match */
  diff?: string;
}

/**
 * Compare expected and actual output.
 * Uses exact string matching (no normalization).
 *
 * @param expected Expected output (from snapshot)
 * @param actual Actual output (from adapter)
 * @returns Comparison result with optional diff
 */
export function compareSnapshots(expected: string, actual: string): CompareResult {
  if (expected === actual) {
    return { match: true };
  }

  return {
    match: false,
    diff: generateDiff(expected, actual),
  };
}

/**
 * Generate a human-readable diff between two strings.
 * Uses a simple line-by-line comparison.
 *
 * @param expected Expected content
 * @param actual Actual content
 * @returns Formatted diff string
 */
function generateDiff(expected: string, actual: string): string {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");

  const lines: string[] = [];
  lines.push("--- expected");
  lines.push("+++ actual");
  lines.push("");

  const maxLines = Math.max(expectedLines.length, actualLines.length);

  for (let i = 0; i < maxLines; i++) {
    const expectedLine = expectedLines[i];
    const actualLine = actualLines[i];

    if (expectedLine === actualLine) {
      // Lines match - show context
      lines.push(`  ${expectedLine ?? ""}`);
    } else if (expectedLine === undefined) {
      // Line added in actual
      lines.push(`+ ${actualLine}`);
    } else if (actualLine === undefined) {
      // Line removed from expected
      lines.push(`- ${expectedLine}`);
    } else {
      // Line changed
      lines.push(`- ${expectedLine}`);
      lines.push(`+ ${actualLine}`);
    }
  }

  return lines.join("\n");
}
