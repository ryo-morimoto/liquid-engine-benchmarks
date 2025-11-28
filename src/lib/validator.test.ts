/**
 * Unit tests for validator
 */

import { describe, expect, test } from "bun:test";
import {
  formatErrors,
  isValidAdapterInput,
  isValidAdapterOutput,
  validateAdapterInput,
  validateAdapterOutput,
} from "./validator";

describe("validateAdapterInput", () => {
  test("accepts valid input", () => {
    const input = {
      template: "{{ name }}",
      data: { name: "Alice" },
      iterations: 100,
      warmup: 10,
    };

    expect(() => validateAdapterInput(input)).not.toThrow();
  });

  test("accepts empty data object", () => {
    const input = {
      template: "Hello",
      data: {},
      iterations: 1,
      warmup: 0,
    };

    expect(() => validateAdapterInput(input)).not.toThrow();
  });

  test("rejects missing template", () => {
    const input = {
      data: {},
      iterations: 100,
      warmup: 10,
    };

    expect(() => validateAdapterInput(input)).toThrow("Invalid AdapterInput");
  });

  test("rejects empty template", () => {
    const input = {
      template: "",
      data: {},
      iterations: 100,
      warmup: 10,
    };

    expect(() => validateAdapterInput(input)).toThrow("Invalid AdapterInput");
  });

  test("rejects iterations below minimum", () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 0,
      warmup: 10,
    };

    expect(() => validateAdapterInput(input)).toThrow("Invalid AdapterInput");
  });

  test("rejects iterations above maximum", () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 10001,
      warmup: 10,
    };

    expect(() => validateAdapterInput(input)).toThrow("Invalid AdapterInput");
  });

  test("rejects negative warmup", () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 100,
      warmup: -1,
    };

    expect(() => validateAdapterInput(input)).toThrow("Invalid AdapterInput");
  });

  test("rejects additional properties", () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 100,
      warmup: 10,
      extra: "not allowed",
    };

    expect(() => validateAdapterInput(input)).toThrow("Invalid AdapterInput");
  });
});

describe("validateAdapterOutput", () => {
  test("accepts valid output", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [1.2, 1.3, 1.1],
        render_ms: [0.5, 0.4, 0.6],
      },
    };

    expect(() => validateAdapterOutput(output)).not.toThrow();
  });

  test("accepts output with runtime_version", () => {
    const output = {
      library: "shopify/liquid",
      version: "5.6.0",
      lang: "ruby",
      runtime_version: "3.3.0",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(() => validateAdapterOutput(output)).not.toThrow();
  });

  test("rejects invalid semver", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "1.0", // invalid: missing patch
      lang: "php",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(() => validateAdapterOutput(output)).toThrow("Invalid AdapterOutput");
  });

  test("rejects invalid lang", () => {
    const output = {
      library: "some/lib",
      version: "1.0.0",
      lang: "python", // invalid: unsupported
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(() => validateAdapterOutput(output)).toThrow("Invalid AdapterOutput");
  });

  test("rejects empty timings arrays", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [], // invalid: requires at least 1 element
        render_ms: [0.5],
      },
    };

    expect(() => validateAdapterOutput(output)).toThrow("Invalid AdapterOutput");
  });

  test("rejects negative timing values", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [-1.0], // invalid: negative value
        render_ms: [0.5],
      },
    };

    expect(() => validateAdapterOutput(output)).toThrow("Invalid AdapterOutput");
  });

  test("rejects missing timings", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
    };

    expect(() => validateAdapterOutput(output)).toThrow("Invalid AdapterOutput");
  });
});

describe("isValidAdapterInput", () => {
  test("returns true for valid input", () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 100,
      warmup: 10,
    };

    expect(isValidAdapterInput(input)).toBe(true);
  });

  test("returns false for invalid input", () => {
    const input = {
      template: "",
      data: {},
      iterations: 100,
      warmup: 10,
    };

    expect(isValidAdapterInput(input)).toBe(false);
  });
});

describe("isValidAdapterOutput", () => {
  test("returns true for valid output", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(isValidAdapterOutput(output)).toBe(true);
  });

  test("returns false for invalid output", () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "invalid",
      lang: "php",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(isValidAdapterOutput(output)).toBe(false);
  });
});

describe("formatErrors", () => {
  test("formats null errors", () => {
    expect(formatErrors(null)).toBe("Unknown validation error");
  });

  test("formats undefined errors", () => {
    expect(formatErrors(undefined)).toBe("Unknown validation error");
  });
});
