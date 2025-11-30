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

Scenario                   |     shopify (base) |           keepsuit |          kalimatas
---------------------------|--------------------|--------------------|-------------------
representative/deep-nested |             0.79ms |      2.1ms (2.68x) |      1.8ms (2.26x)
representative/easy-loop   |             0.43ms |     0.39ms (0.91x) |     0.25ms (0.57x)
representative/simple      |             0.23ms |     0.10ms (0.45x) |     0.07ms (0.29x)
representative/super-large |             18.6ms |     51.8ms (2.78x) |     40.1ms (2.15x)
<!-- CI_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
