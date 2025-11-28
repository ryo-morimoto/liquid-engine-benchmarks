# Benchmark Scenarios

Liquid template scenarios for benchmarking different Liquid engine implementations.

## Directory Structure

```
scenarios/
├── unit/           # Single feature tests
│   ├── tags/       # Tag-specific tests (for, if, include, etc.)
│   └── filters/    # Filter-specific tests (map, where, sum, etc.)
├── composite/      # Combined feature tests
└── partials/       # Shared partials
```

## Scenario Categories

### unit/tags/ (15 files)

Scenarios for individual Liquid tags:

| File | Tag | Description |
|------|-----|-------------|
| `for.liquid` | for | Basic loop iteration |
| `for-nested.liquid` | for | Nested loops |
| `if-simple.liquid` | if | Basic conditional |
| `if-nested.liquid` | if | Deeply nested conditionals |
| `if-compound.liquid` | if | Compound conditions (and/or) |
| `unless.liquid` | unless | Negated conditional |
| `case.liquid` | case/when | Switch-style conditional |
| `assign.liquid` | assign | Variable assignment |
| `capture.liquid` | capture | String capture |
| `include.liquid` | include | Partial inclusion |
| `include-with-vars.liquid` | include | Partial with parameters |
| `render.liquid` | render | Scope-isolated partial |
| `echo.liquid` | echo | Alternative output syntax |
| `liquid.liquid` | liquid | Multi-line syntax |
| `extends.liquid` | extends/block | Template inheritance |

### unit/filters/ (24 files)

Scenarios for individual Liquid filters:

| File | Filter(s) | Description |
|------|-----------|-------------|
| `map.liquid` | map | Extract property from array |
| `where.liquid` | where | Filter array by property |
| `sort.liquid` | sort | Sort array |
| `size.liquid` | size | Get length |
| `first-last.liquid` | first, last | Array boundaries |
| `join-split.liquid` | join, split | String operations |
| `string-case.liquid` | upcase, downcase, capitalize | Case transformation |
| `math.liquid` | plus, minus, times, divided_by, modulo | Arithmetic |
| `round.liquid` | round, floor, ceil | Number rounding |
| `default.liquid` | default | Fallback value |
| `escape.liquid` | escape, escape_once | HTML escaping |
| `strip.liquid` | strip, lstrip, rstrip | Whitespace removal |
| `replace.liquid` | replace, replace_first, remove | String replacement |
| `slice.liquid` | slice | Substring/array slice |
| `concat.liquid` | concat | Array concatenation |
| `reverse.liquid` | reverse | Reverse array |
| `uniq.liquid` | uniq | Remove duplicates |
| `compact.liquid` | compact | Remove nil values |
| `chain.liquid` | (multiple) | Filter chaining |
| `sum.liquid` | sum | Sum array values |
| `find.liquid` | find | Find element |
| `reject.liquid` | reject | Inverse filter |
| `at-least-at-most.liquid` | at_least, at_most | Number clamping |
| `base64.liquid` | base64_encode, base64_decode | Base64 encoding |

### composite/ (10 files)

Scenarios for feature combinations:

| File | Combination | Description |
|------|-------------|-------------|
| `for-with-if.liquid` | for + if | Conditional inside loop |
| `for-with-include.liquid` | for + include | Partial inside loop |
| `for-with-render.liquid` | for + render | Scope-isolated partial in loop |
| `for-with-assign.liquid` | for + assign | Variable assignment in loop |
| `filter-chain-in-loop.liquid` | for + filters | Filter chain per iteration |
| `nested-for-with-filters.liquid` | for + for + filters | Double loop with filters |
| `where-sort-loop.liquid` | where + sort + for | Filter then iterate |
| `capture-with-loop.liquid` | capture + for | Build string in loop |
| `case-in-loop.liquid` | for + case | Switch inside loop |
| `sum-vs-loop.liquid` | for + plus | Manual sum accumulation |

### partials/ (2 files)

Shared partials for include/render scenarios:

- `product-card.liquid` - Product display component
- `base-layout.liquid` - Base layout for extends/block

## Feature Support

Feature support is detected at runtime via dry-run execution.
Scenarios using unsupported features will throw `UnimplementedError` and be skipped.

## Data Requirements

See `data/schema.ts` for data structure.
