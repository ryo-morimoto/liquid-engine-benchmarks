# 自動化

GitHub Actions による CI/CD 設定。

## 依存関係

```
実行基盤 ────→ 自動化
```

---

## CI/CD

### 目的

GitHub Actions による自動ベンチマーク実行と結果記録

### 成果物

- .github/workflows/benchmark.yml
- .github/workflows/pr-check.yml

### .github/workflows/benchmark.yml

```yaml
name: Benchmark

on:
  # 手動実行
  workflow_dispatch:
    inputs:
      profile:
        description: 'Benchmark profile'
        required: true
        default: 'standard'
        type: choice
        options:
          - quick
          - standard
          - precise
  # スケジュール実行（週次）
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜 00:00 UTC

jobs:
  benchmark:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # Nix セットアップ
      - uses: cachix/install-nix-action@v25
        with:
          nix_path: nixpkgs=channel:nixos-24.05

      # 依存関係キャッシュ
      - name: Cache vendors
        uses: actions/cache@v4
        with:
          path: vendors
          key: vendors-${{ hashFiles('scripts/setup-vendors.sh') }}

      - name: Cache PHP dependencies
        uses: actions/cache@v4
        with:
          path: php/vendor
          key: php-${{ hashFiles('php/composer.lock') }}

      - name: Cache Ruby dependencies
        uses: actions/cache@v4
        with:
          path: ruby/vendor/bundle
          key: ruby-${{ hashFiles('ruby/Gemfile.lock') }}

      # セットアップ
      - name: Setup vendors
        run: nix-shell --run "./scripts/setup-vendors.sh"

      - name: Install PHP dependencies
        run: nix-shell --run "cd php && composer install"

      - name: Install Ruby dependencies
        run: nix-shell --run "cd ruby && bundle install"

      # ベンチマーク実行
      - name: Run PHP benchmarks
        run: |
          nix-shell --run "./scripts/bench-php.sh ${{ inputs.profile || 'standard' }}"

      - name: Run Ruby benchmarks
        run: |
          nix-shell --run "./scripts/bench-ruby.sh"

      # 結果保存
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results-${{ github.run_id }}
          path: results/
          retention-days: 90
```

### .github/workflows/pr-check.yml

```yaml
name: PR Check

on:
  pull_request:
    branches: [main]
    paths:
      - 'php/**'
      - 'ruby/**'
      - 'templates/**'
      - 'data/**'

jobs:
  syntax-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: cachix/install-nix-action@v25
        with:
          nix_path: nixpkgs=channel:nixos-24.05

      # PHP 構文チェック
      - name: PHP syntax check
        run: |
          nix-shell --run "find php/src -name '*.php' -exec php -l {} \;"

      # Ruby 構文チェック
      - name: Ruby syntax check
        run: |
          nix-shell --run "ruby -c ruby/benchmark.rb"

  quick-benchmark:
    runs-on: ubuntu-latest
    needs: syntax-check

    steps:
      - uses: actions/checkout@v4

      - uses: cachix/install-nix-action@v25

      - name: Setup vendors
        run: nix-shell --run "./scripts/setup-vendors.sh"

      - name: Install dependencies
        run: |
          nix-shell --run "cd php && composer install"
          nix-shell --run "cd ruby && bundle install"

      # クイックベンチ（PR 確認用）
      - name: Quick benchmark
        run: |
          nix-shell --run "./scripts/bench-php.sh quick"
```

### ワークフロー概要

| Workflow | トリガー | 用途 |
|----------|---------|------|
| benchmark.yml | 手動/週次 | 本番ベンチマーク |
| pr-check.yml | PR | 構文チェック + クイックベンチ |

### キャッシュ戦略

```
vendors/           -> setup-vendors.sh のハッシュでキャッシュ
php/vendor/        -> composer.lock のハッシュでキャッシュ
ruby/vendor/bundle -> Gemfile.lock のハッシュでキャッシュ
```

### 成果物保存

- ベンチマーク結果: 90日間保持
- ファイル名: `benchmark-results-{run_id}`

### 検証項目

- [ ] benchmark.yml 構文正常
- [ ] pr-check.yml 構文正常
- [ ] 手動実行成功
- [ ] PR チェック成功
- [ ] キャッシュ有効化確認
- [ ] Artifact 保存確認
