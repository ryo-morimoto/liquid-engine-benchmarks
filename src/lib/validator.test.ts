/**
 * Unit tests for validator
 *
 * Tests JSON Schema validation for adapter input/output.
 * Validation functions are async due to lazy schema loading.
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
  test("accepts valid input", async () => {
    const input = {
      template: "{{ name }}",
      data: { name: "Alice" },
      iterations: 100,
      warmup: 10,
    };

    const result = await validateAdapterInput(input);
    expect(result).toEqual(input);
  });

  test("accepts empty data object", async () => {
    const input = {
      template: "Hello",
      data: {},
      iterations: 1,
      warmup: 0,
    };

    const result = await validateAdapterInput(input);
    expect(result).toEqual(input);
  });

  test("rejects missing template", async () => {
    const input = {
      data: {},
      iterations: 100,
      warmup: 10,
    };

    try {
      await validateAdapterInput(input);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterInput");
    }
  });

  test("rejects empty template", async () => {
    const input = {
      template: "",
      data: {},
      iterations: 100,
      warmup: 10,
    };

    try {
      await validateAdapterInput(input);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterInput");
    }
  });

  test("rejects iterations below minimum", async () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 0,
      warmup: 10,
    };

    try {
      await validateAdapterInput(input);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterInput");
    }
  });

  test("rejects iterations above maximum", async () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 10001,
      warmup: 10,
    };

    try {
      await validateAdapterInput(input);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterInput");
    }
  });

  test("rejects negative warmup", async () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 100,
      warmup: -1,
    };

    try {
      await validateAdapterInput(input);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterInput");
    }
  });

  test("rejects additional properties", async () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 100,
      warmup: 10,
      extra: "not allowed",
    };

    try {
      await validateAdapterInput(input);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterInput");
    }
  });
});

describe("validateAdapterOutput", () => {
  test("accepts valid output", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [1.2, 1.3, 1.1],
        render_ms: [0.5, 0.4, 0.6],
      },
    };

    const result = await validateAdapterOutput(output);
    expect(result).toEqual(output);
  });

  test("accepts output with runtime_version", async () => {
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

    const result = await validateAdapterOutput(output);
    expect(result).toEqual(output);
  });

  test("accepts output with rendered_output", async () => {
    const output = {
      library: "shopify/liquid",
      version: "5.6.0",
      lang: "ruby",
      rendered_output: "<h1>Hello World</h1>",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    const result = await validateAdapterOutput(output);
    expect(result).toEqual(output);
  });

  test("accepts output with empty rendered_output", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      rendered_output: "",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    const result = await validateAdapterOutput(output);
    expect(result).toEqual(output);
  });

  test("accepts output with multiline rendered_output", async () => {
    const output = {
      library: "shopify/liquid",
      version: "5.6.0",
      lang: "ruby",
      rendered_output: `<html>
  <body>
    <h1>Title</h1>
  </body>
</html>`,
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    const result = await validateAdapterOutput(output);
    expect(result).toEqual(output);
  });

  test("rejects invalid semver", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "1.0", // invalid: missing patch
      lang: "php",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    try {
      await validateAdapterOutput(output);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterOutput");
    }
  });

  test("rejects invalid lang", async () => {
    const output = {
      library: "some/lib",
      version: "1.0.0",
      lang: "python", // invalid: unsupported
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    try {
      await validateAdapterOutput(output);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterOutput");
    }
  });

  test("rejects empty timings arrays", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [], // invalid: requires at least 1 element
        render_ms: [0.5],
      },
    };

    try {
      await validateAdapterOutput(output);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterOutput");
    }
  });

  test("rejects negative timing values", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [-1.0], // invalid: negative value
        render_ms: [0.5],
      },
    };

    try {
      await validateAdapterOutput(output);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterOutput");
    }
  });

  test("rejects missing timings", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
    };

    try {
      await validateAdapterOutput(output);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid AdapterOutput");
    }
  });
});

describe("isValidAdapterInput", () => {
  test("returns true for valid input", async () => {
    const input = {
      template: "{{ name }}",
      data: {},
      iterations: 100,
      warmup: 10,
    };

    expect(await isValidAdapterInput(input)).toBe(true);
  });

  test("returns false for invalid input", async () => {
    const input = {
      template: "",
      data: {},
      iterations: 100,
      warmup: 10,
    };

    expect(await isValidAdapterInput(input)).toBe(false);
  });
});

describe("isValidAdapterOutput", () => {
  test("returns true for valid output", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "0.10.0",
      lang: "php",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(await isValidAdapterOutput(output)).toBe(true);
  });

  test("returns false for invalid output", async () => {
    const output = {
      library: "keepsuit/php-liquid",
      version: "invalid",
      lang: "php",
      timings: {
        parse_ms: [1.0],
        render_ms: [0.5],
      },
    };

    expect(await isValidAdapterOutput(output)).toBe(false);
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
