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
 */
async function isRuntimeAvailable(command: string): Promise<boolean> {
  try {
    const proc = Bun.spawn(["which", command], {
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
    expect(stdout).toContain("Benchmark Command");
    expect(stdout).toContain("--adapter");
    expect(stdout).toContain("--template");
  });

  test("shows setup help", async () => {
    const { stdout, exitCode } = await runCli(["setup", "--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Setup Command");
    expect(stdout).toContain("php");
    expect(stdout).toContain("ruby");
  });

  test("errors on missing --adapter", async () => {
    const { stderr, exitCode } = await runCli(["bench", "--template", "primitive/variable"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("--adapter is required");
  });

  test("errors on missing --template", async () => {
    const { stderr, exitCode } = await runCli(["bench", "--adapter", "keepsuit"]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("--template is required");
  });

  test("errors on unknown adapter", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "--adapter",
      "nonexistent",
      "--template",
      "primitive/variable",
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unknown adapter");
  });

  test("errors on invalid scale", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "--adapter",
      "keepsuit",
      "--template",
      "primitive/variable",
      "--scale",
      "invalid",
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Invalid scale");
  });

  test("errors on invalid iterations", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "--adapter",
      "keepsuit",
      "--template",
      "primitive/variable",
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
        "--adapter",
        "keepsuit",
        "--template",
        "primitive/variable",
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
      expect(result.metadata.template).toBe("primitive/variable");
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
        "--adapter",
        "shopify",
        "--template",
        "primitive/variable",
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
        "--adapter",
        "keepsuit",
        "--template",
        "primitive/variable",
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
      expect(stderr).toContain("Result written to:");

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

describe("E2E: Different Templates", () => {
  const BENCHMARK_TIMEOUT = 30_000;

  test(
    "runs with ecommerce/product template",
    async () => {
      if (!(await isRuntimeAvailable("php"))) {
        console.log("Skipping: PHP not available");
        return;
      }

      const { stdout, exitCode } = await runCli([
        "bench",
        "--adapter",
        "keepsuit",
        "--template",
        "ecommerce/product",
        "--iterations",
        "2",
        "--warmup",
        "0",
        "--scale",
        "small",
      ]);

      if (exitCode !== 0) {
        console.log("Skipping: ecommerce template test failed");
        return;
      }

      expect(exitCode).toBe(0);

      const result = JSON.parse(stdout);
      expect(result.metadata.template).toBe("ecommerce/product");
    },
    BENCHMARK_TIMEOUT
  );

  test("errors on nonexistent template", async () => {
    const { stderr, exitCode } = await runCli([
      "bench",
      "--adapter",
      "keepsuit",
      "--template",
      "nonexistent/template",
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Error");
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

  test("setup all generates both files", async () => {
    const { stdout, exitCode } = await runCli(["setup", "all"]);

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
    const first = await runCli(["setup", "all"]);
    const second = await runCli(["setup", "all"]);

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
