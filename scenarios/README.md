# Benchmark Scenarios

Liquid template scenarios for benchmarking different Liquid engine implementations.

## Design Principles

- **Isolation**: Each scenario tests a specific feature or combination
- **Reproducibility**: Identical templates and data across all implementations
- **Real-world relevance**: Scenarios reflect common usage patterns

## Directory Structure

```
scenarios/
├── unit/           # Single feature tests
│   ├── tags/       # Tag-specific tests (for, if, include, etc.)
│   └── filters/    # Filter-specific tests (map, where, sum, etc.)
├── composite/      # Combined feature tests
└── partials/       # Shared partials for include/render
```

## Scenario Categories

### unit/tags/

Tests individual Liquid tags in isolation. Each scenario focuses on a single tag's performance characteristics (e.g., loop iteration, conditionals, variable assignment).

### unit/filters/

Tests individual Liquid filters or closely related filter groups. Measures the overhead of data transformation operations (e.g., array manipulation, string processing, math operations).

### composite/

Tests realistic combinations of multiple features. Measures how tags and filters perform together in common patterns (e.g., filtering data then iterating, conditionals inside loops).

### partials/

Shared template components used by include/render scenarios. Not benchmarked directly.

## Naming Conventions

- `{feature}.liquid` - Basic usage of a feature (e.g., `for.liquid`, `map.liquid`)
- `{feature}-{variant}.liquid` - Variant of a feature (e.g., `if-nested.liquid`, `if-compound.liquid`)
- `{feature}-with-{feature}.liquid` - Feature combinations (e.g., `for-with-if.liquid`)

## Feature Support

Feature support is detected at runtime via dry-run execution.
Scenarios using unsupported features will throw `UnimplementedError` and be skipped.

## Data Requirements

See `src/db/schema.ts` for DDL and `src/db/types.ts` for data structures.
