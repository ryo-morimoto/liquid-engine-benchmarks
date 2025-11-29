/**
 * Unit tests for CLI error definitions
 *
 * Tests CliError class and Errors factory functions.
 * Verifies both human-readable and JSON output formats.
 */

import { describe, expect, test } from "bun:test";
import { CliError, ErrorCode, Errors } from "./errors";

describe("CliError", () => {
  describe("constructor", () => {
    test("creates error with required fields", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
      });

      expect(error.code).toBe("RUNTIME_NOT_FOUND");
      expect(error.message).toBe("php not found");
      expect(error.name).toBe("CliError");
    });

    test("creates error with optional fields", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
        details: { runtime: "php" },
        suggestion: "Install PHP 8.3+",
      });

      expect(error.details).toEqual({ runtime: "php" });
      expect(error.suggestion).toBe("Install PHP 8.3+");
    });

    test("extends Error properly", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "test error",
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CliError);
    });

    test("has stack trace", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "test error",
      });

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("CliError");
    });

    test("can be thrown and caught", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "test error",
      });

      expect(() => {
        throw error;
      }).toThrow(CliError);
    });

    test("preserves code as readonly", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "test",
      });

      // TypeScript should prevent this at compile time
      // At runtime, we just verify the value is preserved
      expect(error.code).toBe("RUNTIME_NOT_FOUND");
    });
  });

  describe("toHuman", () => {
    test("returns error message with prefix", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
      });

      const human = error.toHuman();
      expect(human).toContain("error:");
      expect(human).toContain("php not found");
    });

    test("does not include details or suggestion", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
        details: { runtime: "php" },
        suggestion: "Install PHP",
      });

      const human = error.toHuman();
      expect(human).toContain("php not found");
      expect(human).not.toContain("Install");
    });
  });

  describe("toJSON", () => {
    test("returns structured error object", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
      });

      const json = error.toJSON();

      expect(json).toEqual({
        success: false,
        error: {
          code: "RUNTIME_NOT_FOUND",
          message: "php not found",
        },
      });
    });

    test("includes details when present", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
        details: { runtime: "php", searched_paths: ["/usr/bin"] },
      });

      const json = error.toJSON() as { error: { details: unknown } };

      expect(json.error.details).toEqual({
        runtime: "php",
        searched_paths: ["/usr/bin"],
      });
    });

    test("includes suggestion when present", () => {
      const error = new CliError({
        code: ErrorCode.RUNTIME_NOT_FOUND,
        message: "php not found",
        suggestion: "Install PHP 8.3+",
      });

      const json = error.toJSON() as { error: { suggestion: string } };

      expect(json.error.suggestion).toBe("Install PHP 8.3+");
    });

    test("produces valid JSON string", () => {
      const error = new CliError({
        code: ErrorCode.ADAPTER_CRASHED,
        message: "adapter crashed",
        details: { stderr: "error output" },
      });

      const jsonString = JSON.stringify(error.toJSON());
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    test("handles special characters in message", () => {
      const error = new CliError({
        code: ErrorCode.ADAPTER_CRASHED,
        message: 'Error: "unexpected token" at line 1',
        details: { stderr: "line\nwith\nnewlines" },
      });

      const jsonString = JSON.stringify(error.toJSON());
      const parsed = JSON.parse(jsonString);

      expect(parsed.error.message).toBe('Error: "unexpected token" at line 1');
      expect(parsed.error.details.stderr).toBe("line\nwith\nnewlines");
    });

    test("handles unicode in message", () => {
      const error = new CliError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "エラー: 予期しないトークン",
      });

      const jsonString = JSON.stringify(error.toJSON());
      const parsed = JSON.parse(jsonString);

      expect(parsed.error.message).toBe("エラー: 予期しないトークン");
    });

    test("handles empty details object", () => {
      const error = new CliError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "error",
        details: {},
      });

      const json = error.toJSON() as { error: { details: unknown } };
      expect(json.error.details).toEqual({});
    });

    test("handles nested details", () => {
      const error = new CliError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "error",
        details: {
          nested: { level1: { level2: "value" } },
          array: [1, 2, 3],
        },
      });

      const json = error.toJSON() as { error: { details: Record<string, unknown> } };
      expect(json.error.details.nested).toEqual({ level1: { level2: "value" } });
      expect(json.error.details.array).toEqual([1, 2, 3]);
    });
  });
});

describe("ErrorCode", () => {
  test("has environment error codes", () => {
    expect(ErrorCode.RUNTIME_NOT_FOUND).toBe("RUNTIME_NOT_FOUND");
    expect(ErrorCode.RUNTIME_VERSION_MISMATCH).toBe("RUNTIME_VERSION_MISMATCH");
    expect(ErrorCode.DEPS_NOT_INSTALLED).toBe("DEPS_NOT_INSTALLED");
  });

  test("has adapter error codes", () => {
    expect(ErrorCode.ADAPTER_NOT_FOUND).toBe("ADAPTER_NOT_FOUND");
    expect(ErrorCode.ADAPTER_SCRIPT_MISSING).toBe("ADAPTER_SCRIPT_MISSING");
    expect(ErrorCode.ADAPTER_TIMEOUT).toBe("ADAPTER_TIMEOUT");
    expect(ErrorCode.ADAPTER_CRASHED).toBe("ADAPTER_CRASHED");
    expect(ErrorCode.ADAPTER_INVALID_OUTPUT).toBe("ADAPTER_INVALID_OUTPUT");
  });

  test("has input error codes", () => {
    expect(ErrorCode.SCENARIO_NOT_FOUND).toBe("SCENARIO_NOT_FOUND");
    expect(ErrorCode.INVALID_ARGUMENT).toBe("INVALID_ARGUMENT");
  });

  test("has internal error code", () => {
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });

  test("all error codes are unique strings", () => {
    const codes = Object.values(ErrorCode);
    const uniqueCodes = new Set(codes);

    expect(codes.length).toBe(uniqueCodes.size);

    for (const code of codes) {
      expect(typeof code).toBe("string");
      expect(code.length).toBeGreaterThan(0);
    }
  });
});

describe("Errors factory", () => {
  describe("runtimeNotFound", () => {
    test("creates error for PHP with correct code", () => {
      const error = Errors.runtimeNotFound("php", "php not found in PATH");

      expect(error.code).toBe("RUNTIME_NOT_FOUND");
      expect(error.message).toContain("php");
      expect(error.message).toContain("not found");
      expect(error.suggestion).toContain("PHP");
    });

    test("creates error for Ruby with correct code", () => {
      const error = Errors.runtimeNotFound("ruby", "ruby exited with code 127");

      expect(error.code).toBe("RUNTIME_NOT_FOUND");
      expect(error.message).toContain("ruby");
      expect(error.suggestion).toContain("Ruby");
    });

    test("includes reason in details", () => {
      const error = Errors.runtimeNotFound("php", "specific error reason");

      expect(error.details).toBeDefined();
      const details = error.details as Record<string, unknown>;
      expect(details.reason).toBe("specific error reason");
    });
  });

  describe("runtimeVersionMismatch", () => {
    test("creates error with version info", () => {
      const error = Errors.runtimeVersionMismatch("php", "8.3", "8.1");

      expect(error.code).toBe("RUNTIME_VERSION_MISMATCH");
      expect(error.message).toContain("8.3");
      expect(error.message).toContain("8.1");
    });

    test("includes version details", () => {
      const error = Errors.runtimeVersionMismatch("php", "8.3", "8.1");

      expect(error.details).toBeDefined();
      const details = error.details as Record<string, unknown>;
      expect(details.required_version).toBe("8.3");
      expect(details.found_version).toBe("8.1");
    });
  });

  describe("depsNotInstalled", () => {
    test("creates error for PHP deps", () => {
      const error = Errors.depsNotInstalled("php", "composer install");

      expect(error.code).toBe("DEPS_NOT_INSTALLED");
      expect(error.message).toContain("php");
      expect(error.suggestion).toContain("composer install");
    });

    test("creates error for Ruby deps", () => {
      const error = Errors.depsNotInstalled("ruby", "bundle install");

      expect(error.code).toBe("DEPS_NOT_INSTALLED");
      expect(error.suggestion).toContain("bundle install");
    });
  });

  describe("adapterScriptMissing", () => {
    test("creates error with adapter name", () => {
      const error = Errors.adapterScriptMissing("keepsuit", "/path/to/keepsuit.php");

      expect(error.code).toBe("ADAPTER_SCRIPT_MISSING");
      expect(error.message).toContain("keepsuit");
    });

    test("includes path in details", () => {
      const error = Errors.adapterScriptMissing("keepsuit", "/path/to/keepsuit.php");

      expect(error.details).toBeDefined();
      const details = error.details as Record<string, unknown>;
      expect(details.expected_path).toBe("/path/to/keepsuit.php");
    });
  });

  describe("adapterTimeout", () => {
    test("creates error with adapter name", () => {
      const error = Errors.adapterTimeout("shopify", 300000);

      expect(error.code).toBe("ADAPTER_TIMEOUT");
      expect(error.message).toContain("shopify");
      expect(error.message).toContain("timed out");
    });

    test("includes timeout in details", () => {
      const error = Errors.adapterTimeout("shopify", 300000);

      expect(error.details).toBeDefined();
      const details = error.details as Record<string, unknown>;
      expect(details.timeout_ms).toBe(300000);
    });
  });

  describe("adapterCrashed", () => {
    test("creates error with exit code", () => {
      const error = Errors.adapterCrashed("kalimatas", 1, "Parse error");

      expect(error.code).toBe("ADAPTER_CRASHED");
      expect(error.message).toContain("kalimatas");
      expect(error.message).toContain("1");
    });

    test("truncates long stderr to reasonable length", () => {
      const longStderr = "x".repeat(1000);
      const error = Errors.adapterCrashed("test", 1, longStderr);

      const details = error.details as { stderr: string };
      // Should be truncated, but don't assert specific length
      expect(details.stderr.length).toBeLessThan(longStderr.length);
    });
  });

  describe("scenarioNotFound", () => {
    test("creates error with scenario path", () => {
      const error = Errors.scenarioNotFound("nonexistent/scenario");

      expect(error.code).toBe("SCENARIO_NOT_FOUND");
      expect(error.message).toContain("nonexistent/scenario");
    });

    test("has helpful suggestion", () => {
      const error = Errors.scenarioNotFound("nonexistent/scenario");

      expect(error.suggestion).toBeDefined();
      expect(error.suggestion).toContain("list");
    });
  });

  describe("invalidArgument", () => {
    test("creates error with argument name", () => {
      const error = Errors.invalidArgument("--scale", "must be one of: small, medium, large");

      expect(error.code).toBe("INVALID_ARGUMENT");
      expect(error.message).toContain("--scale");
    });

    test("includes reason in details", () => {
      const error = Errors.invalidArgument("--scale", "must be one of: small, medium, large");

      expect(error.details).toBeDefined();
      const details = error.details as Record<string, unknown>;
      expect(details.argument).toBe("--scale");
      expect(details.reason).toContain("small");
    });
  });

  describe("all factory functions", () => {
    test("produce CliError instances", () => {
      const errors = [
        Errors.runtimeNotFound("php", "not found"),
        Errors.runtimeVersionMismatch("php", "8.3", "8.1"),
        Errors.depsNotInstalled("php", "composer install"),
        Errors.adapterScriptMissing("test", "/path"),
        Errors.adapterTimeout("test", 1000),
        Errors.adapterCrashed("test", 1, "error"),
        Errors.scenarioNotFound("test/path"),
        Errors.invalidArgument("--arg", "reason"),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(CliError);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test("all produce valid JSON", () => {
      const errors = [
        Errors.runtimeNotFound("php", "not found"),
        Errors.runtimeVersionMismatch("php", "8.3", "8.1"),
        Errors.depsNotInstalled("php", "composer install"),
        Errors.adapterScriptMissing("test", "/path"),
        Errors.adapterTimeout("test", 1000),
        Errors.adapterCrashed("test", 1, "error"),
        Errors.scenarioNotFound("test/path"),
        Errors.invalidArgument("--arg", "reason"),
      ];

      for (const error of errors) {
        const json = error.toJSON();
        expect(json).toHaveProperty("success", false);
        expect(json).toHaveProperty("error");

        // Verify it can be stringified and parsed
        const str = JSON.stringify(json);
        expect(() => JSON.parse(str)).not.toThrow();
      }
    });

    test("all produce human-readable messages", () => {
      const errors = [
        Errors.runtimeNotFound("php", "not found"),
        Errors.runtimeVersionMismatch("php", "8.3", "8.1"),
        Errors.depsNotInstalled("php", "composer install"),
        Errors.adapterScriptMissing("test", "/path"),
        Errors.adapterTimeout("test", 1000),
        Errors.adapterCrashed("test", 1, "error"),
        Errors.scenarioNotFound("test/path"),
        Errors.invalidArgument("--arg", "reason"),
      ];

      for (const error of errors) {
        const human = error.toHuman();
        expect(human).toMatch(/^error:/);
        expect(human.length).toBeGreaterThan(7); // "error: " + something
      }
    });
  });
});
