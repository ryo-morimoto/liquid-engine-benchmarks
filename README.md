# Liquid Template Engine Benchmarks

Performance comparison benchmarks for PHP and Ruby Liquid template engine implementations.

## Why This Project

Multiple Liquid implementations exist, but no comprehensive benchmark compares their performance.
This project provides **reproducible, fair benchmarks** with identical scenarios and real-world data.

## Target Libraries

| Language | Library | Note |
|----------|---------|------|
| Ruby | [Shopify/liquid](https://github.com/Shopify/liquid) | Official reference implementation |
| PHP | [keepsuit/php-liquid](https://github.com/keepsuit/php-liquid) | Modern PHP 8.x implementation |
| PHP | [kalimatas/php-liquid](https://github.com/kalimatas/php-liquid) | Established PHP implementation |

## Benchmark Scenarios

```
scenarios/
├── unit/tags/       # Tag tests (for, if, include, etc.)
├── unit/filters/    # Filter tests (map, where, sort, etc.)
├── composite/       # Combined feature tests
└── partials/        # Shared partials
```

| Category | Count | Description |
|----------|-------|-------------|
| **unit/tags** | 15 | Individual tag performance |
| **unit/filters** | 24 | Individual filter performance |
| **composite** | 10 | Feature combinations |
| **partials** | 2 | Shared template components |

See [scenarios/README.md](scenarios/README.md) for detailed scenario list.

## Results

<!-- CI_RESULTS_START -->

Scenario                          |     shopify (base) |           keepsuit |          kalimatas
----------------------------------|--------------------|--------------------|-------------------
composite/capture-with-loop       |             0.40ms |      2.8ms (7.10x) |      1.7ms (4.18x)
composite/case-in-loop            |             0.52ms |     6.7ms (12.89x) |      4.0ms (7.78x)
composite/filter-chain-in-loop    |             0.80ms |      4.1ms (5.06x) |      2.9ms (3.63x)
composite/for-with-assign         |             0.61ms |      5.3ms (8.71x) |      3.3ms (5.40x)
composite/for-with-if             |             0.36ms |      1.3ms (3.65x) |     0.67ms (1.86x)
composite/for-with-include        |             0.47ms |                  - |     4.7ms (10.02x)
composite/for-with-render         |             0.48ms |     8.8ms (18.34x) |                  -
composite/nested-for-with-filters |              1.4ms |     13.4ms (9.91x) |      7.8ms (5.76x)
composite/sum-vs-loop             |             0.38ms |      2.7ms (7.16x) |      1.6ms (4.29x)
composite/where-sort-loop         |             0.30ms |      1.1ms (3.59x) |     0.48ms (1.61x)
unit/filters/at-least-at-most     |             0.29ms |     0.75ms (2.54x) |     0.40ms (1.34x)
unit/filters/base64               |             0.28ms |     0.35ms (1.22x) |     0.32ms (1.15x)
unit/filters/chain                |             0.37ms |     0.74ms (2.01x) |     0.36ms (0.99x)
unit/filters/compact              |             0.37ms |     0.87ms (2.32x) |     0.37ms (1.00x)
unit/filters/concat               |             0.30ms |     0.60ms (2.03x) |     0.36ms (1.23x)
unit/filters/default              |             0.30ms |     0.64ms (2.12x) |     0.36ms (1.20x)
unit/filters/escape               |             0.27ms |     0.21ms (0.78x) |     0.29ms (1.08x)
unit/filters/find                 |             0.34ms |     0.69ms (2.03x) |     0.35ms (1.04x)
unit/filters/first-last           |             0.31ms |     0.56ms (1.80x) |     0.33ms (1.08x)
unit/filters/join-split           |             0.33ms |      2.1ms (6.43x) |      1.2ms (3.67x)
unit/filters/map                  |             0.36ms |     0.47ms (1.30x) |     0.32ms (0.89x)
unit/filters/math                 |             0.31ms |      1.0ms (3.32x) |     0.52ms (1.68x)
unit/filters/reject               |             0.33ms |     0.82ms (2.48x) |     0.42ms (1.28x)
unit/filters/replace              |             0.26ms |     0.40ms (1.56x) |     0.34ms (1.31x)
unit/filters/reverse              |             0.42ms |     0.59ms (1.43x) |     0.33ms (0.78x)
unit/filters/round                |             0.28ms |     0.52ms (1.86x) |     0.42ms (1.48x)
unit/filters/size                 |             0.28ms |     0.56ms (2.00x) |     0.35ms (1.23x)
unit/filters/slice                |             0.31ms |     0.46ms (1.50x) |     0.34ms (1.13x)
unit/filters/sort                 |             0.51ms |     6.7ms (13.12x) |      1.8ms (3.53x)
unit/filters/string-case          |             0.27ms |     0.69ms (2.58x) |     0.40ms (1.48x)
unit/filters/strip                |             0.23ms |     0.41ms (1.77x) |     0.37ms (1.58x)
unit/filters/sum                  |             0.37ms |     0.47ms (1.26x) |     0.33ms (0.87x)
unit/filters/uniq                 |             0.37ms |     0.82ms (2.24x) |     0.38ms (1.03x)
unit/filters/where                |             0.32ms |     0.93ms (2.95x) |     0.44ms (1.39x)
unit/tags/assign                  |             0.30ms |     0.96ms (3.20x) |     0.45ms (1.50x)
unit/tags/capture                 |             0.28ms |     0.78ms (2.83x) |     0.42ms (1.52x)
unit/tags/case                    |             0.32ms |      1.3ms (4.17x) |     0.55ms (1.71x)
unit/tags/echo                    |             0.33ms |     0.65ms (1.98x) |                  -
unit/tags/extends                 |                  - |                  - |             0.54ms
unit/tags/for                     |             0.45ms |      2.5ms (5.61x) |      1.6ms (3.52x)
unit/tags/for-nested              |             0.65ms |    12.3ms (18.84x) |      6.4ms (9.91x)
unit/tags/if-compound             |             0.36ms |      1.7ms (4.77x) |     0.62ms (1.71x)
unit/tags/if-nested               |             0.33ms |      1.9ms (5.70x) |     0.76ms (2.33x)
unit/tags/if-simple               |             0.32ms |     0.73ms (2.25x) |     0.40ms (1.23x)
unit/tags/include                 |             0.37ms |                  - |     0.53ms (1.43x)
unit/tags/include-with-vars       |             0.38ms |                  - |     0.55ms (1.43x)
unit/tags/liquid                  |             0.40ms |      1.1ms (2.74x) |                  -
unit/tags/render                  |             0.39ms |     0.69ms (1.75x) |                  -
unit/tags/unless                  |             0.33ms |     0.89ms (2.69x) |     0.44ms (1.33x)
<!-- CI_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
