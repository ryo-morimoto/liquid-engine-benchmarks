/**
 * Unit tests for snapshot module public API
 *
 * Tests the high-level API that integrates store and comparator.
 * This is what bench.ts will use.
 *
 * New API supports per-adapter snapshots:
 * - updateSnapshot(scenarioKey, adapter, content)
 * - verifySnapshot(scenarioKey, adapter, actualOutput, compareAgainst?)
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getSnapshotPath, updateSnapshot, type VerifyResult, verifySnapshot } from "./index";

/**
 * Temporary directory for integration tests.
 */
const TEST_SNAPSHOT_DIR = join(import.meta.dirname, "__test_snapshots_integration__");

describe("snapshot module API", () => {
  beforeAll(() => {
    if (!existsSync(TEST_SNAPSHOT_DIR)) {
      mkdirSync(TEST_SNAPSHOT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (existsSync(TEST_SNAPSHOT_DIR)) {
      rmSync(TEST_SNAPSHOT_DIR, { recursive: true });
    }
  });

  describe("updateSnapshot", () => {
    test("creates new snapshot file for adapter", async () => {
      const scenario = "api-test/create-new/small";
      const adapter = "shopify";
      const content = "<h1>New Snapshot</h1>";

      await updateSnapshot(scenario, adapter, content, TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(scenario, adapter, TEST_SNAPSHOT_DIR);
      expect(existsSync(path)).toBe(true);

      const saved = await Bun.file(path).text();
      expect(saved).toBe(content);
    });

    test("updates existing snapshot file", async () => {
      const scenario = "api-test/update-existing/small";
      const adapter = "shopify";

      await updateSnapshot(scenario, adapter, "original", TEST_SNAPSHOT_DIR);
      await updateSnapshot(scenario, adapter, "updated", TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(scenario, adapter, TEST_SNAPSHOT_DIR);
      const saved = await Bun.file(path).text();
      expect(saved).toBe("updated");
    });

    test("creates separate snapshots for different adapters", async () => {
      const scenario = "api-test/multi-adapter/small";

      await updateSnapshot(scenario, "shopify", "shopify output", TEST_SNAPSHOT_DIR);
      await updateSnapshot(scenario, "keepsuit", "keepsuit output", TEST_SNAPSHOT_DIR);

      const shopifyPath = getSnapshotPath(scenario, "shopify", TEST_SNAPSHOT_DIR);
      const keepsuitPath = getSnapshotPath(scenario, "keepsuit", TEST_SNAPSHOT_DIR);

      expect(existsSync(shopifyPath)).toBe(true);
      expect(existsSync(keepsuitPath)).toBe(true);

      expect(await Bun.file(shopifyPath).text()).toBe("shopify output");
      expect(await Bun.file(keepsuitPath).text()).toBe("keepsuit output");
    });
  });

  describe("verifySnapshot", () => {
    test("self-verification: returns success when output matches own snapshot", async () => {
      const scenario = "api-test/verify-self-match/small";
      const adapter = "shopify";
      const content = "<p>Matching content</p>";

      await updateSnapshot(scenario, adapter, content, TEST_SNAPSHOT_DIR);
      const result = await verifySnapshot(scenario, adapter, content, undefined, TEST_SNAPSHOT_DIR);

      expect(result.status).toBe("pass");
      expect(result.diff).toBeUndefined();
      expect(result.comparedAgainst).toBeUndefined();
    });

    test("self-verification: returns failure when output differs from own snapshot", async () => {
      const scenario = "api-test/verify-self-mismatch/small";
      const adapter = "shopify";

      await updateSnapshot(scenario, adapter, "expected output", TEST_SNAPSHOT_DIR);
      const result = await verifySnapshot(
        scenario,
        adapter,
        "actual output",
        undefined,
        TEST_SNAPSHOT_DIR
      );

      expect(result.status).toBe("fail");
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain("expected");
      expect(result.diff).toContain("actual");
    });

    test("baseline comparison: compares against specified adapter", async () => {
      const scenario = "api-test/verify-baseline/small";

      // Create baseline (shopify) snapshot
      await updateSnapshot(scenario, "shopify", "baseline output", TEST_SNAPSHOT_DIR);

      // Verify keepsuit output against shopify baseline
      const result = await verifySnapshot(
        scenario,
        "keepsuit",
        "baseline output",
        "shopify", // compare against shopify
        TEST_SNAPSHOT_DIR
      );

      expect(result.status).toBe("pass");
      expect(result.comparedAgainst).toBe("shopify");
    });

    test("baseline comparison: returns failure when different from baseline", async () => {
      const scenario = "api-test/verify-baseline-diff/small";

      // Create baseline (shopify) snapshot
      await updateSnapshot(scenario, "shopify", "shopify output", TEST_SNAPSHOT_DIR);

      // Verify keepsuit output against shopify baseline (different)
      const result = await verifySnapshot(
        scenario,
        "keepsuit",
        "keepsuit output",
        "shopify",
        TEST_SNAPSHOT_DIR
      );

      expect(result.status).toBe("fail");
      expect(result.comparedAgainst).toBe("shopify");
      expect(result.diff).toBeDefined();
    });

    test("returns missing status when snapshot does not exist", async () => {
      const result = await verifySnapshot(
        "nonexistent/scenario/small",
        "shopify",
        "some output",
        undefined,
        TEST_SNAPSHOT_DIR
      );

      expect(result.status).toBe("missing");
      expect(result.diff).toBeUndefined();
    });

    test("handles empty expected and actual", async () => {
      const scenario = "api-test/empty-content/small";
      const adapter = "shopify";

      await updateSnapshot(scenario, adapter, "", TEST_SNAPSHOT_DIR);
      const result = await verifySnapshot(scenario, adapter, "", undefined, TEST_SNAPSHOT_DIR);

      expect(result.status).toBe("pass");
    });
  });

  describe("VerifyResult type", () => {
    test("pass result has correct shape", () => {
      const result: VerifyResult = { status: "pass" };

      expect(result.status).toBe("pass");
      expect(result.diff).toBeUndefined();
    });

    test("pass result with comparedAgainst has correct shape", () => {
      const result: VerifyResult = { status: "pass", comparedAgainst: "shopify" };

      expect(result.status).toBe("pass");
      expect(result.comparedAgainst).toBe("shopify");
    });

    test("fail result has correct shape", () => {
      const result: VerifyResult = { status: "fail", diff: "diff content" };

      expect(result.status).toBe("fail");
      expect(result.diff).toBe("diff content");
    });

    test("missing result has correct shape", () => {
      const result: VerifyResult = { status: "missing" };

      expect(result.status).toBe("missing");
    });
  });
});
