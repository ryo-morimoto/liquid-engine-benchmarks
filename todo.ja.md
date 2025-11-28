# Liquid Benchmark Project

PHP と Ruby の Liquid テンプレートエンジン実装のパフォーマンス比較

## 依存関係

```
素材準備 ─────┬─────→ ベンチマーク実装 ─→ 実行基盤 ─→ 自動化
開発環境 ─────┘
ドキュメント（独立）
```

## 進捗

### 素材準備（並行可能）

- [ ] [テストデータ](docs/plans/assets.ja.md#テストデータ) - data/*.yml
- [ ] [テンプレート](docs/plans/assets.ja.md#テンプレート) - templates/**/*.liquid

### 開発環境（並行可能）

- [ ] [環境構築](docs/plans/environment.ja.md#環境構築) - shell.nix, .envrc
- [ ] [ライブラリ管理](docs/plans/environment.ja.md#ライブラリ管理) - vendors/, setup-vendors.sh

### エントリーポイント実装（素材準備 + 開発環境 完了後）

- [ ] [エントリーポイント](docs/plans/entrypoint.ja.md) - src/

### 実行基盤（エントリーポイント実装 完了後）

- [ ] [実行スクリプト](docs/plans/execution.ja.md#実行スクリプト) - scripts/*.sh
- [ ] [結果出力](docs/plans/execution.ja.md#結果出力) - results/

### 自動化（実行基盤 完了後）

- [ ] [CI/CD](docs/plans/automation.ja.md#cicd) - .github/workflows/

### ドキュメント（独立）

- [ ] [README・CONTRIBUTING](docs/plans/documentation.ja.md) - README.md, CONTRIBUTING.md
