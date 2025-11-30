/**
 * Unit tests for snapshot store
 *
 * Tests the storage and retrieval of snapshot files.
 * Uses a temporary directory to avoid polluting the actual __snapshots__ folder.
 *
 * New directory structure: __snapshots__/{scenario}/{scale}/{adapter}.snap
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getSnapshotPath, loadSnapshot, saveSnapshot, snapshotExists } from "./store";

/**
 * Temporary directory for test snapshots.
 * Isolated from production __snapshots__ folder.
 */
const TEST_SNAPSHOT_DIR = join(import.meta.dirname, "__test_snapshots__");

describe("snapshot store", () => {
  beforeAll(() => {
    // Create test snapshot directory
    if (!existsSync(TEST_SNAPSHOT_DIR)) {
      mkdirSync(TEST_SNAPSHOT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test snapshot directory
    if (existsSync(TEST_SNAPSHOT_DIR)) {
      rmSync(TEST_SNAPSHOT_DIR, { recursive: true });
    }
  });

  describe("getSnapshotPath", () => {
    test("generates correct path for scenario with adapter", () => {
      const path = getSnapshotPath("representative/simple/small", "shopify", TEST_SNAPSHOT_DIR);
      expect(path).toBe(join(TEST_SNAPSHOT_DIR, "representative/simple/small", "shopify.snap"));
    });

    test("generates correct path for nested scenario", () => {
      const path = getSnapshotPath("unit/tags/for/medium", "keepsuit", TEST_SNAPSHOT_DIR);
      expect(path).toBe(join(TEST_SNAPSHOT_DIR, "unit/tags/for/medium", "keepsuit.snap"));
    });

    test("generates correct path for deeply nested scenario", () => {
      const path = getSnapshotPath("unit/filters/array/map/large", "kalimatas", TEST_SNAPSHOT_DIR);
      expect(path).toBe(join(TEST_SNAPSHOT_DIR, "unit/filters/array/map/large", "kalimatas.snap"));
    });
  });

  describe("saveSnapshot", () => {
    test("saves snapshot content to file", async () => {
      const key = "test/save-basic/small";
      const adapter = "shopify";
      const content = "<h1>Hello World</h1>";

      await saveSnapshot(key, adapter, content, TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(key, adapter, TEST_SNAPSHOT_DIR);
      expect(existsSync(path)).toBe(true);

      const savedContent = await Bun.file(path).text();
      expect(savedContent).toBe(content);
    });

    test("creates nested directories if they do not exist", async () => {
      const key = "deeply/nested/path/scenario/small";
      const adapter = "keepsuit";
      const content = "nested content";

      await saveSnapshot(key, adapter, content, TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(key, adapter, TEST_SNAPSHOT_DIR);
      expect(existsSync(path)).toBe(true);
    });

    test("overwrites existing snapshot", async () => {
      const key = "test/overwrite/small";
      const adapter = "shopify";
      const originalContent = "original";
      const newContent = "updated";

      await saveSnapshot(key, adapter, originalContent, TEST_SNAPSHOT_DIR);
      await saveSnapshot(key, adapter, newContent, TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(key, adapter, TEST_SNAPSHOT_DIR);
      const savedContent = await Bun.file(path).text();
      expect(savedContent).toBe(newContent);
    });

    test("handles multiline content", async () => {
      const key = "test/multiline/medium";
      const adapter = "kalimatas";
      const content = `<html>
  <body>
    <h1>Title</h1>
    <p>Content</p>
  </body>
</html>`;

      await saveSnapshot(key, adapter, content, TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(key, adapter, TEST_SNAPSHOT_DIR);
      const savedContent = await Bun.file(path).text();
      expect(savedContent).toBe(content);
    });

    test("handles unicode content", async () => {
      const key = "test/unicode/small";
      const adapter = "shopify";
      const content = "こんにちは世界 🌍 مرحبا";

      await saveSnapshot(key, adapter, content, TEST_SNAPSHOT_DIR);

      const path = getSnapshotPath(key, adapter, TEST_SNAPSHOT_DIR);
      const savedContent = await Bun.file(path).text();
      expect(savedContent).toBe(content);
    });

    test("saves different adapters to separate files", async () => {
      const key = "test/multi-adapter/small";
      const content1 = "shopify output";
      const content2 = "keepsuit output";

      await saveSnapshot(key, "shopify", content1, TEST_SNAPSHOT_DIR);
      await saveSnapshot(key, "keepsuit", content2, TEST_SNAPSHOT_DIR);

      const path1 = getSnapshotPath(key, "shopify", TEST_SNAPSHOT_DIR);
      const path2 = getSnapshotPath(key, "keepsuit", TEST_SNAPSHOT_DIR);

      expect(existsSync(path1)).toBe(true);
      expect(existsSync(path2)).toBe(true);

      const saved1 = await Bun.file(path1).text();
      const saved2 = await Bun.file(path2).text();

      expect(saved1).toBe(content1);
      expect(saved2).toBe(content2);
    });
  });

  describe("loadSnapshot", () => {
    test("loads existing snapshot", async () => {
      const key = "test/load-existing/small";
      const adapter = "shopify";
      const content = "existing content";

      await saveSnapshot(key, adapter, content, TEST_SNAPSHOT_DIR);
      const loaded = await loadSnapshot(key, adapter, TEST_SNAPSHOT_DIR);

      expect(loaded).toBe(content);
    });

    test("returns null for non-existent snapshot", async () => {
      const loaded = await loadSnapshot("nonexistent/scenario/small", "shopify", TEST_SNAPSHOT_DIR);
      expect(loaded).toBeNull();
    });

    test("preserves whitespace", async () => {
      const key = "test/whitespace/medium";
      const adapter = "keepsuit";
      const content = "  leading and trailing spaces  \n\n  with newlines  ";

      await saveSnapshot(key, adapter, content, TEST_SNAPSHOT_DIR);
      const loaded = await loadSnapshot(key, adapter, TEST_SNAPSHOT_DIR);

      expect(loaded).toBe(content);
    });

    test("loads correct adapter snapshot", async () => {
      const key = "test/load-adapter/small";

      await saveSnapshot(key, "shopify", "shopify output", TEST_SNAPSHOT_DIR);
      await saveSnapshot(key, "keepsuit", "keepsuit output", TEST_SNAPSHOT_DIR);

      const shopifySnap = await loadSnapshot(key, "shopify", TEST_SNAPSHOT_DIR);
      const keepsuitSnap = await loadSnapshot(key, "keepsuit", TEST_SNAPSHOT_DIR);

      expect(shopifySnap).toBe("shopify output");
      expect(keepsuitSnap).toBe("keepsuit output");
    });
  });

  describe("snapshotExists", () => {
    test("returns true for existing snapshot", async () => {
      const key = "test/exists-check/small";
      const adapter = "shopify";
      await saveSnapshot(key, adapter, "content", TEST_SNAPSHOT_DIR);

      expect(snapshotExists(key, adapter, TEST_SNAPSHOT_DIR)).toBe(true);
    });

    test("returns false for non-existent snapshot", () => {
      expect(snapshotExists("nonexistent/check/small", "shopify", TEST_SNAPSHOT_DIR)).toBe(false);
    });

    test("returns false for different adapter", async () => {
      const key = "test/adapter-check/small";
      await saveSnapshot(key, "shopify", "content", TEST_SNAPSHOT_DIR);

      expect(snapshotExists(key, "shopify", TEST_SNAPSHOT_DIR)).toBe(true);
      expect(snapshotExists(key, "keepsuit", TEST_SNAPSHOT_DIR)).toBe(false);
    });
  });

  describe("concurrent access", () => {
    test("concurrent saveSnapshot calls to different adapters don't interfere", async () => {
      const key = "test/concurrent/small";

      // Parallel writes to different adapter files
      await Promise.all([
        saveSnapshot(key, "shopify", "shopify content", TEST_SNAPSHOT_DIR),
        saveSnapshot(key, "keepsuit", "keepsuit content", TEST_SNAPSHOT_DIR),
        saveSnapshot(key, "kalimatas", "kalimatas content", TEST_SNAPSHOT_DIR),
      ]);

      // All should succeed and have correct content
      const shopify = await loadSnapshot(key, "shopify", TEST_SNAPSHOT_DIR);
      const keepsuit = await loadSnapshot(key, "keepsuit", TEST_SNAPSHOT_DIR);
      const kalimatas = await loadSnapshot(key, "kalimatas", TEST_SNAPSHOT_DIR);

      expect(shopify).toBe("shopify content");
      expect(keepsuit).toBe("keepsuit content");
      expect(kalimatas).toBe("kalimatas content");
    });

    test("concurrent loadSnapshot calls return correct content", async () => {
      const key = "test/concurrent-load/small";

      // Setup
      await saveSnapshot(key, "shopify", "shopify data", TEST_SNAPSHOT_DIR);
      await saveSnapshot(key, "keepsuit", "keepsuit data", TEST_SNAPSHOT_DIR);

      // Parallel reads
      const [shopify, keepsuit] = await Promise.all([
        loadSnapshot(key, "shopify", TEST_SNAPSHOT_DIR),
        loadSnapshot(key, "keepsuit", TEST_SNAPSHOT_DIR),
      ]);

      expect(shopify).toBe("shopify data");
      expect(keepsuit).toBe("keepsuit data");
    });
  });

  describe("path handling", () => {
    test("handles scenario names with hyphens", async () => {
      const key = "unit/tags/for-each/small";
      const adapter = "shopify";

      await saveSnapshot(key, adapter, "content", TEST_SNAPSHOT_DIR);
      const loaded = await loadSnapshot(key, adapter, TEST_SNAPSHOT_DIR);

      expect(loaded).toBe("content");
    });

    test("handles scenario names with underscores", async () => {
      const key = "unit/filters/split_join/small";
      const adapter = "shopify";

      await saveSnapshot(key, adapter, "content", TEST_SNAPSHOT_DIR);
      const loaded = await loadSnapshot(key, adapter, TEST_SNAPSHOT_DIR);

      expect(loaded).toBe("content");
    });

    test("getSnapshotPath generates safe paths within snapshot directory", () => {
      // Verify paths stay within the snapshot directory
      const normalPath = getSnapshotPath("unit/tags/for/small", "shopify", TEST_SNAPSHOT_DIR);

      expect(normalPath.startsWith(TEST_SNAPSHOT_DIR)).toBe(true);
      expect(normalPath).toContain("shopify.snap");
    });

    test("snapshot path does not escape base directory with normal input", () => {
      const path = getSnapshotPath("unit/tags/for/small", "shopify", TEST_SNAPSHOT_DIR);

      // Path should be: TEST_SNAPSHOT_DIR/unit/tags/for/small/shopify.snap
      expect(path).toBe(join(TEST_SNAPSHOT_DIR, "unit/tags/for/small", "shopify.snap"));
      expect(path.startsWith(TEST_SNAPSHOT_DIR)).toBe(true);
    });
  });
});
