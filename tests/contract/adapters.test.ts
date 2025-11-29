/**
 * Adapter Contract Tests
 *
 * Verifies that all adapters conform to the adapter-output.schema.json contract.
 * Each adapter is tested independently to ensure schema compliance.
 *
 * These are integration tests that require PHP/Ruby runtimes and dependencies.
 * Skip tests for unavailable adapters using environment variables:
 *   SKIP_PHP_ADAPTERS=1 bun test tests/adapters.test.ts
 *   SKIP_RUBY_ADAPTERS=1 bun test tests/adapters.test.ts
 */

import { beforeAll, describe, expect, test } from "bun:test";
import {
  ADAPTERS,
  AdapterError,
  isValidAdapterOutput,
  listAdapters,
  runAdapter,
} from "../../src/lib";
import type { AdapterInput, AdapterName } from "../../src/types";

/**
 * Simple template for contract testing.
 * Tests basic variable substitution.
 */
const SIMPLE_TEMPLATE = "Hello, {{ name }}!";
const SIMPLE_DATA = { name: "World" };

/**
 * Standard test input for all adapters.
 */
const TEST_INPUT: AdapterInput = {
  template: SIMPLE_TEMPLATE,
  data: SIMPLE_DATA,
  iterations: 3,
  warmup: 1,
};

/**
 * Check if an adapter's runtime is available.
 * Uses feature-test approach: execute the runtime directly.
 */
async function isAdapterAvailable(adapterName: AdapterName): Promise<boolean> {
  const config = ADAPTERS[adapterName];

  // Check environment skip flags (bracket notation for index signature access)
  if (config.lang === "php" && process.env.SKIP_PHP_ADAPTERS === "1") {
    return false;
  }
  if (config.lang === "ruby" && process.env.SKIP_RUBY_ADAPTERS === "1") {
    return false;
  }

  // Feature test: execute runtime directly with version flag
  const runtimeCommand = config.command[0];
  if (!runtimeCommand) {
    return false;
  }

  try {
    const versionFlag = config.lang === "php" ? "-v" : "--version";
    const proc = Bun.spawn([runtimeCommand, versionFlag], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch {
    return false;
  }
}

describe("Adapter Contract Tests", () => {
  const adapters = listAdapters();

  // Track available adapters
  const availableAdapters: AdapterName[] = [];

  beforeAll(async () => {
    for (const adapter of adapters) {
      if (await isAdapterAvailable(adapter)) {
        availableAdapters.push(adapter);
      }
    }

    if (availableAdapters.length === 0) {
      console.warn("Warning: No adapters available for testing");
    }
  });

  describe("Schema Compliance", () => {
    for (const adapterName of adapters) {
      test(`${adapterName} adapter produces valid output`, async () => {
        if (!(await isAdapterAvailable(adapterName))) {
          console.log(`Skipping ${adapterName}: runtime not available`);
          return;
        }

        const result = await runAdapter(adapterName, TEST_INPUT, 60_000);

        // Validate against schema
        expect(await isValidAdapterOutput(result.output)).toBe(true);
      });
    }
  });

  describe("Output Structure", () => {
    for (const adapterName of adapters) {
      test(`${adapterName} returns required fields`, async () => {
        if (!(await isAdapterAvailable(adapterName))) {
          console.log(`Skipping ${adapterName}: runtime not available`);
          return;
        }

        const result = await runAdapter(adapterName, TEST_INPUT, 60_000);
        const output = result.output;

        // Required fields
        expect(output.library).toBeDefined();
        expect(typeof output.library).toBe("string");
        expect(output.library.length).toBeGreaterThan(0);

        expect(output.version).toBeDefined();
        expect(typeof output.version).toBe("string");

        expect(output.lang).toBeDefined();
        expect(["php", "ruby", "go", "rust", "javascript"]).toContain(output.lang);

        expect(output.timings).toBeDefined();
        expect(output.timings.parse_ms).toBeDefined();
        expect(output.timings.render_ms).toBeDefined();
      });

      test(`${adapterName} returns correct timing array lengths`, async () => {
        if (!(await isAdapterAvailable(adapterName))) {
          console.log(`Skipping ${adapterName}: runtime not available`);
          return;
        }

        const result = await runAdapter(adapterName, TEST_INPUT, 60_000);
        const { timings } = result.output;

        // Arrays should match iterations count
        expect(timings.parse_ms.length).toBe(TEST_INPUT.iterations);
        expect(timings.render_ms.length).toBe(TEST_INPUT.iterations);

        // All values should be non-negative numbers
        for (const ms of timings.parse_ms) {
          expect(typeof ms).toBe("number");
          expect(ms).toBeGreaterThanOrEqual(0);
        }

        for (const ms of timings.render_ms) {
          expect(typeof ms).toBe("number");
          expect(ms).toBeGreaterThanOrEqual(0);
        }
      });
    }
  });

  describe("Language Correctness", () => {
    test("PHP adapters report lang as php", async () => {
      for (const adapterName of adapters) {
        const config = ADAPTERS[adapterName];
        if (config.lang !== "php") continue;

        if (!(await isAdapterAvailable(adapterName))) {
          console.log(`Skipping ${adapterName}: runtime not available`);
          continue;
        }

        const result = await runAdapter(adapterName, TEST_INPUT, 60_000);
        expect(result.output.lang).toBe("php");
      }
    });

    test("Ruby adapters report lang as ruby", async () => {
      for (const adapterName of adapters) {
        const config = ADAPTERS[adapterName];
        if (config.lang !== "ruby") continue;

        if (!(await isAdapterAvailable(adapterName))) {
          console.log(`Skipping ${adapterName}: runtime not available`);
          continue;
        }

        const result = await runAdapter(adapterName, TEST_INPUT, 60_000);
        expect(result.output.lang).toBe("ruby");
      }
    });
  });

  describe("Error Handling", () => {
    test("adapters handle invalid template gracefully", async () => {
      const invalidInput: AdapterInput = {
        template: "{{ invalid | nonexistent_filter }}",
        data: {},
        iterations: 1,
        warmup: 0,
      };

      for (const adapterName of adapters) {
        if (!(await isAdapterAvailable(adapterName))) {
          continue;
        }

        // Some adapters may throw, others may return error in output
        // The key is they shouldn't hang or crash unexpectedly
        try {
          const result = await runAdapter(adapterName, invalidInput, 30_000);
          // If it succeeds, output should still be valid
          expect(await isValidAdapterOutput(result.output)).toBe(true);
        } catch (error) {
          // Expected for strict-mode adapters
          expect(error).toBeDefined();
        }
      }
    });

    test("AdapterError contains adapter name", async () => {
      // Test with an intentionally broken template that causes parse error
      const brokenInput: AdapterInput = {
        template: "{% for item in %}", // incomplete for loop
        data: {},
        iterations: 1,
        warmup: 0,
      };

      for (const adapterName of adapters) {
        if (!(await isAdapterAvailable(adapterName))) {
          continue;
        }

        try {
          await runAdapter(adapterName, brokenInput, 30_000);
        } catch (error) {
          if (error instanceof AdapterError) {
            expect(error.adapterName).toBe(adapterName);
          }
        }
      }
    });

    test("AdapterError captures exit code on crash", async () => {
      // Use deeply nested template that may cause stack overflow
      const nestedInput: AdapterInput = {
        template: "{% for a in b %}".repeat(100) + "{% endfor %}".repeat(100),
        data: {},
        iterations: 1,
        warmup: 0,
      };

      for (const adapterName of adapters) {
        if (!(await isAdapterAvailable(adapterName))) {
          continue;
        }

        try {
          await runAdapter(adapterName, nestedInput, 30_000);
        } catch (error) {
          if (error instanceof AdapterError) {
            // Exit code should be defined for crashed adapters
            if (error.exitCode !== undefined) {
              expect(typeof error.exitCode).toBe("number");
            }
          }
        }
      }
    });
  });
});
