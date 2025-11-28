<?php

/**
 * Kalimatas Liquid Adapter
 *
 * Benchmarks liquid/liquid (kalimatas/php-liquid) PHP library.
 * https://github.com/kalimatas/php-liquid
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../../../vendor/autoload.php';

use Liquid\Template;

// Read input from stdin
$input = readInput();
$templateSource = $input['template'];
$data = $input['data'];
$iterations = (int) $input['iterations'];
$warmup = (int) $input['warmup'];

// Run benchmark
$timings = runBenchmark(
    parseFn: function () use ($templateSource): Template {
        $template = new Template();
        $template->parse($templateSource);
        return $template;
    },
    renderFn: function (Template $template) use ($data): string {
        return $template->render($data);
    },
    iterations: $iterations,
    warmup: $warmup
);

// Get library version from Composer
$composerLock = json_decode(
    file_get_contents(__DIR__ . '/../../../composer.lock'),
    true
);
$version = '0.0.0';
foreach ($composerLock['packages'] ?? [] as $package) {
    if ($package['name'] === 'liquid/liquid') {
        $version = ltrim($package['version'], 'v');
        break;
    }
}

// Output result
writeOutput([
    'library' => 'liquid/liquid',
    'version' => $version,
    'lang' => 'php',
    'runtime_version' => PHP_VERSION,
    'timings' => $timings,
]);
