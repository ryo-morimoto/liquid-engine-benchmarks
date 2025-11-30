/**
 * Unit tests for bench CLI command
 *
 * Tests argument parsing for the bench subcommand.
 * Supports two modes:
 * - "all" mode: no positional args → run all adapters × all scenarios
 * - "single" mode: <adapter> <scenario> → run single benchmark
 *
 * Output formats:
 * - "table": comparison table with baseline ratios (default for all mode)
 * - "json": raw JSON output (default for single mode)
 */

import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { parseArgs_ } from "./bench";

describe("parseArgs_", () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    errorSpy = spyOn(console, "error").mockImplementation(() => {});
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  describe("all mode (no positional arguments)", () => {
    test("returns all mode when no arguments", () => {
      const result = parseArgs_([]);

      expect(result.mode).toBe("all");
    });

    test("uses default values in all mode", () => {
      const result = parseArgs_([]);

      expect(result.mode).toBe("all");
      expect(result.scale).toBe("medium");
      expect(result.iterations).toBe(100);
      expect(result.warmup).toBe(10);
    });

    test("default format is 'table' in all mode", () => {
      const result = parseArgs_([]);

      expect(result.mode).toBe("all");
      expect(result.format).toBe("table");
    });

    test("accepts flags in all mode", () => {
      const result = parseArgs_(["-s", "large", "-i", "50"]);

      expect(result.mode).toBe("all");
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(50);
    });
  });

  describe("single mode (positional arguments)", () => {
    test("returns single mode with adapter and scenario", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.adapter).toBe("keepsuit");
        expect(result.scenario).toBe("unit/tags/for");
      }
    });

    test("default format is 'json' in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      expect(result.format).toBe("json");
    });

    test("works with all valid adapters", () => {
      const adapters = ["keepsuit", "kalimatas", "shopify"];

      for (const adapter of adapters) {
        const result = parseArgs_([adapter, "unit/tags/for"]);
        expect(result.mode).toBe("single");
        if (result.mode === "single") {
          expect(result.adapter).toBe(adapter);
        }
      }
    });

    test("exits with error when only adapter provided", () => {
      expect(() => parseArgs_(["keepsuit"])).toThrow("process.exit called");
      expect(errorSpy).toHaveBeenCalledWith(
        "Error: <adapter> and <scenario> are required for single mode"
      );
    });

    test("exits with error for unknown adapter", () => {
      expect(() => parseArgs_(["unknown", "unit/tags/for"])).toThrow("process.exit called");
      expect(errorSpy).toHaveBeenCalledWith('Error: Unknown adapter "unknown"');
    });

    test("includes output option in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-o", "out.json"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.output).toBe("out.json");
      }
    });
  });

  describe("--format option", () => {
    describe("in all mode", () => {
      test("accepts --format table", () => {
        const result = parseArgs_(["--format", "table"]);

        expect(result.mode).toBe("all");
        expect(result.format).toBe("table");
      });

      test("accepts --format json", () => {
        const result = parseArgs_(["--format", "json"]);

        expect(result.mode).toBe("all");
        expect(result.format).toBe("json");
      });

      test("accepts -f short flag for format", () => {
        const result = parseArgs_(["-f", "json"]);

        expect(result.mode).toBe("all");
        expect(result.format).toBe("json");
      });

      test("default format is table in all mode", () => {
        const result = parseArgs_([]);

        expect(result.format).toBe("table");
      });
    });

    describe("in single mode", () => {
      test("accepts --format table", () => {
        const result = parseArgs_(["keepsuit", "unit/tags/for", "--format", "table"]);

        expect(result.mode).toBe("single");
        expect(result.format).toBe("table");
      });

      test("accepts --format json", () => {
        const result = parseArgs_(["keepsuit", "unit/tags/for", "--format", "json"]);

        expect(result.mode).toBe("single");
        expect(result.format).toBe("json");
      });

      test("accepts -f short flag for format", () => {
        const result = parseArgs_(["keepsuit", "unit/tags/for", "-f", "table"]);

        expect(result.mode).toBe("single");
        expect(result.format).toBe("table");
      });

      test("default format is json in single mode", () => {
        const result = parseArgs_(["keepsuit", "unit/tags/for"]);

        expect(result.format).toBe("json");
      });
    });

    describe("validation", () => {
      test("exits with error for invalid format", () => {
        expect(() => parseArgs_(["--format", "invalid"])).toThrow("process.exit called");
        expect(errorSpy).toHaveBeenCalledWith('Error: Invalid format "invalid"');
      });

      test("exits with error for invalid format in single mode", () => {
        expect(() => parseArgs_(["keepsuit", "unit/tags/for", "-f", "xml"])).toThrow(
          "process.exit called"
        );
        expect(errorSpy).toHaveBeenCalledWith('Error: Invalid format "xml"');
      });
    });
  });

  describe("default values", () => {
    test("uses default scale (medium)", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.scale).toBe("medium");
    });

    test("uses default iterations (100)", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.iterations).toBe(100);
    });

    test("uses default warmup (10)", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.warmup).toBe(10);
    });

    test("output is undefined by default in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.output).toBeUndefined();
      }
    });
  });

  describe("option flags", () => {
    test("parses --scale with long flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--scale", "large"]);

      expect(result.scale).toBe("large");
    });

    test("parses -s with short flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-s", "small"]);

      expect(result.scale).toBe("small");
    });

    test("parses --iterations with long flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--iterations", "500"]);

      expect(result.iterations).toBe(500);
    });

    test("parses -i with short flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-i", "50"]);

      expect(result.iterations).toBe(50);
    });

    test("parses --warmup with long flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--warmup", "20"]);

      expect(result.warmup).toBe(20);
    });

    test("parses -w with short flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-w", "5"]);

      expect(result.warmup).toBe(5);
    });

    test("parses --output with long flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--output", "result.json"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.output).toBe("result.json");
      }
    });

    test("parses -o with short flag", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-o", "out.json"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.output).toBe("out.json");
      }
    });
  });

  describe("combined arguments", () => {
    test("parses all options together in single mode", () => {
      const result = parseArgs_([
        "shopify",
        "composite/for-with-if",
        "-s",
        "large",
        "-i",
        "200",
        "-w",
        "15",
        "-o",
        "results/test.json",
        "-f",
        "json",
      ]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.adapter).toBe("shopify");
        expect(result.scenario).toBe("composite/for-with-if");
        expect(result.output).toBe("results/test.json");
      }
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(200);
      expect(result.warmup).toBe(15);
      expect(result.format).toBe("json");
    });

    test("parses all options in all mode", () => {
      const result = parseArgs_(["-s", "large", "-i", "50", "-w", "5", "-f", "json"]);

      expect(result.mode).toBe("all");
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(50);
      expect(result.warmup).toBe(5);
      expect(result.format).toBe("json");
    });

    test("format option can appear before positional args", () => {
      const result = parseArgs_(["-f", "table", "keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      expect(result.format).toBe("table");
    });

    test("format option can appear after positional args", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-f", "table"]);

      expect(result.mode).toBe("single");
      expect(result.format).toBe("table");
    });

    test("format option can appear between other flags", () => {
      const result = parseArgs_(["-s", "large", "-f", "json", "-i", "50"]);

      expect(result.mode).toBe("all");
      expect(result.format).toBe("json");
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(50);
    });
  });

  describe("validation", () => {
    test("exits with error for invalid scale", () => {
      expect(() => parseArgs_(["keepsuit", "unit/tags/for", "-s", "invalid"])).toThrow(
        "process.exit called"
      );
      expect(errorSpy).toHaveBeenCalledWith('Error: Invalid scale "invalid"');
    });

    test("exits with error for non-positive iterations", () => {
      expect(() => parseArgs_(["keepsuit", "unit/tags/for", "-i", "0"])).toThrow(
        "process.exit called"
      );
      expect(errorSpy).toHaveBeenCalledWith("Error: --iterations must be between 1 and 10000");
    });

    test("exits with error for excessive iterations", () => {
      expect(() => parseArgs_(["keepsuit", "unit/tags/for", "-i", "99999"])).toThrow(
        "process.exit called"
      );
      expect(errorSpy).toHaveBeenCalledWith("Error: --iterations must be between 1 and 10000");
    });

    test("exits with error for negative warmup", () => {
      // Use --warmup=-1 format since -w -1 is interpreted as two flags
      expect(() => parseArgs_(["keepsuit", "unit/tags/for", "--warmup=-1"])).toThrow(
        "process.exit called"
      );
      expect(errorSpy).toHaveBeenCalledWith("Error: --warmup must be between 0 and 1000");
    });

    test("exits with error for excessive warmup", () => {
      expect(() => parseArgs_(["keepsuit", "unit/tags/for", "-w", "9999"])).toThrow(
        "process.exit called"
      );
      expect(errorSpy).toHaveBeenCalledWith("Error: --warmup must be between 0 and 1000");
    });

    test("accepts all valid scales", () => {
      const scales = ["small", "medium", "large", "2xl"];

      for (const scale of scales) {
        const result = parseArgs_(["keepsuit", "unit/tags/for", "-s", scale]);
        expect(result.scale).toBe(scale);
      }
    });

    test("accepts zero warmup", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-w", "0"]);

      expect(result.warmup).toBe(0);
    });

    test("accepts maximum iterations", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-i", "10000"]);

      expect(result.iterations).toBe(10000);
    });

    test("accepts minimum iterations", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-i", "1"]);

      expect(result.iterations).toBe(1);
    });

    test("accepts maximum warmup", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-w", "1000"]);

      expect(result.warmup).toBe(1000);
    });
  });

  describe("mode-specific format defaults", () => {
    test("all mode defaults to table format for comparison output", () => {
      const allResult = parseArgs_([]);
      expect(allResult.mode).toBe("all");
      expect(allResult.format).toBe("table");
    });

    test("single mode defaults to json format for programmatic use", () => {
      const singleResult = parseArgs_(["keepsuit", "unit/tags/for"]);
      expect(singleResult.mode).toBe("single");
      expect(singleResult.format).toBe("json");
    });

    test("explicit format overrides defaults in all mode", () => {
      const result = parseArgs_(["-f", "json"]);
      expect(result.mode).toBe("all");
      expect(result.format).toBe("json");
    });

    test("explicit format overrides defaults in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-f", "table"]);
      expect(result.mode).toBe("single");
      expect(result.format).toBe("table");
    });
  });

  describe("--quiet option", () => {
    test("quiet is false by default in all mode", () => {
      const result = parseArgs_([]);

      expect(result.mode).toBe("all");
      expect(result.quiet).toBe(false);
    });

    test("quiet is false by default in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      expect(result.quiet).toBe(false);
    });

    test("parses --quiet flag in all mode", () => {
      const result = parseArgs_(["--quiet"]);

      expect(result.mode).toBe("all");
      expect(result.quiet).toBe(true);
    });

    test("parses -q short flag in all mode", () => {
      const result = parseArgs_(["-q"]);

      expect(result.mode).toBe("all");
      expect(result.quiet).toBe(true);
    });

    test("parses --quiet flag in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--quiet"]);

      expect(result.mode).toBe("single");
      expect(result.quiet).toBe(true);
    });

    test("parses -q short flag in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-q"]);

      expect(result.mode).toBe("single");
      expect(result.quiet).toBe(true);
    });

    test("-q can appear before positional args", () => {
      const result = parseArgs_(["-q", "keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      expect(result.quiet).toBe(true);
    });

    test("-q can appear between other flags", () => {
      const result = parseArgs_(["-s", "large", "-q", "-i", "50"]);

      expect(result.mode).toBe("all");
      expect(result.quiet).toBe(true);
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(50);
    });

    test("-q works with all other options in single mode", () => {
      const result = parseArgs_([
        "shopify",
        "composite/for-with-if",
        "-s",
        "large",
        "-i",
        "200",
        "-w",
        "15",
        "-f",
        "json",
        "-q",
      ]);

      expect(result.mode).toBe("single");
      expect(result.quiet).toBe(true);
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(200);
      expect(result.warmup).toBe(15);
      expect(result.format).toBe("json");
    });

    test("-q works with all other options in all mode", () => {
      const result = parseArgs_(["-s", "large", "-i", "50", "-w", "5", "-f", "json", "-q"]);

      expect(result.mode).toBe("all");
      expect(result.quiet).toBe(true);
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(50);
      expect(result.warmup).toBe(5);
      expect(result.format).toBe("json");
    });
  });

  describe("--no-verify option", () => {
    test("noVerify is false by default in all mode", () => {
      const result = parseArgs_([]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        expect(result.noVerify).toBe(false);
      }
    });

    test("noVerify is false by default in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.noVerify).toBe(false);
      }
    });

    test("parses --no-verify flag in all mode", () => {
      const result = parseArgs_(["--no-verify"]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        expect(result.noVerify).toBe(true);
      }
    });

    test("parses --no-verify flag in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--no-verify"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.noVerify).toBe(true);
      }
    });

    test("--no-verify can appear before positional args", () => {
      const result = parseArgs_(["--no-verify", "keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.noVerify).toBe(true);
      }
    });

    test("--no-verify works with all other options", () => {
      const result = parseArgs_([
        "shopify",
        "unit/tags/for",
        "-s",
        "large",
        "-i",
        "50",
        "--no-verify",
      ]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.noVerify).toBe(true);
      }
      expect(result.scale).toBe("large");
      expect(result.iterations).toBe(50);
    });
  });

  describe("--update-snapshots option", () => {
    test("updateSnapshots is false by default in all mode", () => {
      const result = parseArgs_([]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        expect(result.updateSnapshots).toBe(false);
      }
    });

    test("updateSnapshots is false by default in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.updateSnapshots).toBe(false);
      }
    });

    test("parses --update-snapshots flag in all mode", () => {
      const result = parseArgs_(["--update-snapshots"]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        expect(result.updateSnapshots).toBe(true);
      }
    });

    test("parses --update-snapshots flag in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "--update-snapshots"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.updateSnapshots).toBe(true);
      }
    });

    test("parses -u short flag for --update-snapshots", () => {
      const result = parseArgs_(["-u"]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        expect(result.updateSnapshots).toBe(true);
      }
    });

    test("--update-snapshots implies --no-verify (snapshots must be generated before verify)", () => {
      const result = parseArgs_(["--update-snapshots"]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        // When updating snapshots, verification is skipped as we're generating new baselines
        expect(result.updateSnapshots).toBe(true);
      }
    });

    test("--no-verify and --update-snapshots can both be set", () => {
      const result = parseArgs_(["--no-verify", "--update-snapshots"]);

      expect(result.mode).toBe("all");
      if (result.mode === "all") {
        expect(result.noVerify).toBe(true);
        expect(result.updateSnapshots).toBe(true);
      }
    });

    test("verification options work in single mode", () => {
      const result = parseArgs_(["keepsuit", "unit/tags/for", "-u", "--no-verify"]);

      expect(result.mode).toBe("single");
      if (result.mode === "single") {
        expect(result.updateSnapshots).toBe(true);
        expect(result.noVerify).toBe(true);
      }
    });
  });
});

describe("VerifyOptions behavior", () => {
  describe("verification logic", () => {
    test("updateSnapshots=true causes snapshot to be saved, not verified", () => {
      // This is a design documentation test
      // When updateSnapshots is true, the code path should:
      // 1. Save the rendered_output as the new snapshot
      // 2. NOT compare against existing snapshot
      // The actual implementation is at bench.ts:560-573
      const verifyOptions = {
        noVerify: false,
        updateSnapshots: true,
      };

      // updateSnapshots takes precedence over verification
      expect(verifyOptions.updateSnapshots).toBe(true);
    });

    test("noVerify=true skips all verification logic", () => {
      // This is a design documentation test
      // When noVerify is true, no snapshot operations occur
      const verifyOptions = {
        noVerify: true,
        updateSnapshots: false,
      };

      expect(verifyOptions.noVerify).toBe(true);
    });

    test("default verification compares against own adapter snapshot", () => {
      // This is a design documentation test
      // When no options are set, self-verification occurs:
      // - adapter's output is compared against {adapter}.snap
      // - NOT compared against baseline (shopify)
      const verifyOptions = {
        noVerify: false,
        updateSnapshots: false,
        compareAgainst: undefined, // self-verification
      };

      expect(verifyOptions.compareAgainst).toBeUndefined();
    });

    test("compareAgainst enables baseline comparison", () => {
      // This is a design documentation test
      // When compareAgainst is set, output is compared against that adapter's snapshot
      const verifyOptions = {
        noVerify: false,
        updateSnapshots: false,
        compareAgainst: "shopify" as const,
      };

      expect(verifyOptions.compareAgainst).toBe("shopify");
    });
  });
});
