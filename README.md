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
composite/capture-with-loop       |             0.39ms |      2.8ms (7.16x) |      1.6ms (4.28x)
composite/case-in-loop            |             0.52ms |     6.6ms (12.63x) |      4.0ms (7.70x)
composite/filter-chain-in-loop    |             0.79ms |      4.1ms (5.19x) |      2.8ms (3.54x)
composite/for-with-assign         |             0.62ms |      5.4ms (8.74x) |      3.3ms (5.44x)
composite/for-with-if             |             0.35ms |      1.3ms (3.73x) |     0.63ms (1.79x)
composite/for-with-include        |             0.45ms |                  - |     4.8ms (10.47x)
composite/for-with-render         |             0.49ms |     8.8ms (17.90x) |                  -
composite/nested-for-with-filters |              1.3ms |    13.3ms (10.11x) |      7.6ms (5.78x)
composite/sum-vs-loop             |             0.36ms |      2.7ms (7.50x) |      1.7ms (4.53x)
composite/where-sort-loop         |             0.30ms |      1.1ms (3.59x) |     0.49ms (1.65x)
unit/filters/at-least-at-most     |             0.29ms |     0.72ms (2.45x) |     0.40ms (1.37x)
unit/filters/base64               |             0.28ms |     0.34ms (1.24x) |     0.32ms (1.16x)
unit/filters/chain                |             0.35ms |     0.76ms (2.15x) |     0.37ms (1.04x)
unit/filters/compact              |             0.36ms |     0.85ms (2.36x) |     0.37ms (1.03x)
unit/filters/concat               |             0.27ms |     0.60ms (2.24x) |     0.37ms (1.35x)
unit/filters/default              |             0.30ms |     0.62ms (2.10x) |     0.36ms (1.20x)
unit/filters/escape               |             0.27ms |     0.22ms (0.80x) |     0.29ms (1.06x)
unit/filters/find                 |             0.33ms |     0.70ms (2.14x) |     0.35ms (1.07x)
unit/filters/first-last           |             0.30ms |     0.55ms (1.85x) |     0.33ms (1.11x)
unit/filters/join-split           |             0.32ms |      2.1ms (6.65x) |      1.1ms (3.40x)
unit/filters/map                  |             0.36ms |     0.49ms (1.34x) |     0.32ms (0.88x)
unit/filters/math                 |             0.30ms |      1.0ms (3.44x) |     0.52ms (1.75x)
unit/filters/reject               |             0.34ms |     0.82ms (2.39x) |     0.42ms (1.23x)
unit/filters/replace              |             0.24ms |     0.40ms (1.65x) |     0.35ms (1.41x)
unit/filters/reverse              |             0.37ms |     0.58ms (1.59x) |     0.34ms (0.93x)
unit/filters/round                |             0.28ms |     0.51ms (1.82x) |     0.41ms (1.43x)
unit/filters/size                 |             0.27ms |     0.56ms (2.07x) |     0.35ms (1.27x)
unit/filters/slice                |             0.30ms |     0.46ms (1.49x) |     0.34ms (1.10x)
unit/filters/sort                 |             0.51ms |     6.5ms (12.72x) |      1.8ms (3.40x)
unit/filters/string-case          |             0.27ms |     0.68ms (2.52x) |     0.39ms (1.45x)
unit/filters/strip                |             0.26ms |     0.41ms (1.57x) |     0.37ms (1.44x)
unit/filters/sum                  |             0.37ms |     0.47ms (1.27x) |     0.33ms (0.87x)
unit/filters/uniq                 |             0.37ms |     0.83ms (2.25x) |     0.38ms (1.02x)
unit/filters/where                |             0.31ms |     0.91ms (2.93x) |     0.42ms (1.36x)
unit/tags/assign                  |             0.33ms |     0.92ms (2.76x) |     0.44ms (1.31x)
unit/tags/capture                 |             0.26ms |     0.76ms (2.93x) |     0.42ms (1.63x)
unit/tags/case                    |             0.33ms |      1.3ms (4.03x) |     0.56ms (1.72x)
unit/tags/echo                    |             0.27ms |     0.66ms (2.39x) |                  -
unit/tags/extends                 |                  - |                  - |             0.54ms
unit/tags/for                     |             0.43ms |      2.6ms (5.93x) |      1.6ms (3.70x)
unit/tags/for-nested              |             0.65ms |    12.2ms (18.78x) |      6.3ms (9.76x)
unit/tags/if-compound             |             0.36ms |      1.8ms (5.07x) |     0.63ms (1.74x)
unit/tags/if-nested               |             0.32ms |      1.9ms (5.81x) |     0.75ms (2.34x)
unit/tags/if-simple               |             0.32ms |     0.73ms (2.30x) |     0.38ms (1.21x)
unit/tags/include                 |             0.36ms |                  - |     0.53ms (1.47x)
unit/tags/include-with-vars       |             0.36ms |                  - |     0.53ms (1.47x)
unit/tags/liquid                  |             0.39ms |      1.1ms (2.78x) |                  -
unit/tags/render                  |             0.40ms |     0.67ms (1.67x) |                  -
unit/tags/unless                  |             0.28ms |     0.88ms (3.08x) |     0.43ms (1.51x)
<!-- CI_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
