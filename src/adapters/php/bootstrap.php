<?php

/**
 * PHP Adapter Bootstrap
 *
 * Common initialization for all PHP Liquid adapters.
 * Provides stdin/stdout handling and timing utilities.
 */

declare(strict_types=1);

// Force error output to stderr for debugging
// This must come before any requires to capture autoload/class errors
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
ini_set('log_errors', '0');
error_reporting(E_ALL);

// Ensure we're running from CLI
if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Error: This script must be run from CLI\n");
    exit(1);
}

/**
 * Read JSON input from stdin.
 * Validates required fields: template, data, iterations, warmup.
 *
 * @return array{template: string, data: array, iterations: int, warmup: int}
 */
function readInput(): array
{
    $input = file_get_contents('php://stdin');

    if ($input === false || $input === '') {
        fwrite(STDERR, "Error: No input received from stdin\n");
        exit(1);
    }

    $decoded = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        fwrite(STDERR, "Error: Invalid JSON input: " . json_last_error_msg() . "\n");
        exit(1);
    }

    // Validate required fields
    $required = ['template', 'data', 'iterations', 'warmup'];
    foreach ($required as $field) {
        if (!array_key_exists($field, $decoded)) {
            fwrite(STDERR, "Error: Missing required field: {$field}\n");
            exit(1);
        }
    }

    return $decoded;
}

/**
 * Write JSON output to stdout.
 * Conforms to adapter-output.schema.json.
 *
 * @param array{
 *   library: string,
 *   version: string,
 *   lang: string,
 *   runtime_version: string,
 *   timings: array{parse_ms: float[], render_ms: float[]}
 * } $output
 */
function writeOutput(array $output): void
{
    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * Measure execution time in milliseconds.
 *
 * @param callable $fn Function to measure
 * @return array{result: mixed, time_ms: float}
 */
function measureTime(callable $fn): array
{
    $start = hrtime(true);
    $result = $fn();
    $end = hrtime(true);

    // Convert nanoseconds to milliseconds
    $timeMs = ($end - $start) / 1_000_000;

    return [
        'result' => $result,
        'time_ms' => $timeMs,
    ];
}

/**
 * Run benchmark iterations.
 * Executes warmup runs (discarded) followed by measured iterations.
 *
 * @param callable $parseFn Function that parses template
 * @param callable $renderFn Function that renders template (receives parse result)
 * @param int $iterations Number of measured iterations
 * @param int $warmup Number of warmup iterations
 * @return array{parse_ms: float[], render_ms: float[]}
 */
function runBenchmark(
    callable $parseFn,
    callable $renderFn,
    int $iterations,
    int $warmup
): array {
    $parseTimings = [];
    $renderTimings = [];

    // Warmup runs (results discarded)
    for ($i = 0; $i < $warmup; $i++) {
        $parseResult = $parseFn();
        $renderFn($parseResult);
    }

    // Measured iterations
    for ($i = 0; $i < $iterations; $i++) {
        // Measure parse
        $parseData = measureTime($parseFn);
        $parseTimings[] = $parseData['time_ms'];

        // Measure render
        $renderData = measureTime(fn() => $renderFn($parseData['result']));
        $renderTimings[] = $renderData['time_ms'];
    }

    return [
        'parse_ms' => $parseTimings,
        'render_ms' => $renderTimings,
    ];
}
