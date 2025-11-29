/**
 * Unit tests for config loader
 */

import { describe, expect, test } from "bun:test";
import {
  filterLibrariesByLang,
  getExcludedScenarios,
  getLibraryConfig,
  getRuntimeVersion,
  loadConfig,
  type LebConfig,
  type LibraryConfig,
} from "./index";

describe("loadConfig", () => {
  test("loads leb.config.json successfully", async () => {
    const config = await loadConfig();

    expect(config).toBeDefined();
    expect(config.runtimes).toBeDefined();
    expect(config.libraries).toBeDefined();
  });

  test("returns valid runtimes", async () => {
    const config = await loadConfig();

    expect(config.runtimes.php).toBeDefined();
    expect(config.runtimes.ruby).toBeDefined();
    expect(typeof config.runtimes.php).toBe("string");
    expect(typeof config.runtimes.ruby).toBe("string");
  });

  test("returns valid libraries array", async () => {
    const config = await loadConfig();

    expect(Array.isArray(config.libraries)).toBe(true);
    expect(config.libraries.length).toBeGreaterThan(0);
  });

  test("each library has required fields", async () => {
    const config = await loadConfig();

    for (const lib of config.libraries) {
      expect(lib.lang).toBeDefined();
      expect(lib.name).toBeDefined();
      expect(lib.package).toBeDefined();
      expect(lib.versions).toBeDefined();
      expect(Array.isArray(lib.versions)).toBe(true);
    }
  });
});

describe("filterLibrariesByLang", () => {
  const mockLibraries: LibraryConfig[] = [
    { lang: "php", name: "keepsuit", package: "keepsuit/liquid", versions: ["1.0.0"] },
    { lang: "php", name: "kalimatas", package: "liquid/liquid", versions: ["1.5.0"] },
    { lang: "ruby", name: "shopify", package: "liquid", versions: ["5.5.0"] },
  ];

  test("filters PHP libraries", () => {
    const result = filterLibrariesByLang(mockLibraries, "php");

    expect(result.length).toBe(2);
    expect(result.every((lib) => lib.lang === "php")).toBe(true);
  });

  test("filters Ruby libraries", () => {
    const result = filterLibrariesByLang(mockLibraries, "ruby");

    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe("shopify");
  });

  test("returns empty array for no matches", () => {
    const phpOnly: LibraryConfig[] = [
      { lang: "php", name: "test", package: "test/test", versions: ["1.0.0"] },
    ];

    const result = filterLibrariesByLang(phpOnly, "ruby");

    expect(result.length).toBe(0);
  });
});

describe("getRuntimeVersion", () => {
  const mockConfig: LebConfig = {
    runtimes: { php: "8.3", ruby: "3.3" },
    baseline: { library: "shopify", version: "5.6.0" },
    libraries: [],
  };

  test("returns PHP version", () => {
    const version = getRuntimeVersion(mockConfig, "php");

    expect(version).toBe("8.3");
  });

  test("returns Ruby version", () => {
    const version = getRuntimeVersion(mockConfig, "ruby");

    expect(version).toBe("3.3");
  });
});

describe("getLibraryConfig", () => {
  const mockConfig: LebConfig = {
    runtimes: { php: "8.3", ruby: "3.3" },
    baseline: { library: "shopify", version: "5.6.0" },
    libraries: [
      { lang: "php", name: "keepsuit", package: "keepsuit/liquid", versions: ["1.0.0"] },
      { lang: "ruby", name: "shopify", package: "liquid", versions: ["5.5.0"] },
    ],
  };

  test("returns library config by name", () => {
    const lib = getLibraryConfig(mockConfig, "keepsuit");

    expect(lib).toBeDefined();
    expect(lib?.name).toBe("keepsuit");
    expect(lib?.lang).toBe("php");
  });

  test("returns undefined for unknown library", () => {
    const lib = getLibraryConfig(mockConfig, "unknown");

    expect(lib).toBeUndefined();
  });
});

describe("getExcludedScenarios", () => {
  test("returns empty set when no exclusions defined", () => {
    const config: LebConfig = {
      runtimes: { php: "8.3", ruby: "3.3" },
      baseline: { library: "shopify", version: "5.6.0" },
      libraries: [
        { lang: "php", name: "keepsuit", package: "keepsuit/liquid", versions: ["1.0.0"] },
      ],
    };

    const excluded = getExcludedScenarios(config, "keepsuit");

    expect(excluded.size).toBe(0);
  });

  test("returns string exclusions for all versions", () => {
    const config: LebConfig = {
      runtimes: { php: "8.3", ruby: "3.3" },
      baseline: { library: "shopify", version: "5.6.0" },
      libraries: [
        {
          lang: "php",
          name: "keepsuit",
          package: "keepsuit/liquid",
          versions: ["1.0.0"],
          excludeScenarios: ["unit/tags/extends", "unit/filters/sum"],
        },
      ],
    };

    const excluded = getExcludedScenarios(config, "keepsuit");

    expect(excluded.size).toBe(2);
    expect(excluded.has("unit/tags/extends")).toBe(true);
    expect(excluded.has("unit/filters/sum")).toBe(true);
  });

  test("returns version-specific exclusions when version matches", () => {
    const config: LebConfig = {
      runtimes: { php: "8.3", ruby: "3.3" },
      baseline: { library: "shopify", version: "5.6.0" },
      libraries: [
        {
          lang: "php",
          name: "keepsuit",
          package: "keepsuit/liquid",
          versions: ["1.0.0", "2.0.0"],
          excludeScenarios: [
            "unit/tags/extends",
            { scenario: "unit/filters/sum", version: "1.0.0" },
          ],
        },
      ],
    };

    // For version 1.0.0, both should be excluded
    const excluded1 = getExcludedScenarios(config, "keepsuit", "1.0.0");
    expect(excluded1.size).toBe(2);
    expect(excluded1.has("unit/tags/extends")).toBe(true);
    expect(excluded1.has("unit/filters/sum")).toBe(true);

    // For version 2.0.0, only string exclusion should apply
    const excluded2 = getExcludedScenarios(config, "keepsuit", "2.0.0");
    expect(excluded2.size).toBe(1);
    expect(excluded2.has("unit/tags/extends")).toBe(true);
    expect(excluded2.has("unit/filters/sum")).toBe(false);
  });

  test("returns all exclusions when no version specified", () => {
    const config: LebConfig = {
      runtimes: { php: "8.3", ruby: "3.3" },
      baseline: { library: "shopify", version: "5.6.0" },
      libraries: [
        {
          lang: "php",
          name: "keepsuit",
          package: "keepsuit/liquid",
          versions: ["1.0.0"],
          excludeScenarios: [
            "unit/tags/extends",
            { scenario: "unit/filters/sum", version: "1.0.0" },
          ],
        },
      ],
    };

    const excluded = getExcludedScenarios(config, "keepsuit");

    expect(excluded.size).toBe(2);
  });

  test("returns empty set for unknown adapter", () => {
    const config: LebConfig = {
      runtimes: { php: "8.3", ruby: "3.3" },
      baseline: { library: "shopify", version: "5.6.0" },
      libraries: [],
    };

    const excluded = getExcludedScenarios(config, "unknown");

    expect(excluded.size).toBe(0);
  });

  test("loads excludeScenarios from actual config file", async () => {
    const config = await loadConfig();
    const excluded = getExcludedScenarios(config, "shopify");

    // shopify has unit/tags/extends excluded in leb.config.json
    expect(excluded.has("unit/tags/extends")).toBe(true);
  });
});
