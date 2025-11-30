# Contributing

## Welcome Contributions

### Add new libraries / languages

Add Liquid implementations to benchmark. See [GitHub Issues](../../issues) for suggested libraries.

### Add benchmark scenarios

Expand test coverage. See [scenarios/README.md](scenarios/README.md) for conventions.

### Maintenance

Dependency updates, CI/CD improvements, bug fixes, runtime optimizations (OPcache, YJIT, etc.)

## Setup

### With Nix (recommended)

```bash
# Using direnv (auto-activates on cd)
direnv allow

# Or manually
nix develop
```

### Install dependencies

```bash
bun install
bun src/run.ts setup      # Generate dependency files + seed database
composer install          # PHP dependencies
bundle install            # Ruby dependencies
```

### CLI Reference

```bash
bun src/run.ts --help     # Show all commands
bun src/run.ts list       # List adapters and scenarios
bun src/run.ts bench      # Run all benchmarks
```

## Before PR

```bash
bun run check             # Lint and format (auto-fix)
bun test                  # Run tests
bun src/run.ts bench      # Run benchmarks (optional)
```
