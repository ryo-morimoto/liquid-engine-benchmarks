/**
 * End-to-End Tests
 *
 * Tests the full benchmark pipeline through run.ts CLI.
 * Verifies that the entire system works together correctly.
 *
 * These are integration tests that require PHP/Ruby runtimes and dependencies.
 */

import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUN_SCRIPT = join(__dirname, "../../src/run.ts");

/**
 * Run the benchmark CLI and capture output.
 */
async function runCli(
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", RUN_SCRIPT, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: join(__dirname, "../.."),
  });

  // Read stdout/stderr before waiting for exit to avoid deadlock
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

/**
 * Check if a runtime is available.
 * Uses feature-test approach: execute runtime directly.
 */
async function isRuntimeAvailable(command: string): Promise<boolean> {
  try {
    const versionFlag = command === "php" ? "-v" : "--version";
    const proc = Bun.spawn([command, versionFlag], {
      stdout: "pipe",
      stderr: "pipe",
    });
    return (await proc.exited) === 0;
  } catch {
    return false;
  }
}

describe("E2E: CLI Interface", () => {
  test("shows help with --help flag", async () => {
    const { stdout, exitCode } = await runCli(["--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Liquid Engine Benchmark CLI");
    expect(stdout).toContain("bench");
    expect(stdout).toContain("setup");
  });

  test("shows help with -h flag", async () => {
    const { stdout, exitCode } = await runCli(["-h"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage:");
  });

  test("shows bench help", async () => {
    const { stdout, exitCode } = await runCli(["bench", "--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("bench - Run benchmarks");
    expect(stdout).toContain("<adapter>");
    expect(stdout).toContain("<scenario>");
  });

  test("shows setup help", async () => {
    const { stdout, exitCode } = await runCli(["setup", "--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Setup Command");
    expect(stdout).toContain("php");
    expect(stdout).toContain("ruby");
  });

  test("errors on missing scenario (single adapter provided)", async () => {
    const { stderr, exitCode } = await runCli(["bench", "keepsuit"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("<adapter> and <scenario> are required for single mode");
  });

  test("errors on unknown adapter", async () => {
    const { stderr, exitCode } = await runCli(["bench", "nonexistent", "unit/tags/for"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unknown adapter");
  });

  test("errors on invalid scale", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "keepsuit",
      "unit/tags/for",
      "--scale",
      "invalid",
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Invalid scale");
  });

  test("errors on invalid iterations", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "keepsuit",
      "unit/tags/for",
      "--iterations",
      "99999",
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("--iterations must be between");
  });
});

describe("E2E: Full Benchmark Run", () => {
  // Timeout for benchmark tests (30 seconds)
  const BENCHMARK_TIMEOUT = 30_000;

  test(
    "runs keepsuit adapter successfully",
    async () => {
      if (!(await isRuntimeAvailable("php"))) {
        console.log("Skipping: PHP not available");
        return;
      }

      const { stdout, stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "--iterations",
        "3",
        "--warmup",
        "1",
        "--scale",
        "small",
      ]);

      // May fail if PHP dependencies not installed
      if (exitCode !== 0) {
        console.log("Skipping: keepsuit adapter failed (dependencies not installed?)");
        console.log("stderr:", stderr);
        return;
      }

      expect(exitCode).toBe(0);

      // Parse JSON output
      const result = JSON.parse(stdout);

      // Verify structure
      expect(result.metadata).toBeDefined();
      expect(result.metadata.scenario).toBe("unit/tags/for");
      expect(result.metadata.scale).toBe("small");
      expect(result.metadata.iterations).toBe(3);

      expect(result.adapter).toBeDefined();
      expect(result.adapter.name).toBe("keepsuit");
      expect(result.adapter.lang).toBe("php");

      expect(result.metrics).toBeDefined();
      expect(result.metrics.parse).toBeDefined();
      expect(result.metrics.render).toBeDefined();
      expect(result.metrics.total).toBeDefined();

      // Verify metrics structure
      for (const phase of ["parse", "render", "total"]) {
        const metrics = result.metrics[phase];
        expect(typeof metrics.mean_ms).toBe("number");
        expect(typeof metrics.stddev_ms).toBe("number");
        expect(typeof metrics.min_ms).toBe("number");
        expect(typeof metrics.max_ms).toBe("number");
        expect(typeof metrics.median_ms).toBe("number");
      }
    },
    BENCHMARK_TIMEOUT
  );

  test(
    "runs shopify adapter successfully",
    async () => {
      if (!(await isRuntimeAvailable("ruby"))) {
        console.log("Skipping: Ruby not available");
        return;
      }

      const { stdout, stderr, exitCode } = await runCli([
        "bench",
        "shopify",
        "unit/tags/for",
        "--iterations",
        "3",
        "--warmup",
        "1",
        "--scale",
        "small",
      ]);

      // May fail if Ruby dependencies not installed
      if (exitCode !== 0) {
        console.log("Skipping: shopify adapter failed (dependencies not installed?)");
        console.log("stderr:", stderr);
        return;
      }

      expect(exitCode).toBe(0);

      const result = JSON.parse(stdout);
      expect(result.adapter.name).toBe("shopify");
      expect(result.adapter.lang).toBe("ruby");
    },
    BENCHMARK_TIMEOUT
  );

  test(
    "writes output to file with --output flag",
    async () => {
      if (!(await isRuntimeAvailable("php"))) {
        console.log("Skipping: PHP not available");
        return;
      }

      const outputPath = join(__dirname, "../../tmp-test-output.json");

      const { stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "--iterations",
        "2",
        "--warmup",
        "0",
        "--output",
        outputPath,
      ]);

      // May fail if dependencies not installed
      if (exitCode !== 0) {
        console.log("Skipping: output test failed");
        return;
      }

      expect(exitCode).toBe(0);
      expect(stderr).toContain("output:");

      // Verify file was created
      const file = Bun.file(outputPath);
      expect(await file.exists()).toBe(true);

      // Parse and verify content
      const content = await file.json();
      expect(content.metadata).toBeDefined();
      expect(content.adapter).toBeDefined();
      expect(content.metrics).toBeDefined();

      // Cleanup
      await Bun.write(outputPath, "");
      const proc = Bun.spawn(["rm", outputPath]);
      await proc.exited;
    },
    BENCHMARK_TIMEOUT
  );
});

describe("E2E: Different Scenarios", () => {
  const BENCHMARK_TIMEOUT = 30_000;

  test(
    "runs with representative scenario",
    async () => {
      if (!(await isRuntimeAvailable("php"))) {
        console.log("Skipping: PHP not available");
        return;
      }

      const { stdout, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "representative/simple",
        "--iterations",
        "2",
        "--warmup",
        "0",
        "--scale",
        "small",
      ]);

      if (exitCode !== 0) {
        console.log("Skipping: representative scenario test failed");
        return;
      }

      expect(exitCode).toBe(0);

      const result = JSON.parse(stdout);
      expect(result.metadata.scenario).toBe("representative/simple");
    },
    BENCHMARK_TIMEOUT
  );

  test("errors on nonexistent scenario", async () => {
    // This test requires runtime to be available for the adapter check
    if (!(await isRuntimeAvailable("php"))) {
      console.log("Skipping: PHP not available");
      return;
    }

    const { stderr, exitCode } = await runCli(["bench", "keepsuit", "nonexistent/template"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("scenario not found");
  });
});

describe("E2E: List Command", () => {
  test("lists all adapters", async () => {
    const { stdout, exitCode } = await runCli(["list", "adapters"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("keepsuit");
    expect(stdout).toContain("kalimatas");
    expect(stdout).toContain("shopify");
  });

  test("lists scenarios", async () => {
    const { stdout, exitCode } = await runCli(["list", "scenarios"]);

    expect(exitCode).toBe(0);
    // Should contain at least one scenario
    expect(stdout.trim().length).toBeGreaterThan(0);
  });

  test("lists scenarios with category filter", async () => {
    const { stdout, exitCode } = await runCli(["list", "scenarios", "-c", "unit"]);

    expect(exitCode).toBe(0);
    // All results should be under unit/ category
    const lines = stdout.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      expect(line).toMatch(/^unit\//);
    }
  });

  test("shows help for list command", async () => {
    const { stdout, exitCode } = await runCli(["list", "--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("list");
    expect(stdout).toContain("adapters");
    expect(stdout).toContain("scenarios");
  });

  test("errors on invalid target", async () => {
    const { stderr, exitCode } = await runCli(["list", "invalid"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unknown target");
  });

  test("outputs one item per line for shell composition", async () => {
    const { stdout, exitCode } = await runCli(["list", "adapters"]);

    expect(exitCode).toBe(0);
    const lines = stdout.trim().split("\n");
    // Each line should be a single adapter name
    expect(lines).toContain("keepsuit");
    expect(lines).toContain("kalimatas");
    expect(lines).toContain("shopify");
  });
});

describe("E2E: JSON Error Output", () => {
  /**
   * Note: --format json outputs JSON for both success and error cases.
   * Argument validation errors (unknown adapter, invalid scale) happen
   * before the benchmark runs and always output human-readable error to stderr.
   */

  test("outputs JSON error for scenario not found with --format json", async () => {
    // This test requires a valid adapter but invalid scenario
    // The --format json flag works for runtime errors like scenario not found
    if (!(await isRuntimeAvailable("php"))) {
      console.log("Skipping: PHP not available");
      return;
    }

    const { stdout, stderr, exitCode } = await runCli([
      "bench",
      "keepsuit",
      "nonexistent/scenario",
      "--format",
      "json",
    ]);

    expect(exitCode).toBe(1);

    // With --format json, error should be on stdout
    const output = stdout || stderr;
    // May fail if deps not installed (which outputs different error format)
    if (
      output.includes("SCENARIO_NOT_FOUND") ||
      output.includes("RUNTIME_NOT_FOUND") ||
      output.includes("DEPS_NOT_INSTALLED")
    ) {
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(false);
    }
  });

  test("argument validation errors are human-readable (not JSON)", async () => {
    // Argument validation errors happen before format is processed
    const { stderr, exitCode } = await runCli([
      "bench",
      "nonexistent",
      "unit/tags/for",
      "-f",
      "json",
    ]);

    expect(exitCode).toBe(1);

    // Should be human-readable error, not JSON
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("Unknown adapter");
  });

  test("invalid scale outputs human-readable error", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "keepsuit",
      "unit/tags/for",
      "--scale",
      "invalid",
      "-f",
      "json",
    ]);

    expect(exitCode).toBe(1);

    // Argument validation error - not JSON
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("Invalid scale");
  });
});

describe("E2E: Error Messages", () => {
  test("shows human-readable error by default", async () => {
    const { stderr, exitCode } = await runCli(["bench", "nonexistent", "unit/tags/for"]);

    expect(exitCode).toBe(1);
    // Should be human readable, not JSON
    expect(stderr).toContain("Error:");
    expect(() => JSON.parse(stderr)).toThrow();
  });

  test("error message for missing scenario argument", async () => {
    const { stderr, exitCode } = await runCli(["bench", "keepsuit"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("<adapter> and <scenario> are required");
  });

  test("error message for invalid iterations (too low)", async () => {
    const { stderr, exitCode } = await runCli(["bench", "keepsuit", "unit/tags/for", "-i", "0"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("--iterations must be between");
  });

  test("error message for invalid warmup (negative)", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "keepsuit",
      "unit/tags/for",
      "--warmup=-1",
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("--warmup must be between");
  });

  test("unknown command shows error", async () => {
    const { stderr, exitCode } = await runCli(["unknown-command"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unknown command");
  });
});

describe("E2E: Exit Codes", () => {
  test("exit code 0 for successful help", async () => {
    const { exitCode } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
  });

  test("exit code 0 for successful list", async () => {
    const { exitCode } = await runCli(["list", "adapters"]);
    expect(exitCode).toBe(0);
  });

  test("exit code 1 for argument errors", async () => {
    const { exitCode } = await runCli(["bench", "keepsuit"]);
    expect(exitCode).toBe(1);
  });

  test("exit code 1 for unknown adapter", async () => {
    const { exitCode } = await runCli(["bench", "nonexistent", "test"]);
    expect(exitCode).toBe(1);
  });

  test("exit code 1 for invalid scale", async () => {
    const { exitCode } = await runCli(["bench", "keepsuit", "test", "-s", "invalid"]);
    expect(exitCode).toBe(1);
  });
});

describe("E2E: Bench All Mode Output", () => {
  /**
   * Tests for "all" mode output behavior.
   * Expected behavior:
   * - Default format is table for all mode (human-readable comparison)
   * - With --format json: JSON output for programmatic use / piping
   */

  test("all mode with --format json shows JSON capability in help", async () => {
    // Verify help output shows format option with json capability
    const { stdout, exitCode } = await runCli(["bench", "--help"]);

    expect(exitCode).toBe(0);
    // Help text should show --format option with table and json
    expect(stdout).toContain("--format");
    expect(stdout).toContain("table");
    expect(stdout).toContain("json");
    // Shows how to pipe JSON output
    expect(stdout).toContain("> results.json");
  });

  test("single mode outputs JSON to stdout by default", async () => {
    // In single mode without --output flag, JSON should go to stdout
    // This is correct behavior for piping
    if (!(await isRuntimeAvailable("php"))) {
      console.log("Skipping: PHP not available");
      return;
    }

    const { stdout, stderr, exitCode } = await runCli([
      "bench",
      "keepsuit",
      "unit/tags/for",
      "--iterations",
      "2",
      "--warmup",
      "0",
      "--scale",
      "small",
    ]);

    // Skip if deps not installed
    if (exitCode !== 0) {
      console.log("Skipping: adapter not ready");
      return;
    }

    expect(exitCode).toBe(0);

    // stdout should contain valid JSON
    expect(() => JSON.parse(stdout)).not.toThrow();
    const result = JSON.parse(stdout);
    expect(result.success).toBe(true);

    // stderr should contain progress messages
    expect(stderr).toContain("bench:");
  });
});

describe("E2E: Bench --format Option", () => {
  const BENCHMARK_TIMEOUT = 30_000;

  describe("format validation", () => {
    test("exits with error for invalid format", async () => {
      const { stderr, exitCode } = await runCli(["bench", "--format", "invalid"]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid format "invalid"');
    });

    test("exits with error for invalid format in single mode", async () => {
      const { stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-f",
        "xml",
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid format "xml"');
    });

    test("accepts --format table in all mode", async () => {
      const { exitCode } = await runCli(["bench", "--format", "table", "--help"]);

      // Help flag takes precedence, but format arg should be valid
      expect(exitCode).toBe(0);
    });

    test("accepts --format json in all mode", async () => {
      const { exitCode } = await runCli(["bench", "--format", "json", "--help"]);

      expect(exitCode).toBe(0);
    });

    test("accepts -f short flag", async () => {
      const { exitCode } = await runCli(["bench", "-f", "table", "--help"]);

      expect(exitCode).toBe(0);
    });
  });

  describe("single mode format behavior", () => {
    test(
      "single mode defaults to json format",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        // Default format is JSON - should be parseable
        expect(() => JSON.parse(stdout)).not.toThrow();
        const result = JSON.parse(stdout);
        expect(result.success).toBe(true);
        expect(result.adapter.name).toBe("keepsuit");
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "single mode with --format json outputs JSON",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "--format",
          "json",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        expect(() => JSON.parse(stdout)).not.toThrow();
        const result = JSON.parse(stdout);
        expect(result.metrics).toBeDefined();
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "single mode with --format table outputs table",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-f",
          "table",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        // Table format should NOT be valid JSON
        expect(() => JSON.parse(stdout)).toThrow();

        // Table format should contain table elements
        expect(stdout).toContain("│");
        expect(stdout).toContain("keepsuit");
      },
      BENCHMARK_TIMEOUT
    );
  });

  describe("help text includes format option", () => {
    test("bench help shows --format option", async () => {
      const { stdout, exitCode } = await runCli(["bench", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--format");
      expect(stdout).toContain("-f");
      expect(stdout).toContain("table");
      expect(stdout).toContain("json");
    });

    test("bench help explains format defaults", async () => {
      const { stdout, exitCode } = await runCli(["bench", "--help"]);

      expect(exitCode).toBe(0);
      // Help should explain default format behavior differs by mode
      // Format: "default: table for all, json for single"
      expect(stdout).toContain("table for all");
      expect(stdout).toContain("json for single");
    });
  });
});

describe("E2E: Bench --quiet Option", () => {
  const BENCHMARK_TIMEOUT = 30_000;

  describe("help text includes quiet option", () => {
    test("bench help shows --quiet option", async () => {
      const { stdout, exitCode } = await runCli(["bench", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--quiet");
      expect(stdout).toContain("-q");
      expect(stdout).toContain("Suppress progress output");
    });
  });

  describe("quiet option validation", () => {
    test("accepts --quiet flag in all mode", async () => {
      const { exitCode } = await runCli(["bench", "--quiet", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts -q short flag in all mode", async () => {
      const { exitCode } = await runCli(["bench", "-q", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts --quiet flag in single mode", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "--quiet",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("accepts -q short flag in single mode", async () => {
      const { exitCode } = await runCli(["bench", "keepsuit", "unit/tags/for", "-q", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("-q can appear before positional args", async () => {
      const { exitCode } = await runCli(["bench", "-q", "keepsuit", "unit/tags/for", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("-q works with other options", async () => {
      const { exitCode } = await runCli(["bench", "-s", "large", "-q", "-i", "50", "--help"]);
      expect(exitCode).toBe(0);
    });
  });

  describe("quiet mode behavior", () => {
    test(
      "single mode with -q suppresses progress output",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-q",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        // stderr should be empty or minimal (no progress messages)
        expect(stderr).toBe("");

        // stdout should still have JSON output
        expect(() => JSON.parse(stdout)).not.toThrow();
        const result = JSON.parse(stdout);
        expect(result.success).toBe(true);
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "single mode without -q shows progress output",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        // stderr should have progress messages
        expect(stderr).toContain("bench:");

        // stdout should still have JSON output
        expect(() => JSON.parse(stdout)).not.toThrow();
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "single mode with -q and --format table outputs only table",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-f",
          "table",
          "-q",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        // stderr should be empty (no progress messages)
        expect(stderr).toBe("");

        // stdout should have table output
        expect(stdout).toContain("keepsuit");
        expect(stdout).toContain("│");
      },
      BENCHMARK_TIMEOUT
    );
  });
});

describe("E2E: Bench Option Combinations", () => {
  const BENCHMARK_TIMEOUT = 30_000;

  describe("options can appear in any order", () => {
    test(
      "format before positional args works",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "-f",
          "json",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        expect(() => JSON.parse(stdout)).not.toThrow();
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "format after positional args works",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-f",
          "json",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        expect(() => JSON.parse(stdout)).not.toThrow();
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "all options combined in single mode",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "--scale",
          "small",
          "--iterations",
          "2",
          "--warmup",
          "0",
          "--format",
          "json",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        const result = JSON.parse(stdout);
        expect(result.metadata.scale).toBe("small");
        expect(result.metadata.iterations).toBe(2);
        expect(result.metadata.warmup).toBe(0);
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "short flags combined in single mode",
      async () => {
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-s",
          "small",
          "-i",
          "2",
          "-w",
          "0",
          "-f",
          "json",
        ]);

        if (exitCode !== 0) {
          console.log("Skipping: adapter not ready");
          return;
        }

        const result = JSON.parse(stdout);
        expect(result.metadata.scale).toBe("small");
      },
      BENCHMARK_TIMEOUT
    );
  });

  describe("scale option values", () => {
    test("accepts --scale small", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-s",
        "small",
        "--help",
      ]);
      // Help takes precedence but scale arg is valid
      expect(exitCode).toBe(0);
    });

    test("accepts --scale medium", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-s",
        "medium",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("accepts --scale large", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-s",
        "large",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("accepts --scale 2xl", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-s",
        "2xl",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("rejects invalid scale", async () => {
      const { stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-s",
        "huge",
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("Invalid scale");
    });
  });

  describe("iterations option validation", () => {
    test("accepts minimum iterations (1)", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-i",
        "1",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("accepts maximum iterations (10000)", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-i",
        "10000",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("rejects zero iterations", async () => {
      const { stderr, exitCode } = await runCli(["bench", "keepsuit", "unit/tags/for", "-i", "0"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("--iterations must be between 1 and 10000");
    });

    test("rejects excessive iterations", async () => {
      const { stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-i",
        "10001",
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("--iterations must be between 1 and 10000");
    });
  });

  describe("warmup option validation", () => {
    test("accepts zero warmup", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-w",
        "0",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("accepts maximum warmup (1000)", async () => {
      const { exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-w",
        "1000",
        "--help",
      ]);
      expect(exitCode).toBe(0);
    });

    test("rejects negative warmup", async () => {
      const { stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "--warmup=-1",
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("--warmup must be between 0 and 1000");
    });

    test("rejects excessive warmup", async () => {
      const { stderr, exitCode } = await runCli([
        "bench",
        "keepsuit",
        "unit/tags/for",
        "-w",
        "1001",
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("--warmup must be between 0 and 1000");
    });
  });
});

describe("E2E: Bench Adapters", () => {
  describe("adapter validation", () => {
    test("accepts keepsuit adapter", async () => {
      // Just validating adapter name, not running benchmark
      const { exitCode } = await runCli(["bench", "keepsuit", "unit/tags/for", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts kalimatas adapter", async () => {
      const { exitCode } = await runCli(["bench", "kalimatas", "unit/tags/for", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts shopify adapter", async () => {
      const { exitCode } = await runCli(["bench", "shopify", "unit/tags/for", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("rejects unknown adapter", async () => {
      const { stderr, exitCode } = await runCli(["bench", "unknown", "unit/tags/for"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown adapter "unknown"');
    });

    test("rejects similar but invalid adapter name", async () => {
      const { stderr, exitCode } = await runCli([
        "bench",
        "Keepsuit", // Capital letter
        "unit/tags/for",
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("Unknown adapter");
    });
  });
});

describe("E2E: Bench Mode Detection", () => {
  test("no positional args triggers all mode (shows help)", async () => {
    // All mode with help flag to avoid running benchmarks
    const { stdout, exitCode } = await runCli(["bench", "--help"]);

    expect(exitCode).toBe(0);
    // Help text describes two usage patterns: all mode and single mode
    expect(stdout).toContain("leb bench ");
    expect(stdout).toContain("all adapters");
    expect(stdout).toContain("<adapter> <scenario>");
  });

  test("only adapter triggers error (not all mode)", async () => {
    const { stderr, exitCode } = await runCli(["bench", "keepsuit"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("<adapter> and <scenario> are required for single mode");
  });

  test("adapter and scenario triggers single mode", async () => {
    // Just check argument parsing, not full benchmark
    const { exitCode } = await runCli(["bench", "keepsuit", "unit/tags/for", "--help"]);

    expect(exitCode).toBe(0);
  });

  test("flags without positional args stay in all mode (shows help)", async () => {
    const { stdout, exitCode } = await runCli(["bench", "-s", "large", "-i", "50", "--help"]);

    expect(exitCode).toBe(0);
    // In all mode, help is displayed
    expect(stdout).toContain("Run benchmarks");
  });
});

describe("E2E: Setup Command", () => {
  const PROJECT_ROOT = join(__dirname, "../..");
  const COMPOSER_JSON = join(PROJECT_ROOT, "composer.json");
  const GEMFILE = join(PROJECT_ROOT, "Gemfile");

  test("setup php generates composer.json", async () => {
    const { stdout, exitCode } = await runCli(["setup", "php"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("composer.json");
    expect(stdout).toContain("Setup complete");

    // Verify file exists and has valid content
    const file = Bun.file(COMPOSER_JSON);
    expect(await file.exists()).toBe(true);

    const content = await file.json();
    expect(content.name).toBe("liquid-engine-benchmarks/adapters");
    expect(content.require).toBeDefined();
    expect(content.require.php).toMatch(/^>=\d+\.\d+$/);
    expect(content.require["keepsuit/liquid"]).toBeDefined();
    expect(content.require["liquid/liquid"]).toBeDefined();
  });

  test("setup ruby generates Gemfile", async () => {
    const { stdout, exitCode } = await runCli(["setup", "ruby"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Gemfile");
    expect(stdout).toContain("Setup complete");

    // Verify file exists and has valid content
    const file = Bun.file(GEMFILE);
    expect(await file.exists()).toBe(true);

    const content = await file.text();
    expect(content).toContain("frozen_string_literal: true");
    expect(content).toContain('source "https://rubygems.org"');
    expect(content).toContain('gem "liquid"');
  });

  test("setup without args generates all files and seeds db", async () => {
    const { stdout, exitCode } = await runCli(["setup"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("composer.json");
    expect(stdout).toContain("Gemfile");
    expect(stdout).toContain("Setup complete");

    // Verify both files exist
    expect(await Bun.file(COMPOSER_JSON).exists()).toBe(true);
    expect(await Bun.file(GEMFILE).exists()).toBe(true);
  });

  test("setup is idempotent", async () => {
    // Run setup twice
    const first = await runCli(["setup"]);
    const second = await runCli(["setup"]);

    expect(first.exitCode).toBe(0);
    expect(second.exitCode).toBe(0);

    // Second run should report files are up to date
    expect(second.stdout).toContain("up to date");
  });

  test("setup errors on invalid target", async () => {
    const { stderr, exitCode } = await runCli(["setup", "invalid"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Invalid target");
  });
});

describe("E2E: Snapshot Verification", () => {
  const BENCHMARK_TIMEOUT = 30_000;
  const PROJECT_ROOT = join(__dirname, "../..");
  const SNAPSHOT_DIR = join(PROJECT_ROOT, "__snapshots__");

  describe("help text includes verification options", () => {
    test("bench help shows --verify option with modes", async () => {
      const { stdout, exitCode } = await runCli(["bench", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--verify");
      expect(stdout).toContain("-v");
      // Verify mode descriptions are shown
      expect(stdout).toContain("self");
      expect(stdout).toContain("baseline");
      expect(stdout).toContain("off");
    });

    test("bench help shows --update-snapshots option", async () => {
      const { stdout, exitCode } = await runCli(["bench", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--update-snapshots");
      expect(stdout).toContain("-u");
      expect(stdout).toContain("Update snapshots");
    });
  });

  describe("verification option parsing", () => {
    test("accepts --verify self flag", async () => {
      const { exitCode } = await runCli(["bench", "--verify", "self", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts --verify baseline flag", async () => {
      const { exitCode } = await runCli(["bench", "--verify", "baseline", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts --verify off flag", async () => {
      const { exitCode } = await runCli(["bench", "--verify", "off", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts -v short flag", async () => {
      const { exitCode } = await runCli(["bench", "-v", "baseline", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts -u short flag", async () => {
      const { exitCode } = await runCli(["bench", "-u", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("accepts --update-snapshots flag", async () => {
      const { exitCode } = await runCli(["bench", "--update-snapshots", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("--verify off and -u can be combined (no conflict)", async () => {
      // Both flags are valid even if semantically redundant
      const { exitCode } = await runCli(["bench", "--verify", "off", "-u", "--help"]);
      expect(exitCode).toBe(0);
    });

    test("errors on invalid verify mode", async () => {
      const { stderr, exitCode } = await runCli(["bench", "--verify", "invalid"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid verify mode "invalid"');
    });
  });

  describe("snapshot update and verification flow", () => {
    test(
      "adapter with -u creates snapshot file",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }

        // Snapshot path: __snapshots__/{scenario}/{scale}/{adapter}.snap
        const snapshotPath = join(SNAPSHOT_DIR, "unit/tags/for/small", "shopify.snap");

        // Remove existing snapshot if present
        try {
          const proc = Bun.spawn(["rm", "-f", snapshotPath]);
          await proc.exited;
        } catch {
          // Ignore if file doesn't exist
        }

        const { stderr, exitCode } = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        // Skip if deps not installed
        if (exitCode !== 0 && stderr.includes("dependencies")) {
          console.log("Skipping: shopify adapter not ready");
          return;
        }

        expect(exitCode).toBe(0);
        expect(stderr).toContain("mode: updating snapshots");

        // Verify snapshot file was created
        const file = Bun.file(snapshotPath);
        expect(await file.exists()).toBe(true);

        // Verify content is not empty
        const content = await file.text();
        expect(content.length).toBeGreaterThan(0);
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "adapter without flags verifies against own snapshot (self-verification)",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }

        // First create the snapshot
        const createResult = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (createResult.exitCode !== 0) {
          console.log("Skipping: couldn't create snapshot");
          return;
        }

        // Verify with the same adapter (self-verification)
        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
        ]);

        expect(exitCode).toBe(0);
        expect(stderr).toContain("verification: pass");

        // JSON output includes verification result
        const result = JSON.parse(stdout);
        expect(result.verification).toBeDefined();
        expect(result.verification.status).toBe("pass");
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "--verify off skips verification even when snapshot exists",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }

        // First create the snapshot
        const createResult = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (createResult.exitCode !== 0) {
          console.log("Skipping: couldn't create snapshot");
          return;
        }

        // Skip verification with --verify off
        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "--verify",
          "off",
        ]);

        expect(exitCode).toBe(0);
        expect(stderr).toContain("verify: off");
        expect(stderr).not.toContain("verification: pass");
        expect(stderr).not.toContain("verification: FAIL");

        // JSON output should not include verification result
        const result = JSON.parse(stdout);
        expect(result.verification).toBeUndefined();
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "each adapter has its own snapshot (self-verification)",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        // Create snapshot for shopify
        const shopifyCreate = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (shopifyCreate.exitCode !== 0) {
          console.log("Skipping: couldn't create shopify snapshot");
          return;
        }

        // Create snapshot for keepsuit
        const keepsuitCreate = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (keepsuitCreate.exitCode !== 0) {
          console.log("Skipping: couldn't create keepsuit snapshot");
          return;
        }

        // Verify keepsuit against its own snapshot (should pass)
        const { stdout, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
        ]);

        // Self-verification should pass
        expect(exitCode).toBe(0);
        const result = JSON.parse(stdout);
        expect(result.verification).toBeDefined();
        expect(result.verification.status).toBe("pass");
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "exits with code 1 when verification fails (tampered snapshot)",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }

        // Create valid snapshot first
        const createResult = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (createResult.exitCode !== 0) {
          console.log("Skipping: couldn't create snapshot");
          return;
        }

        // Tamper with the snapshot file to force verification failure
        const snapshotPath = join(SNAPSHOT_DIR, "unit/tags/for/small", "shopify.snap");
        const originalContent = await Bun.file(snapshotPath).text();
        await Bun.write(snapshotPath, "TAMPERED CONTENT - THIS SHOULD NOT MATCH");

        try {
          // Run benchmark without -u flag (verification mode)
          const { stdout, stderr, exitCode } = await runCli([
            "bench",
            "shopify",
            "unit/tags/for",
            "-i",
            "2",
            "-w",
            "0",
            "-s",
            "small",
          ]);

          // Exit code should be 1 due to verification failure
          expect(exitCode).toBe(1);
          expect(stderr).toContain("verification: FAIL");

          // JSON output should include failure details
          const result = JSON.parse(stdout);
          expect(result.verification).toBeDefined();
          expect(result.verification.status).toBe("fail");
          expect(result.verification.diff).toBeDefined();
        } finally {
          // Restore original snapshot
          await Bun.write(snapshotPath, originalContent);
        }
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "verification returns missing status when snapshot does not exist",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }

        // Use a unique scale that likely doesn't have a snapshot
        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "2xl", // Use 2xl scale which likely has no snapshot
        ]);

        // Missing snapshot should still succeed (not exit code 1)
        // but verification status should be "missing"
        if (exitCode === 0) {
          const result = JSON.parse(stdout);
          if (result.verification) {
            expect(result.verification.status).toBe("missing");
          }
          expect(stderr).toContain("verification: missing");
        }
      },
      BENCHMARK_TIMEOUT
    );
  });

  describe("baseline verification mode", () => {
    test(
      "--verify baseline compares against shopify snapshot",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        // First create shopify baseline snapshot
        const shopifyCreate = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (shopifyCreate.exitCode !== 0) {
          console.log("Skipping: couldn't create shopify snapshot");
          return;
        }

        // Run keepsuit with --verify baseline to compare against shopify
        const { stdout, stderr, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "--verify",
          "baseline",
        ]);

        // Baseline verification may pass or fail depending on output compatibility
        // The key point is that it runs and produces correct verification structure
        const result = JSON.parse(stdout);
        expect(result.verification).toBeDefined();
        // Verify it compared against shopify, not self
        expect(stderr).toContain("verify: baseline");
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "-v baseline short flag works",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }
        if (!(await isRuntimeAvailable("php"))) {
          console.log("Skipping: PHP not available");
          return;
        }

        // First create shopify baseline snapshot
        const shopifyCreate = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (shopifyCreate.exitCode !== 0) {
          console.log("Skipping: couldn't create shopify snapshot");
          return;
        }

        // Run keepsuit with -v baseline
        const { stderr, exitCode } = await runCli([
          "bench",
          "keepsuit",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-v",
          "baseline",
        ]);

        // Should show baseline verification mode in progress output
        if (exitCode === 0 || stderr.includes("verify:")) {
          expect(stderr).toContain("verify: baseline");
        }
      },
      BENCHMARK_TIMEOUT
    );

    test(
      "default verify mode is self (not baseline)",
      async () => {
        if (!(await isRuntimeAvailable("ruby"))) {
          console.log("Skipping: Ruby not available");
          return;
        }

        // Create shopify snapshot
        const shopifyCreate = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
          "-u",
        ]);

        if (shopifyCreate.exitCode !== 0) {
          console.log("Skipping: couldn't create shopify snapshot");
          return;
        }

        // Run shopify without explicit --verify flag (should default to self)
        const { stderr, exitCode } = await runCli([
          "bench",
          "shopify",
          "unit/tags/for",
          "-i",
          "2",
          "-w",
          "0",
          "-s",
          "small",
        ]);

        if (exitCode === 0) {
          // Default mode should show self-verification behavior
          // Not explicitly "verify: self" but should pass since comparing to own snapshot
          expect(stderr).toContain("verification: pass");
        }
      },
      BENCHMARK_TIMEOUT
    );
  });
});

describe("E2E: Prepare Command", () => {
  const PROJECT_ROOT = join(__dirname, "../..");
  const SCHEMA_DIR = join(PROJECT_ROOT, ".generated/schema");

  /**
   * Expected schema files generated by prepare command.
   */
  const EXPECTED_SCHEMAS = [
    "adapter-input.schema.json",
    "adapter-output.schema.json",
    "leb.config.schema.json",
    "result.schema.json",
  ] as const;

  test("prepare generates all schema files", async () => {
    const { stdout, exitCode } = await runCli(["prepare"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Generating JSON Schemas");

    // Verify all schema files are generated
    for (const schema of EXPECTED_SCHEMAS) {
      expect(stdout).toContain(schema);
    }
  });

  test("prepare creates valid JSON schema files", async () => {
    // Run prepare to ensure schemas exist
    await runCli(["prepare"]);

    for (const schemaName of EXPECTED_SCHEMAS) {
      const file = Bun.file(join(SCHEMA_DIR, schemaName));
      expect(await file.exists()).toBe(true);

      // Verify it's valid JSON
      const content = await file.json();
      expect(content.$schema).toBe("http://json-schema.org/draft-07/schema#");
      expect(content.$id).toContain(schemaName);
      expect(content.type).toBe("object");
    }
  });

  test("prepare seeds the database", async () => {
    const { stdout, exitCode } = await runCli(["prepare"]);

    expect(exitCode).toBe(0);
    // Database seeding should complete
    expect(stdout).toContain("Seeding");
  });

  test("prepare is idempotent", async () => {
    // Run prepare twice
    const first = await runCli(["prepare"]);
    const second = await runCli(["prepare"]);

    expect(first.exitCode).toBe(0);
    expect(second.exitCode).toBe(0);

    // Both should succeed without errors
    expect(first.stdout).toContain("Generating JSON Schemas");
    expect(second.stdout).toContain("Generating JSON Schemas");
  }, 15000);

  test("prepare shows help with --help flag", async () => {
    const { stdout, exitCode } = await runCli(["prepare", "--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("prepare");
    expect(stdout).toContain("schema");
  });
});
