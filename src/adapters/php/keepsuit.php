<?php

/**
 * Keepsuit Liquid Adapter
 *
 * Benchmarks keepsuit/liquid PHP library.
 * https://github.com/keepsuit/php-liquid
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../../../vendor/autoload.php';

use Keepsuit\Liquid\EnvironmentFactory;
use Keepsuit\Liquid\Template;
use Keepsuit\Liquid\Render\RenderContext;
use Keepsuit\Liquid\FileSystems\LocalFileSystem;

// Read input from stdin
$input = readInput();
$templateSource = $input['template'];
$data = $input['data'];
$iterations = (int) $input['iterations'];
$warmup = (int) $input['warmup'];

// Partials directory for include/render tags
$partialsPath = __DIR__ . '/../../../scenarios/partials';

// Create environment with strict mode for accurate benchmarking
// FileSystem loader enables include/render tags to find partials
$environment = EnvironmentFactory::new()
    ->setFilesystem(new LocalFileSystem($partialsPath))
    ->setStrictVariables(false)
    ->setStrictFilters(false)
    ->setRethrowErrors(true)
    ->setLazyParsing(false)
    ->build();

// Run benchmark
$benchmarkResult = runBenchmark(
    parseFn: function () use ($environment, $templateSource): Template {
        return $environment->parseString($templateSource);
    },
    renderFn: function (Template $template) use ($environment, $data): string {
        $context = $environment->newRenderContext(data: $data);
        return $template->render($context);
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
    if ($package['name'] === 'keepsuit/liquid') {
        $version = ltrim($package['version'], 'v');
        break;
    }
}

// Output result
writeOutput([
    'library' => 'keepsuit/liquid',
    'version' => $version,
    'lang' => 'php',
    'runtime_version' => PHP_VERSION,
    'timings' => [
        'parse_ms' => $benchmarkResult['parse_ms'],
        'render_ms' => $benchmarkResult['render_ms'],
    ],
    'rendered_output' => $benchmarkResult['rendered_output'],
]);
