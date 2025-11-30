# Contributing

## Welcome Contributions

### Add new libraries / languages

Add Liquid implementations to benchmark. See [GitHub Issues](../../issues) for suggested libraries.

### Add benchmark scenarios

Expand test coverage. See [scenarios/README.md](scenarios/README.md) for conventions.

### Maintenance

Dependency updates, CI/CD improvements, bug fixes, runtime optimizations (OPcache, YJIT, etc.)

## Setup

```bash
# Environment (with Nix)
direnv allow              # Or: nix develop

# Install dependencies
bun install
composer install
bundle install

# Prepare database
bun src/run.ts prepare

# Run benchmarks
bun src/run.ts bench
```

## CLI Reference

```bash
bun src/run.ts --help              # Show all commands
bun src/run.ts list adapters       # List available adapters
bun src/run.ts list scenarios      # List all scenarios
bun src/run.ts list scenarios -c unit/tags  # Filter by category
```

### Running Benchmarks

```bash
# Run all benchmarks (table output)
bun src/run.ts bench

# Filter by category
bun src/run.ts bench -c representative
bun src/run.ts bench -c unit/tags

# Run single benchmark
bun src/run.ts bench shopify unit/tags/for
bun src/run.ts bench keepsuit unit/filters/map -i 500 -w 20

# Options
#   -s, --scale <size>    Data scale: small, medium, large, 2xl
#   -i, --iterations <n>  Number of measured iterations (default: 100)
#   -w, --warmup <n>      Number of warmup iterations (default: 10)
#   -f, --format <type>   Output format: table, json
#   -q, --quiet           Suppress progress output
```

### Shell composition

```bash
# Run all scenarios with a specific adapter
bun src/run.ts list scenarios | xargs -I{} bun src/run.ts bench keepsuit {}

# Run all adapters against one scenario
bun src/run.ts list adapters | xargs -I{} bun src/run.ts bench {} unit/tags/for
```

## Before PR

```bash
bun run check             # Lint and format (auto-fix)
bun test                  # Run tests
bun src/run.ts bench      # Run benchmarks (optional)
```
