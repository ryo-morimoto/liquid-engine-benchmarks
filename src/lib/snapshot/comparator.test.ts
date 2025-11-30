/**
 * Unit tests for snapshot comparator
 *
 * Tests the comparison logic between expected and actual output.
 * Focuses on exact string matching and diff generation.
 */

import { describe, expect, test } from "bun:test";
import { type CompareResult, compareSnapshots } from "./comparator";

describe("compareSnapshots", () => {
  describe("matching outputs", () => {
    test("returns match for identical strings", () => {
      const result = compareSnapshots("hello", "hello");

      expect(result.match).toBe(true);
      expect(result.diff).toBeUndefined();
    });

    test("returns match for identical multiline strings", () => {
      const content = `<html>
  <body>
    <h1>Title</h1>
  </body>
</html>`;

      const result = compareSnapshots(content, content);

      expect(result.match).toBe(true);
    });

    test("returns match for empty strings", () => {
      const result = compareSnapshots("", "");

      expect(result.match).toBe(true);
    });

    test("returns match for unicode content", () => {
      const content = "こんにちは 🌍 مرحبا";
      const result = compareSnapshots(content, content);

      expect(result.match).toBe(true);
    });
  });

  describe("non-matching outputs", () => {
    test("returns no match for different strings", () => {
      const result = compareSnapshots("expected", "actual");

      expect(result.match).toBe(false);
      expect(result.diff).toBeDefined();
    });

    test("returns no match for whitespace differences", () => {
      const result = compareSnapshots("hello world", "hello  world");

      expect(result.match).toBe(false);
    });

    test("returns no match for trailing newline difference", () => {
      const result = compareSnapshots("content\n", "content");

      expect(result.match).toBe(false);
    });

    test("returns no match for leading whitespace difference", () => {
      const result = compareSnapshots("  content", "content");

      expect(result.match).toBe(false);
    });

    test("returns no match for case differences", () => {
      const result = compareSnapshots("Hello", "hello");

      expect(result.match).toBe(false);
    });
  });

  describe("diff generation", () => {
    test("diff contains expected marker", () => {
      const result = compareSnapshots("expected", "actual");

      expect(result.diff).toContain("expected");
    });

    test("diff contains actual marker", () => {
      const result = compareSnapshots("expected", "actual");

      expect(result.diff).toContain("actual");
    });

    test("diff shows line differences for multiline content", () => {
      const expected = `line1
line2
line3`;
      const actual = `line1
modified
line3`;

      const result = compareSnapshots(expected, actual);

      expect(result.match).toBe(false);
      expect(result.diff).toBeDefined();
      // Diff should indicate the changed line
      expect(result.diff).toContain("line2");
      expect(result.diff).toContain("modified");
    });

    test("diff shows added lines", () => {
      const expected = "line1\nline2";
      const actual = "line1\nline2\nline3";

      const result = compareSnapshots(expected, actual);

      expect(result.match).toBe(false);
      expect(result.diff).toContain("line3");
    });

    test("diff shows removed lines", () => {
      const expected = "line1\nline2\nline3";
      const actual = "line1\nline2";

      const result = compareSnapshots(expected, actual);

      expect(result.match).toBe(false);
      expect(result.diff).toContain("line3");
    });
  });

  describe("edge cases", () => {
    test("handles very long content", () => {
      const longContent = "x".repeat(100000);
      const result = compareSnapshots(longContent, longContent);

      expect(result.match).toBe(true);
    });

    test("handles content with special characters", () => {
      const content = "<script>alert('xss')</script> & < > \" '";
      const result = compareSnapshots(content, content);

      expect(result.match).toBe(true);
    });

    test("handles content with CRLF line endings", () => {
      const crlf = "line1\r\nline2";
      const lf = "line1\nline2";

      const result = compareSnapshots(crlf, lf);

      // CRLF vs LF should be detected as different
      expect(result.match).toBe(false);
    });
  });
});

describe("CompareResult type", () => {
  test("match result has correct shape", () => {
    const result: CompareResult = { match: true };

    expect(result.match).toBe(true);
    expect(result.diff).toBeUndefined();
  });

  test("non-match result has correct shape", () => {
    const result: CompareResult = { match: false, diff: "some diff" };

    expect(result.match).toBe(false);
    expect(result.diff).toBe("some diff");
  });
});
