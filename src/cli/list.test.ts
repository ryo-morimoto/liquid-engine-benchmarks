/**
 * Unit tests for list CLI command
 *
 * Tests argument parsing for the list subcommand.
 * The list command outputs adapters or scenarios for shell composition.
 */

import { describe, expect, test, spyOn, beforeEach, afterEach } from "bun:test";
import { parseArgs_ } from "./list";

describe("parseArgs_", () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Prevent actual process.exit during tests
    exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    errorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe("target argument", () => {
    test("parses 'adapters' as target", () => {
      const result = parseArgs_(["adapters"]);

      expect(result.target).toBe("adapters");
    });

    test("parses 'scenarios' as target", () => {
      const result = parseArgs_(["scenarios"]);

      expect(result.target).toBe("scenarios");
    });

    test("exits with error when target is missing", () => {
      expect(() => parseArgs_([])).toThrow("process.exit called");
      expect(errorSpy).toHaveBeenCalledWith("Error: <target> is required");
    });

    test("exits with error for unknown target", () => {
      expect(() => parseArgs_(["unknown"])).toThrow("process.exit called");
      expect(errorSpy).toHaveBeenCalledWith('Error: Unknown target "unknown"');
    });
  });

  describe("category option", () => {
    test("parses --category with long flag", () => {
      const result = parseArgs_(["scenarios", "--category", "unit/tags"]);

      expect(result.target).toBe("scenarios");
      expect(result.category).toBe("unit/tags");
    });

    test("parses -c with short flag", () => {
      const result = parseArgs_(["scenarios", "-c", "composite"]);

      expect(result.target).toBe("scenarios");
      expect(result.category).toBe("composite");
    });

    test("category is undefined when not specified", () => {
      const result = parseArgs_(["scenarios"]);

      expect(result.category).toBeUndefined();
    });

    test("category works with adapters target (even if not meaningful)", () => {
      // Category option is parsed but ignored for adapters target
      const result = parseArgs_(["adapters", "-c", "unit/tags"]);

      expect(result.target).toBe("adapters");
      expect(result.category).toBe("unit/tags");
    });
  });

  describe("flag position flexibility", () => {
    test("category flag after target", () => {
      const result = parseArgs_(["scenarios", "-c", "unit/filters"]);

      expect(result.target).toBe("scenarios");
      expect(result.category).toBe("unit/filters");
    });

    test("handles nested category paths", () => {
      const result = parseArgs_(["scenarios", "-c", "unit/tags"]);

      expect(result.category).toBe("unit/tags");
    });
  });
});
