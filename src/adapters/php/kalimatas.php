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
use Liquid\FileSystem\Local as LocalFileSystem;
use Liquid\Liquid;

// Read input from stdin
$input = readInput();
$templateSource = $input['template'];
$data = $input['data'];
$iterations = (int) $input['iterations'];
$warmup = (int) $input['warmup'];

// Partials directory for include/render tags
$partialsPath = __DIR__ . '/../../../scenarios/partials';

// Configure Liquid to not require underscore prefix for partials
// Default is '_' which would look for '_product-card.liquid' instead of 'product-card.liquid'
Liquid::set('INCLUDE_PREFIX', '');

// Create FileSystem loader for partials
$fileSystem = new LocalFileSystem($partialsPath);

// Run benchmark
$benchmarkResult = runBenchmark(
    parseFn: function () use ($templateSource, $fileSystem): Template {
        $template = new Template();
        $template->setFileSystem($fileSystem);
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
    'timings' => [
        'parse_ms' => $benchmarkResult['parse_ms'],
        'render_ms' => $benchmarkResult['render_ms'],
    ],
    'rendered_output' => $benchmarkResult['rendered_output'],
]);
