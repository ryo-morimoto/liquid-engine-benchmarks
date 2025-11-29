# 自動化

GitHub Actions による CI/CD 設定。

## 依存関係

```
実行基盤 ────→ 自動化
```

---

## CI/CD

### 目的

GitHub Actions による自動テスト・ベンチマーク実行と結果記録

### 成果物

- `.github/workflows/ci.yml` - PR チェック
- `.github/workflows/benchmark.yml` - フルベンチマーク

### ワークフロー概要

| Workflow | トリガー | 用途 |
|----------|---------|------|
| ci.yml | PR to main | テスト + クイックベンチ + PRコメント |
| benchmark.yml | main push, 月次, 手動 | フルベンチマーク + Artifact保存 |

### 動的 Matrix 生成

`leb.config.json` から自動的に matrix を生成:

```
leb.config.json
├── keepsuit: ["1.0.0"]           → 1 job
├── kalimatas: ["1.5.0"]          → 1 job
└── shopify: ["5.5.0", "5.6.0"]   → 2 jobs
                                   ────────
                                   計 4 jobs 並列
```

生成される matrix:
```json
{
  "include": [
    { "adapter": "keepsuit",  "lib_version": "1.0.0", "package": "keepsuit/liquid", "lang": "php" },
    { "adapter": "kalimatas", "lib_version": "1.5.0", "package": "liquid/liquid",   "lang": "php" },
    { "adapter": "shopify",   "lib_version": "5.5.0", "package": "liquid",          "lang": "ruby" },
    { "adapter": "shopify",   "lib_version": "5.6.0", "package": "liquid",          "lang": "ruby" }
  ],
  "runtimes": { "php": "8.3", "ruby": "3.3" }
}
```

### ci.yml

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    # Bun テスト（lint + unit tests）

  setup:
    # leb.config.json から matrix 生成
    outputs:
      matrix: ${{ steps.gen.outputs.matrix }}

  bench:
    needs: [test, setup]
    strategy:
      matrix: ${{ fromJson(needs.setup.outputs.matrix) }}
    # アダプター/バージョンごとにクイックベンチ実行

  comment:
    needs: bench
    # 結果を集約してPRコメント
```

### benchmark.yml

```yaml
name: Benchmark

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 1 * *'  # 月次
  workflow_dispatch:
    inputs:
      scale: [small, medium, large]
      iterations: string

jobs:
  setup:
    # matrix 生成

  bench:
    strategy:
      matrix: ${{ fromJson(needs.setup.outputs.matrix) }}
    # フルベンチマーク実行

  aggregate:
    # 結果集約 + サマリー生成
```

### キャッシュ戦略

| キャッシュ対象 | キー |
|--------------|------|
| Bun | `bun.lock` hash |
| Composer | `package:version` |
| Bundler | `package:version` |

### 成果物保存

- クイックベンチ結果: 7日間保持
- フルベンチ結果: 90日間保持
- ファイル名: `benchmark-{timestamp}`

### 検証項目

- [x] ci.yml 構文正常
- [x] benchmark.yml 構文正常
- [ ] PR チェック成功
- [ ] main マージ時ベンチ成功
- [ ] 月次スケジュール動作確認
- [ ] 手動実行成功
- [ ] キャッシュ有効化確認
- [ ] Artifact 保存確認
- [ ] PRコメント投稿確認
