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

See [scenarios/README.md](scenarios/README.md) for detailed scenario list.

## Results

<!-- CI_RESULTS_START -->

Scenario                          |     shopify (base) |           keepsuit |          kalimatas
----------------------------------|--------------------|--------------------|-------------------
composite/capture-with-loop       |             0.39ms |     0.43ms (1.11x) |     0.26ms (0.68x)
composite/case-in-loop            |             0.53ms |     0.96ms (1.82x) |     0.63ms (1.19x)
composite/filter-chain-in-loop    |             0.80ms |     0.69ms (0.86x) |     0.57ms (0.72x)
composite/for-with-assign         |             0.61ms |     0.84ms (1.38x) |     0.53ms (0.88x)
composite/for-with-if             |             0.35ms |     0.33ms (0.93x) |     0.16ms (0.45x)
composite/for-with-include        |             0.45ms |                  - |     0.76ms (1.68x)
composite/for-with-render         |             0.48ms |      1.4ms (2.89x) |                  -
composite/nested-for-with-filters |              1.3ms |      1.9ms (1.43x) |      1.2ms (0.94x)
composite/sum-vs-loop             |             0.36ms |     0.47ms (1.30x) |     0.28ms (0.76x)
composite/where-sort-loop         |             0.29ms |     0.28ms (0.98x) |     0.12ms (0.41x)
unit/filters/at-least-at-most     |             0.30ms |     0.19ms (0.63x) |     0.09ms (0.30x)
unit/filters/base64               |             0.28ms |     0.14ms (0.49x) |     0.08ms (0.30x)
unit/filters/chain                |             0.35ms |     0.20ms (0.58x) |     0.10ms (0.27x)
unit/filters/compact              |             0.37ms |     0.19ms (0.52x) |     0.09ms (0.24x)
unit/filters/concat               |             0.28ms |     0.19ms (0.68x) |     0.09ms (0.32x)
unit/filters/default              |             0.29ms |     0.17ms (0.58x) |     0.09ms (0.32x)
unit/filters/escape               |             0.27ms |     0.10ms (0.38x) |     0.07ms (0.25x)
unit/filters/find                 |             0.32ms |     0.19ms (0.57x) |     0.09ms (0.28x)
unit/filters/first-last           |             0.30ms |     0.14ms (0.48x) |     0.08ms (0.28x)
unit/filters/join-split           |             0.33ms |     0.40ms (1.23x) |     0.20ms (0.61x)
unit/filters/map                  |             0.37ms |     0.13ms (0.35x) |     0.08ms (0.22x)
unit/filters/math                 |             0.31ms |     0.24ms (0.78x) |     0.11ms (0.36x)
unit/filters/reject               |             0.32ms |     0.23ms (0.72x) |     0.11ms (0.35x)
unit/filters/replace              |             0.24ms |     0.12ms (0.50x) |     0.10ms (0.42x)
unit/filters/reverse              |             0.37ms |     0.14ms (0.38x) |     0.08ms (0.22x)
unit/filters/round                |             0.29ms |     0.15ms (0.52x) |     0.09ms (0.31x)
unit/filters/size                 |             0.28ms |     0.16ms (0.57x) |     0.08ms (0.31x)
unit/filters/slice                |             0.32ms |     0.14ms (0.45x) |     0.09ms (0.27x)
unit/filters/sort                 |             0.52ms |     0.80ms (1.55x) |     0.29ms (0.57x)
unit/filters/string-case          |             0.27ms |     0.17ms (0.64x) |     0.08ms (0.31x)
unit/filters/strip                |             0.24ms |     0.15ms (0.63x) |     0.09ms (0.38x)
unit/filters/sum                  |             0.37ms |     0.13ms (0.36x) |     0.08ms (0.22x)
unit/filters/uniq                 |             0.37ms |     0.19ms (0.52x) |     0.09ms (0.25x)
unit/filters/where                |             0.32ms |     0.26ms (0.81x) |     0.11ms (0.34x)
unit/tags/assign                  |             0.31ms |     0.22ms (0.70x) |     0.10ms (0.31x)
unit/tags/capture                 |             0.29ms |     0.20ms (0.69x) |     0.09ms (0.32x)
unit/tags/case                    |             0.31ms |     0.31ms (0.98x) |     0.13ms (0.42x)
unit/tags/echo                    |             0.28ms |     0.18ms (0.64x) |                  -
unit/tags/extends                 |                  - |                  - |             0.14ms
unit/tags/for                     |             0.43ms |     0.40ms (0.93x) |     0.25ms (0.57x)
unit/tags/for-nested              |             0.65ms |      1.6ms (2.42x) |     0.90ms (1.39x)
unit/tags/if-compound             |             0.36ms |     0.35ms (0.98x) |     0.14ms (0.38x)
unit/tags/if-nested               |             0.32ms |     0.39ms (1.22x) |     0.17ms (0.52x)
unit/tags/if-simple               |             0.32ms |     0.22ms (0.68x) |     0.11ms (0.34x)
unit/tags/include                 |             0.36ms |                  - |     0.16ms (0.44x)
unit/tags/include-with-vars       |             0.37ms |                  - |     0.16ms (0.43x)
unit/tags/liquid                  |             0.39ms |     0.29ms (0.74x) |                  -
unit/tags/render                  |             0.38ms |     0.22ms (0.57x) |                  -
unit/tags/unless                  |             0.32ms |     0.24ms (0.75x) |     0.11ms (0.36x)
<!-- CI_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
