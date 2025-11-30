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
├── representative/ # Scalability tests (simple to super-large)
└── partials/       # Shared partials
```

## Scenario Categories

### unit/tags/ (11 files)

Scenarios for individual Liquid tags (1:1 mapping with tag names):

| File | Tag | Description |
|------|-----|-------------|
| `for.liquid` | for | Loop iteration |
| `if.liquid` | if | Conditional logic |
| `unless.liquid` | unless | Negated conditional |
| `case.liquid` | case/when | Switch-style conditional |
| `assign.liquid` | assign | Variable assignment |
| `capture.liquid` | capture | String capture |
| `include.liquid` | include | Partial inclusion |
| `render.liquid` | render | Scope-isolated partial |
| `echo.liquid` | echo | Alternative output syntax |
| `liquid.liquid` | liquid | Multi-line syntax |
| `extends.liquid` | extends/block | Template inheritance |

### unit/filters/

Tests individual Liquid filters or closely related filter groups. Measures the overhead of data transformation operations (e.g., array manipulation, string processing, math operations).

### representative/ (4 files)

Scalability tests measuring performance across different complexity levels:

| File | Complexity | Description |
|------|------------|-------------|
| `simple.liquid` | O(1) | Variable output only, minimal overhead |
| `easy-loop.liquid` | O(n) | Basic for loop iteration |
| `deep-nested.liquid` | O(n × m) | Nested loops with conditionals |
| `super-large.liquid` | O(n × m × k) | Full e-commerce page (~800 lines) |

### partials/ (2 files)

Shared partials for include/render scenarios:

- `product_card.liquid` - Product display component
- `base_layout.liquid` - Base layout for extends/block

## Feature Support

Feature support is detected at runtime via dry-run execution.
Scenarios using unsupported features will throw `UnimplementedError` and be skipped.

## Data Requirements

See `src/db/schema.ts` for DDL and `src/db/types.ts` for data structures.
