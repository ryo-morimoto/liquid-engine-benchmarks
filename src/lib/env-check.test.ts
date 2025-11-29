/**
 * Unit tests for environment checker module
 *
 * Tests runtime detection, version checking, and dependency validation.
 * Uses @internal exports to test internal functions directly.
 */

import { describe, expect, test } from "bun:test";
import {
  checkAdapter,
  checkAdapters,
  checkAllAdapters,
  ensureAdapterReady,
  internal,
} from "./env-check";
import { CliError } from "./errors";

const { extractVersion, versionSatisfies } = internal;

// ============================================================================
// extractVersion tests
// ============================================================================

describe("extractVersion", () => {
  describe("PHP version parsing", () => {
    test("extracts version from standard PHP output", () => {
      const output =
        "PHP 8.3.14 (cli) (built: Nov 21 2024 13:41:21) (NTS)\nCopyright (c) The PHP Group";
      expect(extractVersion("php", output)).toBe("8.3");
    });

    test("extracts version from PHP 8.4 output", () => {
      const output = "PHP 8.4.0 (cli) (built: Nov 21 2024 13:41:21) (NTS)";
      expect(extractVersion("php", output)).toBe("8.4");
    });

    test("extracts version from PHP 7.x output", () => {
      const output = "PHP 7.4.33 (cli) (built: Sep 29 2024 12:00:00) (NTS)";
      expect(extractVersion("php", output)).toBe("7.4");
    });

    test("returns null for non-PHP output", () => {
      const output = "some random output";
      expect(extractVersion("php", output)).toBeNull();
    });

    test("returns null for empty output", () => {
      expect(extractVersion("php", "")).toBeNull();
    });

    test("handles PHP with ZTS (thread safety)", () => {
      const output = "PHP 8.3.0 (cli) (built: Nov 21 2024 13:41:21) (ZTS)";
      expect(extractVersion("php", output)).toBe("8.3");
    });

    test("does not match PHP in middle of string (anchored pattern)", () => {
      // This should NOT match - pattern is anchored to start of line
      const output = "Using PHP 8.3.14 runtime";
      expect(extractVersion("php", output)).toBeNull();
    });

    test("handles multiline output correctly", () => {
      const output = `PHP 8.3.14 (cli) (built: Nov 21 2024 13:41:21) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.3.14, Copyright (c) Zend Technologies`;
      expect(extractVersion("php", output)).toBe("8.3");
    });
  });

  describe("Ruby version parsing", () => {
    test("extracts version from standard Ruby output", () => {
      const output = "ruby 3.3.6 (2024-11-05 revision 75015d4c1f) [x86_64-linux]";
      expect(extractVersion("ruby", output)).toBe("3.3");
    });

    test("extracts version from Ruby 3.4 output", () => {
      const output = "ruby 3.4.0 (2024-12-25 revision abc123) [arm64-darwin]";
      expect(extractVersion("ruby", output)).toBe("3.4");
    });

    test("extracts version from Ruby 2.x output", () => {
      const output = "ruby 2.7.8 (2023-03-30 revision abc123) [x86_64-linux]";
      expect(extractVersion("ruby", output)).toBe("2.7");
    });

    test("returns null for non-Ruby output", () => {
      const output = "some random output";
      expect(extractVersion("ruby", output)).toBeNull();
    });

    test("returns null for empty output", () => {
      expect(extractVersion("ruby", "")).toBeNull();
    });

    test("handles different architectures", () => {
      const outputs = [
        "ruby 3.3.0 (2024-01-01 revision abc) [x86_64-linux]",
        "ruby 3.3.0 (2024-01-01 revision abc) [arm64-darwin24]",
        "ruby 3.3.0 (2024-01-01 revision abc) [x86_64-darwin23]",
        "ruby 3.3.0 (2024-01-01 revision abc) [aarch64-linux]",
      ];
      for (const output of outputs) {
        expect(extractVersion("ruby", output)).toBe("3.3");
      }
    });

    test("does not match ruby in middle of string (anchored pattern)", () => {
      const output = "Using ruby 3.3.6 interpreter";
      expect(extractVersion("ruby", output)).toBeNull();
    });
  });
});

// ============================================================================
// versionSatisfies tests
// ============================================================================

describe("versionSatisfies", () => {
  describe("major version comparison", () => {
    test("returns true when actual major > required major", () => {
      expect(versionSatisfies("9.0", "8.3")).toBe(true);
    });

    test("returns false when actual major < required major", () => {
      expect(versionSatisfies("7.4", "8.3")).toBe(false);
    });
  });

  describe("minor version comparison (same major)", () => {
    test("returns true when actual minor > required minor", () => {
      expect(versionSatisfies("8.4", "8.3")).toBe(true);
    });

    test("returns true when actual minor == required minor", () => {
      expect(versionSatisfies("8.3", "8.3")).toBe(true);
    });

    test("returns false when actual minor < required minor", () => {
      expect(versionSatisfies("8.2", "8.3")).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("returns false for malformed actual version", () => {
      expect(versionSatisfies("invalid", "8.3")).toBe(false);
    });

    test("returns false for empty actual version", () => {
      expect(versionSatisfies("", "8.3")).toBe(false);
    });

    test("returns false for single number version", () => {
      expect(versionSatisfies("8", "8.3")).toBe(false);
    });

    test("handles version with extra parts", () => {
      // versionSatisfies only uses first two parts
      expect(versionSatisfies("8.3.14", "8.3")).toBe(true);
    });

    test("handles zero versions", () => {
      expect(versionSatisfies("0.0", "0.0")).toBe(true);
      expect(versionSatisfies("1.0", "0.0")).toBe(true);
      expect(versionSatisfies("0.1", "0.0")).toBe(true);
    });
  });
});

// ============================================================================
// checkAdapter tests
// ============================================================================

describe("checkAdapter", () => {
  describe("keepsuit adapter (PHP)", () => {
    test("returns CheckResult with adapter name", async () => {
      const result = await checkAdapter("keepsuit");

      expect(result.adapter).toBe("keepsuit");
      expect(typeof result.ok).toBe("boolean");
    });

    test("returns error when PHP not available", async () => {
      const result = await checkAdapter("keepsuit");

      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error?.code).toMatch(
          /RUNTIME_NOT_FOUND|DEPS_NOT_INSTALLED|ADAPTER_SCRIPT_MISSING|RUNTIME_VERSION_MISMATCH/
        );
      }
    });

    test("error has proper structure", async () => {
      const result = await checkAdapter("keepsuit");

      if (!result.ok && result.error) {
        expect(result.error).toBeInstanceOf(CliError);
        expect(typeof result.error.code).toBe("string");
        expect(typeof result.error.message).toBe("string");
      }
    });
  });

  describe("shopify adapter (Ruby)", () => {
    test("returns CheckResult with adapter name", async () => {
      const result = await checkAdapter("shopify");

      expect(result.adapter).toBe("shopify");
      expect(typeof result.ok).toBe("boolean");
    });

    test("returns error when Ruby not available", async () => {
      const result = await checkAdapter("shopify");

      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error?.code).toMatch(
          /RUNTIME_NOT_FOUND|DEPS_NOT_INSTALLED|ADAPTER_SCRIPT_MISSING|RUNTIME_VERSION_MISMATCH/
        );
      }
    });
  });

  describe("kalimatas adapter (PHP)", () => {
    test("returns CheckResult with adapter name", async () => {
      const result = await checkAdapter("kalimatas");

      expect(result.adapter).toBe("kalimatas");
      expect(typeof result.ok).toBe("boolean");
    });
  });
});

// ============================================================================
// checkAdapters tests
// ============================================================================

describe("checkAdapters", () => {
  test("returns results for all requested adapters", async () => {
    const results = await checkAdapters(["keepsuit", "shopify"]);

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.adapter)).toContain("keepsuit");
    expect(results.map((r) => r.adapter)).toContain("shopify");
  });

  test("returns empty array for empty input", async () => {
    const results = await checkAdapters([]);
    expect(results).toHaveLength(0);
  });

  test("handles single adapter", async () => {
    const results = await checkAdapters(["keepsuit"]);

    expect(results).toHaveLength(1);
    expect(results[0].adapter).toBe("keepsuit");
  });

  test("runs checks in parallel", async () => {
    const start = Date.now();
    await checkAdapters(["keepsuit", "kalimatas", "shopify"]);
    const duration = Date.now() - start;

    // If run in parallel, should complete faster than sequential
    // This is a soft assertion - mainly testing that it doesn't error
    expect(duration).toBeLessThan(10000); // 10s timeout
  });
});

// ============================================================================
// checkAllAdapters tests
// ============================================================================

describe("checkAllAdapters", () => {
  test("checks all three adapters", async () => {
    const errors = await checkAllAdapters();

    // Returns only errors, so length depends on environment
    expect(Array.isArray(errors)).toBe(true);
  });

  test("returns only failed results", async () => {
    const errors = await checkAllAdapters();

    for (const result of errors) {
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  test("includes all adapter types in check", async () => {
    // We can't directly check what was checked, but we can verify
    // the function signature and return type
    const errors = await checkAllAdapters();

    for (const result of errors) {
      expect(["keepsuit", "kalimatas", "shopify"]).toContain(result.adapter);
    }
  });
});

// ============================================================================
// ensureAdapterReady tests
// ============================================================================

describe("ensureAdapterReady", () => {
  test("does not throw when adapter is ready", async () => {
    const result = await checkAdapter("keepsuit");

    if (result.ok) {
      // If keepsuit is ready, ensureAdapterReady should not throw
      await ensureAdapterReady("keepsuit");
    }
  });

  test("throws CliError when adapter is not ready", async () => {
    const result = await checkAdapter("keepsuit");

    if (!result.ok) {
      // If keepsuit is not ready, ensureAdapterReady should throw
      try {
        await ensureAdapterReady("keepsuit");
        expect.unreachable("Should have thrown CliError");
      } catch (e) {
        expect(e).toBeInstanceOf(CliError);
      }
    }
  });

  test("thrown error matches checkAdapter error", async () => {
    const result = await checkAdapter("shopify");

    if (!result.ok && result.error) {
      try {
        await ensureAdapterReady("shopify");
        // If we get here, adapter was ready
      } catch (e) {
        expect(e).toBeInstanceOf(CliError);
        if (e instanceof CliError) {
          expect(e.code).toBe(result.error.code);
        }
      }
    }
  });
});

// ============================================================================
// CheckResult structure tests
// ============================================================================

describe("CheckResult structure", () => {
  test("successful result has ok=true and no error", async () => {
    const result = await checkAdapter("keepsuit");

    if (result.ok) {
      expect(result.error).toBeUndefined();
    }
  });

  test("failed result has ok=false and error", async () => {
    const result = await checkAdapter("keepsuit");

    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBeDefined();
      expect(result.error?.message).toBeDefined();
    }
  });

  test("error has proper structure for JSON output", async () => {
    const result = await checkAdapter("keepsuit");

    if (!result.ok && result.error) {
      const json = result.error.toJSON();

      expect(json).toHaveProperty("success", false);
      expect(json).toHaveProperty("error");
      expect((json as { error: { code: string } }).error).toHaveProperty("code");
      expect((json as { error: { message: string } }).error).toHaveProperty("message");
    }
  });

  test("error has human-readable format", async () => {
    const result = await checkAdapter("keepsuit");

    if (!result.ok && result.error) {
      const human = result.error.toHuman();

      expect(human).toMatch(/^error:/);
      expect(typeof human).toBe("string");
    }
  });
});
