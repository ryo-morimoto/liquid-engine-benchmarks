# Liquid Template Engine Benchmarks

Performance comparison benchmarks for PHP and Ruby Liquid template engine implementations.

## Why This Project

Multiple Liquid implementations exist, but no comprehensive benchmark compares their performance.
This project provides **reproducible, fair benchmarks** with identical scenarios and real-world data.

## Target Libraries

| Language | Library | Note |
|----------|---------|------|
| Ruby | [Shopify/liquid](https://github.com/Shopify/liquid) | Official reference implementation (baseline) |
| PHP | [keepsuit/php-liquid](https://github.com/keepsuit/php-liquid) | Modern PHP 8.x implementation |
| PHP | [kalimatas/php-liquid](https://github.com/kalimatas/php-liquid) | Established PHP implementation |

## Results

<!-- CI_RESULTS_START -->

Scenario                   |     shopify (base) |           keepsuit |          kalimatas
---------------------------|--------------------|--------------------|-------------------
representative/deep-nested |             0.81ms |      2.1ms (2.55x) |      1.8ms (2.21x)
representative/easy-loop   |             0.45ms |     0.41ms (0.90x) |     0.24ms (0.54x)
representative/simple      |             0.22ms |     0.11ms (0.47x) |     0.07ms (0.30x)
representative/super-large |             18.4ms |     51.2ms (2.79x) |     39.6ms (2.15x)
<!-- CI_RESULTS_END -->

### Scenario Descriptions

| Scenario | Complexity | Description |
|----------|------------|-------------|
| [`representative/simple`](scenarios/representative/simple.liquid) | O(1) | Outputs 4 variables (`user.name`, `user.email`, `user.city`, `user.country`) with no loops or conditionals. Measures minimal template engine overhead. |
| [`representative/easy-loop`](scenarios/representative/easy-loop.liquid) | O(n) | Iterates over a product list using a `for` loop, outputting each product's `title` and `price`. n = number of products. |
| [`representative/deep-nested`](scenarios/representative/deep-nested.liquid) | O(n × m) | Nested loops iterating products and their variants, with conditional branching based on `available` flag and `price > 50` to output "Premium", "Standard", or "Out of stock". n = products, m = variants per product. |
| [`representative/super-large`](scenarios/representative/super-large.liquid) | O(n × m × k) | Full e-commerce product listing page (~800 lines). Includes statistics calculation, filter chains (`sort`, `where`, `map`), price range aggregation, variant inventory display, image gallery, pagination, and JSON output across 20 sections. |

See [scenarios/README.md](scenarios/README.md) for all scenarios including unit tests.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
