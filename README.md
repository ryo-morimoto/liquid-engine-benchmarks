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
composite/capture-with-loop       |             0.41ms |     0.44ms (1.08x) |     0.26ms (0.64x)
composite/case-in-loop            |             0.51ms |      1.0ms (1.95x) |     0.64ms (1.24x)
composite/filter-chain-in-loop    |             0.81ms |     0.67ms (0.84x) |     0.52ms (0.65x)
composite/for-with-assign         |             0.61ms |     0.82ms (1.34x) |     0.52ms (0.86x)
composite/for-with-if             |             0.35ms |     0.32ms (0.94x) |     0.16ms (0.45x)
composite/for-with-include        |             0.46ms |                  - |     0.76ms (1.66x)
composite/for-with-render         |             0.48ms |      1.4ms (2.90x) |                  -
composite/nested-for-with-filters |              1.3ms |      1.9ms (1.43x) |      1.3ms (0.94x)
composite/sum-vs-loop             |             0.37ms |     0.47ms (1.27x) |     0.28ms (0.76x)
composite/where-sort-loop         |             0.29ms |     0.30ms (1.04x) |     0.13ms (0.43x)
unit/filters/at-least-at-most     |             0.30ms |     0.20ms (0.69x) |     0.09ms (0.32x)
unit/filters/base64               |             0.28ms |     0.14ms (0.51x) |     0.08ms (0.30x)
unit/filters/chain                |             0.36ms |     0.21ms (0.58x) |     0.09ms (0.26x)
unit/filters/compact              |             0.37ms |     0.19ms (0.52x) |     0.09ms (0.25x)
unit/filters/concat               |             0.27ms |     0.19ms (0.68x) |     0.09ms (0.33x)
unit/filters/default              |             0.29ms |     0.18ms (0.61x) |     0.09ms (0.31x)
unit/filters/escape               |             0.27ms |     0.09ms (0.34x) |     0.06ms (0.23x)
unit/filters/find                 |             0.33ms |     0.19ms (0.58x) |     0.09ms (0.27x)
unit/filters/first-last           |             0.30ms |     0.14ms (0.48x) |     0.09ms (0.29x)
unit/filters/join-split           |             0.33ms |     0.39ms (1.17x) |     0.19ms (0.58x)
unit/filters/map                  |             0.37ms |     0.13ms (0.34x) |     0.08ms (0.22x)
unit/filters/math                 |             0.31ms |     0.24ms (0.78x) |     0.11ms (0.35x)
unit/filters/reject               |             0.32ms |     0.24ms (0.76x) |     0.11ms (0.35x)
unit/filters/replace              |             0.24ms |     0.12ms (0.51x) |     0.07ms (0.29x)
unit/filters/reverse              |             0.38ms |     0.15ms (0.39x) |     0.08ms (0.22x)
unit/filters/round                |             0.28ms |     0.17ms (0.60x) |     0.10ms (0.35x)
unit/filters/size                 |             0.27ms |     0.16ms (0.58x) |     0.08ms (0.31x)
unit/filters/slice                |             0.30ms |     0.14ms (0.47x) |     0.09ms (0.29x)
unit/filters/sort                 |             0.52ms |     0.79ms (1.53x) |     0.29ms (0.57x)
unit/filters/string-case          |             0.28ms |     0.18ms (0.63x) |     0.09ms (0.31x)
unit/filters/strip                |             0.23ms |     0.15ms (0.62x) |     0.09ms (0.36x)
unit/filters/sum                  |             0.37ms |     0.14ms (0.37x) |     0.08ms (0.23x)
unit/filters/uniq                 |             0.37ms |     0.19ms (0.50x) |     0.09ms (0.25x)
unit/filters/where                |             0.32ms |     0.26ms (0.80x) |     0.11ms (0.35x)
unit/tags/assign                  |             0.32ms |     0.22ms (0.70x) |     0.10ms (0.31x)
unit/tags/capture                 |             0.27ms |     0.19ms (0.70x) |     0.09ms (0.34x)
unit/tags/case                    |             0.34ms |     0.32ms (0.94x) |     0.14ms (0.41x)
unit/tags/echo                    |             0.28ms |     0.18ms (0.64x) |                  -
unit/tags/extends                 |                  - |                  - |             0.14ms
unit/tags/for                     |             0.43ms |     0.40ms (0.94x) |     0.25ms (0.58x)
unit/tags/for-nested              |             0.65ms |      1.5ms (2.36x) |     0.90ms (1.38x)
unit/tags/if-compound             |             0.39ms |     0.36ms (0.91x) |     0.14ms (0.36x)
unit/tags/if-nested               |             0.33ms |     0.39ms (1.16x) |     0.17ms (0.50x)
unit/tags/if-simple               |             0.32ms |     0.21ms (0.66x) |     0.11ms (0.33x)
unit/tags/include                 |             0.37ms |                  - |     0.17ms (0.46x)
unit/tags/include-with-vars       |             0.38ms |                  - |     0.16ms (0.43x)
unit/tags/liquid                  |             0.41ms |     0.29ms (0.71x) |                  -
unit/tags/render                  |             0.38ms |     0.22ms (0.57x) |                  -
unit/tags/unless                  |             0.30ms |     0.23ms (0.77x) |     0.11ms (0.37x)
<!-- CI_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
