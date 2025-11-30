# Simplify Scenarios Plan

## Overview

シナリオ管理をシンプル化し、メンテナンスコストを削減する。

## Background

### Current State

- **unit/tags/**: 15シナリオ（一部のタグで複数シナリオが存在）
- **unit/filters/**: 24シナリオ（1:1対応）
- **composite/**: 10シナリオ（複合テスト）
- **partials/**: 2シナリオ（共有パーシャル）
- **合計**: 49シナリオ

### Problems

1. 一部タグで1:n のシナリオが存在（for, if, include）
2. composite/ の目的が曖昧
3. メンテナンスコストが高い

## Changes

### 1. unit/tags/ の整理

**1:1 対応に統一**（タグ名 = ファイル名）

| Current | Action | After |
|---------|--------|-------|
| `for.liquid` | Keep | `for.liquid` |
| `for-nested.liquid` | **Delete** | - |
| `if-simple.liquid` | **Rename** | `if.liquid` |
| `if-nested.liquid` | **Delete** | - |
| `if-compound.liquid` | **Delete** | - |
| `include.liquid` | Keep | `include.liquid` |
| `include-with-vars.liquid` | **Delete** | - |
| Others | Keep | No change |

**After**: 11 scenarios (was 15)

### 2. composite/ の削除

全10シナリオを削除:

- `capture-with-loop.liquid`
- `case-in-loop.liquid`
- `filter-chain-in-loop.liquid`
- `for-with-assign.liquid`
- `for-with-if.liquid`
- `for-with-include.liquid`
- `for-with-render.liquid`
- `nested-for-with-filters.liquid`
- `sum-vs-loop.liquid`
- `where-sort-loop.liquid`

### 3. representative/ の新規作成

計算量の段階的増加を測定する4つのシナリオを作成:

| Name | Description | Complexity |
|------|-------------|------------|
| `simple.liquid` | 変数出力のみ | O(1) |
| `easy-loop.liquid` | 単純なforループ | O(n) |
| `deep-nested.liquid` | ネストループ + 条件分岐 | O(n²) |
| `super-large.liquid` | 大量データ + フィルターチェーン | O(n × m) |

### 4. ScenarioLoader の更新

```typescript
// Before
const SCENARIO_CATEGORIES = ["unit/tags", "unit/filters", "composite", "partials"] as const;

// After
const SCENARIO_CATEGORIES = ["unit/tags", "unit/filters", "representative", "partials"] as const;
```

### 5. leb.config.json の更新

`excludeScenarios` から削除されたシナリオを除去。

## Result

### Before

| Category | Count |
|----------|-------|
| unit/tags | 15 |
| unit/filters | 24 |
| composite | 10 |
| partials | 2 |
| **Total** | **49** (excludes partials) |

### After

| Category | Count |
|----------|-------|
| unit/tags | 11 |
| unit/filters | 24 |
| representative | 4 |
| partials | 2 |
| **Total** | **39** (excludes partials) |

## Implementation Checklist

- [ ] Delete `scenarios/unit/tags/for-nested.liquid`
- [ ] Rename `scenarios/unit/tags/if-simple.liquid` → `if.liquid`
- [ ] Delete `scenarios/unit/tags/if-nested.liquid`
- [ ] Delete `scenarios/unit/tags/if-compound.liquid`
- [ ] Delete `scenarios/unit/tags/include-with-vars.liquid`
- [ ] Delete `scenarios/composite/` directory
- [ ] Create `scenarios/representative/` directory
- [ ] Create `scenarios/representative/simple.liquid`
- [ ] Create `scenarios/representative/easy-loop.liquid`
- [ ] Create `scenarios/representative/deep-nested.liquid`
- [ ] Create `scenarios/representative/super-large.liquid`
- [ ] Update `src/lib/scenario/loader.ts`
- [ ] Update `leb.config.json`
- [ ] Update `scenarios/README.md`
- [ ] Run benchmarks to verify
- [ ] Update main `README.md` results
