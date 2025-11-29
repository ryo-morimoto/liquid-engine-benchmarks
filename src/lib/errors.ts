/**
 * CLI Error Definitions
 *
 * Defines semantic error codes and structured error types
 * for LLM-friendly error reporting.
 */

import type { RuntimeName } from "../types";

/**
 * Semantic error codes.
 * Self-descriptive for both humans and LLMs.
 */
export const ErrorCode = {
  // Environment errors (10xx)
  RUNTIME_NOT_FOUND: "RUNTIME_NOT_FOUND",
  RUNTIME_VERSION_MISMATCH: "RUNTIME_VERSION_MISMATCH",
  DEPS_NOT_INSTALLED: "DEPS_NOT_INSTALLED",

  // Adapter errors (20xx)
  ADAPTER_NOT_FOUND: "ADAPTER_NOT_FOUND",
  ADAPTER_SCRIPT_MISSING: "ADAPTER_SCRIPT_MISSING",
  ADAPTER_TIMEOUT: "ADAPTER_TIMEOUT",
  ADAPTER_CRASHED: "ADAPTER_CRASHED",
  ADAPTER_INVALID_OUTPUT: "ADAPTER_INVALID_OUTPUT",

  // Input errors (30xx)
  SCENARIO_NOT_FOUND: "SCENARIO_NOT_FOUND",
  INVALID_ARGUMENT: "INVALID_ARGUMENT",

  // Internal errors (90xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured error details for machine parsing.
 */
export interface CliErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  suggestion?: string;
}

/**
 * CLI Error class with structured information.
 */
export class CliError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly suggestion?: string;

  constructor(info: CliErrorDetails) {
    super(info.message);
    this.name = "CliError";
    this.code = info.code;
    this.details = info.details;
    this.suggestion = info.suggestion;
  }

  /**
   * Format error for human-readable output (stderr).
   */
  toHuman(): string {
    return `error: ${this.message}`;
  }

  /**
   * Format error for JSON output.
   */
  toJSON(): object {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(this.suggestion && { suggestion: this.suggestion }),
      },
    };
  }
}

/**
 * Factory functions for common errors.
 */
export const Errors = {
  /**
   * Creates error when runtime binary is not available.
   * Uses actual error message from feature-test execution.
   */
  runtimeNotFound(runtime: RuntimeName, errorMessage: string): CliError {
    return new CliError({
      code: ErrorCode.RUNTIME_NOT_FOUND,
      message: `${runtime} not found`,
      details: { runtime, reason: errorMessage },
      suggestion: `Install ${runtime === "php" ? "PHP 8.3+" : "Ruby 3.3+"}`,
    });
  },

  runtimeVersionMismatch(runtime: RuntimeName, required: string, found: string): CliError {
    return new CliError({
      code: ErrorCode.RUNTIME_VERSION_MISMATCH,
      message: `${runtime} version mismatch: requires ${required}, found ${found}`,
      details: { runtime, required_version: required, found_version: found },
      suggestion: `Upgrade ${runtime} to version ${required} or higher`,
    });
  },

  depsNotInstalled(runtime: RuntimeName, command: string): CliError {
    return new CliError({
      code: ErrorCode.DEPS_NOT_INSTALLED,
      message: `${runtime} dependencies not installed`,
      details: { runtime, install_command: command },
      suggestion: `Run '${command}' to install dependencies`,
    });
  },

  adapterScriptMissing(adapter: string, path: string): CliError {
    return new CliError({
      code: ErrorCode.ADAPTER_SCRIPT_MISSING,
      message: `adapter script not found: ${adapter}`,
      details: { adapter, expected_path: path },
      suggestion: "Check that the adapter file exists",
    });
  },

  adapterTimeout(adapter: string, timeoutMs: number): CliError {
    return new CliError({
      code: ErrorCode.ADAPTER_TIMEOUT,
      message: `adapter timed out: ${adapter}`,
      details: { adapter, timeout_ms: timeoutMs },
      suggestion: "Try reducing iterations or data scale",
    });
  },

  adapterCrashed(adapter: string, exitCode: number, stderr: string): CliError {
    return new CliError({
      code: ErrorCode.ADAPTER_CRASHED,
      message: `adapter crashed: ${adapter} (exit ${exitCode})`,
      details: { adapter, exit_code: exitCode, stderr: stderr.slice(0, 500) },
      suggestion: "Check adapter script for errors",
    });
  },

  scenarioNotFound(path: string): CliError {
    return new CliError({
      code: ErrorCode.SCENARIO_NOT_FOUND,
      message: `scenario not found: ${path}`,
      details: { scenario_path: path },
      suggestion: "Run 'leb list scenarios' to see available scenarios",
    });
  },

  invalidArgument(arg: string, reason: string): CliError {
    return new CliError({
      code: ErrorCode.INVALID_ARGUMENT,
      message: `invalid argument: ${arg} - ${reason}`,
      details: { argument: arg, reason },
    });
  },
};
