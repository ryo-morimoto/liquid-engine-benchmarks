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
composite/capture-with-loop       |                ERR |              2.8ms |              1.7ms
composite/case-in-loop            |                ERR |              6.7ms |              4.0ms
composite/filter-chain-in-loop    |                ERR |              4.1ms |              2.8ms
composite/for-with-assign         |                ERR |              5.2ms |              3.2ms
composite/for-with-if             |                ERR |              1.3ms |             0.64ms
composite/for-with-include        |                ERR |                  - |              5.0ms
composite/for-with-render         |                ERR |              8.8ms |                  -
composite/nested-for-with-filters |                ERR |             13.4ms |              7.7ms
composite/sum-vs-loop             |                ERR |              2.7ms |              1.7ms
composite/where-sort-loop         |                ERR |              1.1ms |             0.50ms
unit/filters/at-least-at-most     |                ERR |             0.74ms |             0.40ms
unit/filters/base64               |                ERR |             0.34ms |             0.32ms
unit/filters/chain                |                ERR |             0.72ms |             0.36ms
unit/filters/compact              |                ERR |             0.86ms |             0.38ms
unit/filters/concat               |                ERR |             0.60ms |             0.37ms
unit/filters/default              |                ERR |             0.61ms |             0.36ms
unit/filters/escape               |                ERR |             0.22ms |             0.29ms
unit/filters/find                 |                ERR |             0.69ms |             0.36ms
unit/filters/first-last           |                ERR |             0.56ms |             0.34ms
unit/filters/join-split           |                ERR |              2.1ms |              1.1ms
unit/filters/map                  |                ERR |             0.48ms |             0.33ms
unit/filters/math                 |                ERR |              1.0ms |             0.50ms
unit/filters/reject               |                ERR |             0.83ms |             0.43ms
unit/filters/replace              |                ERR |             0.40ms |             0.34ms
unit/filters/reverse              |                ERR |             0.59ms |             0.34ms
unit/filters/round                |                ERR |             0.52ms |             0.42ms
unit/filters/size                 |                ERR |             0.56ms |             0.35ms
unit/filters/slice                |                ERR |             0.45ms |             0.34ms
unit/filters/sort                 |                ERR |              6.6ms |              1.8ms
unit/filters/string-case          |                ERR |             0.69ms |             0.42ms
unit/filters/strip                |                ERR |             0.41ms |             0.36ms
unit/filters/sum                  |                ERR |             0.46ms |             0.33ms
unit/filters/uniq                 |                ERR |             0.81ms |             0.38ms
unit/filters/where                |                ERR |             0.93ms |             0.42ms
unit/tags/assign                  |                ERR |             0.91ms |             0.44ms
unit/tags/capture                 |                ERR |             0.75ms |             0.42ms
unit/tags/case                    |                ERR |              1.3ms |             0.56ms
unit/tags/echo                    |                ERR |             0.64ms |                  -
unit/tags/extends                 |                  - |                  - |             0.54ms
unit/tags/for                     |                ERR |              2.6ms |              1.6ms
unit/tags/for-nested              |                ERR |             12.4ms |              6.5ms
unit/tags/if-compound             |                ERR |              1.7ms |             0.71ms
unit/tags/if-nested               |                ERR |              1.9ms |             0.76ms
unit/tags/if-simple               |                ERR |             0.75ms |             0.39ms
unit/tags/include                 |                ERR |                  - |             0.53ms
unit/tags/include-with-vars       |                ERR |                  - |             0.54ms
unit/tags/liquid                  |                ERR |              1.1ms |                  -
unit/tags/render                  |                ERR |             0.68ms |                  -
unit/tags/unless                  |                ERR |             0.87ms |             0.44ms
<!-- CI_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
