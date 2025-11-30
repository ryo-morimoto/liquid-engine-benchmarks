/**
 * Unit tests for setup CLI command
 */

import { describe, expect, test } from "bun:test";
import type { LebConfig } from "../lib";
import { generateComposerJson, generateGemfile } from "./setup";

const mockConfig: LebConfig = {
  runtimes: { php: "8.3", ruby: "3.3" },
  baseline: { library: "shopify", version: "5.6.0" },
  libraries: [
    { lang: "php", name: "keepsuit", package: "keepsuit/liquid", version: "1.0.0" },
    { lang: "php", name: "kalimatas", package: "liquid/liquid", version: "1.5.0" },
    { lang: "ruby", name: "shopify", package: "liquid", version: "5.6.0" },
  ],
};

describe("generateComposerJson", () => {
  test("generates valid JSON", () => {
    const result = generateComposerJson(mockConfig);

    expect(() => JSON.parse(result)).not.toThrow();
  });

  test("includes project name", () => {
    const result = generateComposerJson(mockConfig);
    const json = JSON.parse(result);

    expect(json.name).toBe("liquid-engine-benchmarks/adapters");
  });

  test("includes PHP version requirement", () => {
    const result = generateComposerJson(mockConfig);
    const json = JSON.parse(result);

    expect(json.require.php).toBe(">=8.3");
  });

  test("includes all PHP libraries with version", () => {
    const result = generateComposerJson(mockConfig);
    const json = JSON.parse(result);

    expect(json.require["keepsuit/liquid"]).toBe("1.0.0");
    expect(json.require["liquid/liquid"]).toBe("1.5.0");
  });

  test("excludes Ruby libraries", () => {
    const result = generateComposerJson(mockConfig);
    const json = JSON.parse(result);

    expect(json.require.liquid).toBeUndefined();
  });

  test("includes config options", () => {
    const result = generateComposerJson(mockConfig);
    const json = JSON.parse(result);

    expect(json.config["optimize-autoloader"]).toBe(true);
    expect(json.config["sort-packages"]).toBe(true);
  });
});

describe("generateGemfile", () => {
  test("includes frozen_string_literal", () => {
    const result = generateGemfile(mockConfig);

    expect(result).toContain("# frozen_string_literal: true");
  });

  test("includes rubygems source", () => {
    const result = generateGemfile(mockConfig);

    expect(result).toContain('source "https://rubygems.org"');
  });

  test("includes Ruby libraries with version", () => {
    const result = generateGemfile(mockConfig);

    expect(result).toContain('gem "liquid", "5.6.0"');
  });

  test("excludes PHP libraries", () => {
    const result = generateGemfile(mockConfig);

    expect(result).not.toContain("keepsuit");
    expect(result).not.toContain("kalimatas");
  });

  test("ends with newline", () => {
    const result = generateGemfile(mockConfig);

    expect(result.endsWith("\n")).toBe(true);
  });
});
