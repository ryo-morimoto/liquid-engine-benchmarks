# 実行基盤

ベンチマーク実行スクリプトと結果出力。スクリプト/結果出力は並行作業可能。

## 依存関係

```
ベンチマーク実装 ────→ 実行基盤
```

---

## 実行スクリプト

### 目的

ベンチマーク実行の自動化と統一インターフェース提供

### 成果物

- scripts/setup-vendors.sh
- scripts/bench-php.sh
- scripts/bench-ruby.sh
- scripts/bench-all.sh
- scripts/switch-version.sh

### scripts/setup-vendors.sh

```bash
#!/bin/bash
# ベンチマーク対象ライブラリのセットアップ
# 初回実行時にリポジトリをクローン、以降は fetch のみ
set -euo pipefail

VENDORS_DIR="vendors"
mkdir -p "$VENDORS_DIR"

echo "Setting up vendor libraries..."

# Shopify/liquid (Ruby)
if [ ! -d "$VENDORS_DIR/shopify-liquid" ]; then
    echo "Cloning Shopify/liquid..."
    git clone https://github.com/Shopify/liquid.git "$VENDORS_DIR/shopify-liquid"
else
    echo "Updating Shopify/liquid..."
    git -C "$VENDORS_DIR/shopify-liquid" fetch --tags
fi

# keepsuit/php-liquid (PHP)
if [ ! -d "$VENDORS_DIR/keepsuit-liquid" ]; then
    echo "Cloning keepsuit/php-liquid..."
    git clone https://github.com/keepsuit/php-liquid.git "$VENDORS_DIR/keepsuit-liquid"
else
    echo "Updating keepsuit/php-liquid..."
    git -C "$VENDORS_DIR/keepsuit-liquid" fetch --tags
fi

# kalimatas/php-liquid (PHP)
if [ ! -d "$VENDORS_DIR/kalimatas-liquid" ]; then
    echo "Cloning kalimatas/php-liquid..."
    git clone https://github.com/kalimatas/php-liquid.git "$VENDORS_DIR/kalimatas-liquid"
else
    echo "Updating kalimatas/php-liquid..."
    git -C "$VENDORS_DIR/kalimatas-liquid" fetch --tags
fi

echo "Vendor setup complete!"
```

### scripts/switch-version.sh

```bash
#!/bin/bash
# 指定ライブラリを指定バージョンに切り替え
# Usage: ./switch-version.sh <library> <version>
# Example: ./switch-version.sh keepsuit v0.9.0
set -euo pipefail

LIBRARY="$1"
VERSION="$2"

case "$LIBRARY" in
    shopify)
        cd vendors/shopify-liquid
        git checkout "$VERSION"
        cd ../../ruby
        bundle install
        ;;
    keepsuit)
        cd vendors/keepsuit-liquid
        git checkout "$VERSION"
        cd ../../php
        composer update keepsuit/liquid
        ;;
    kalimatas)
        cd vendors/kalimatas-liquid
        git checkout "$VERSION"
        cd ../../php
        composer update liquid/liquid
        ;;
    *)
        echo "Unknown library: $LIBRARY"
        echo "Available: shopify, keepsuit, kalimatas"
        exit 1
        ;;
esac

echo "Switched $LIBRARY to $VERSION"
```

### scripts/bench-php.sh

```bash
#!/bin/bash
# PHP ベンチマーク実行
# Usage: ./bench-php.sh [quick|standard|precise] [keepsuit|kalimatas|all]
set -euo pipefail

PROFILE="${1:-standard}"
TARGET="${2:-all}"

cd php

case "$PROFILE" in
    quick)
        OPTS="--iterations=5 --revs=50 --warmup=1"
        ;;
    standard)
        OPTS="--iterations=10 --revs=100 --warmup=3"
        ;;
    precise)
        OPTS="--iterations=20 --revs=500 --warmup=5"
        ;;
    *)
        echo "Unknown profile: $PROFILE"
        exit 1
        ;;
esac

case "$TARGET" in
    keepsuit)
        vendor/bin/phpbench run src/Keepsuit $OPTS --report=aggregate
        ;;
    kalimatas)
        vendor/bin/phpbench run src/Kalimatas $OPTS --report=aggregate
        ;;
    all)
        vendor/bin/phpbench run $OPTS --report=aggregate
        ;;
    *)
        echo "Unknown target: $TARGET"
        exit 1
        ;;
esac
```

### scripts/bench-ruby.sh

```bash
#!/bin/bash
# Ruby ベンチマーク実行
# Usage: ./bench-ruby.sh
set -euo pipefail

cd ruby
bundle exec ruby benchmark.rb
```

### scripts/bench-all.sh

```bash
#!/bin/bash
# 全ベンチマーク実行（結果を results/ に保存）
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="results"
mkdir -p "$RESULTS_DIR"

echo "Starting full benchmark suite..."
echo "Timestamp: $TIMESTAMP"

# PHP Benchmarks
echo "Running PHP benchmarks..."
cd php
vendor/bin/phpbench run --report=json > "../$RESULTS_DIR/php_$TIMESTAMP.json"
cd ..

# Ruby Benchmarks
echo "Running Ruby benchmarks..."
cd ruby
bundle exec ruby benchmark.rb > "../$RESULTS_DIR/ruby_$TIMESTAMP.json"
cd ..

echo "Benchmarks complete!"
echo "Results saved to $RESULTS_DIR/"

# Generate summary table
./scripts/generate-table.sh "$TIMESTAMP"
```

### スクリプト一覧

| スクリプト | 用途 | 引数 |
|-----------|------|------|
| setup-vendors.sh | ライブラリ初期化 | なし |
| switch-version.sh | バージョン切替 | library, version |
| bench-php.sh | PHP ベンチ | profile, target |
| bench-ruby.sh | Ruby ベンチ | なし |
| bench-all.sh | 全実行 + 保存 | なし |

### 検証項目

- [ ] 各スクリプト実行権限付与
- [ ] setup-vendors.sh 成功
- [ ] switch-version.sh 全パターン
- [ ] bench-php.sh 全プロファイル
- [ ] bench-ruby.sh 成功
- [ ] bench-all.sh 成功

---

## 結果出力

### 目的

ベンチマーク結果の保存・可視化・比較

### 成果物

- results/.gitkeep
- scripts/generate-table.sh
- results/README.md

### results/ ディレクトリ構成

タイムスタンプ形式:

```
results/
├── .gitkeep
├── README.md
├── php_20241201_120000.json
├── ruby_20241201_120000.json
└── summary_20241201_120000.md
```

バージョン別形式（バージョン比較用）:

```
results/
├── keepsuit/
│   ├── v0.9.0.json
│   └── v0.8.0.json
├── kalimatas/
│   ├── v1.4.44.json
│   └── v1.4.0.json
└── shopify/
    ├── v5.8.0.json
    └── v5.11.0.json
```

### JSON 出力フォーマット

#### PHP (PHPBench)

```json
{
  "suite": {
    "tag": "benchmark-run",
    "date": "2024-12-01T12:00:00+09:00",
    "config_path": "phpbench.json",
    "php_version": "8.3.0"
  },
  "benchmarks": [
    {
      "class": "Benchmark\\Keepsuit\\KeepsuitBench",
      "method": "benchVariable",
      "revs": 100,
      "iterations": 10,
      "time_avg": 0.000125,
      "time_min": 0.000120,
      "time_max": 0.000130,
      "mem_peak": 2097152
    }
  ]
}
```

#### Ruby (benchmark-ips)

```json
{
  "library": "shopify/liquid",
  "version": "5.8.0",
  "ruby_version": "3.3.0",
  "date": "2024-12-01T12:00:00+09:00",
  "benchmarks": [
    {
      "name": "primitive/variable - parse",
      "ips": 125000.5,
      "stddev": 1250.2,
      "iterations": 625025
    },
    {
      "name": "primitive/variable - render",
      "ips": 98000.3,
      "stddev": 980.1,
      "iterations": 490015
    }
  ]
}
```

### scripts/generate-table.sh

```bash
#!/bin/bash
# ベンチマーク結果から Markdown テーブルを生成
# Usage: ./generate-table.sh <timestamp>
set -euo pipefail

TIMESTAMP="$1"
RESULTS_DIR="results"
OUTPUT="$RESULTS_DIR/summary_$TIMESTAMP.md"

PHP_RESULT="$RESULTS_DIR/php_$TIMESTAMP.json"
RUBY_RESULT="$RESULTS_DIR/ruby_$TIMESTAMP.json"

cat > "$OUTPUT" << 'EOF'
# Benchmark Results

Generated: TIMESTAMP_PLACEHOLDER

## Environment

| Item | Value |
|------|-------|
| PHP | 8.3.x |
| Ruby | 3.3.x |
| OS | Linux |

## Results

### Parse + Render Performance (ops/sec)

| Template | Shopify/liquid | keepsuit | kalimatas |
|----------|---------------|----------|-----------|
EOF

# Replace placeholder
sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/" "$OUTPUT"

# Parse JSON and generate table rows
# (実際の実装では jq を使用して JSON を処理)

echo "Summary generated: $OUTPUT"
```

### 結果比較テーブル例

```markdown
## Parse + Render Performance (iterations/second)

| Template | Shopify/liquid (Ruby) | keepsuit (PHP) | kalimatas (PHP) |
|----------|----------------------|----------------|-----------------|
| primitive/variable | 125,000 | 85,000 | 62,000 |
| primitive/loop-simple | 45,000 | 32,000 | 24,000 |
| ecommerce/product | 12,000 | 8,500 | 6,200 |
| ecommerce/collection | 3,500 | 2,800 | 1,900 |

## Memory Usage (peak, MB)

| Template | Shopify/liquid | keepsuit | kalimatas |
|----------|---------------|----------|-----------|
| ecommerce/collection | 45 | 128 | 156 |
| stress/huge-loop | 120 | 512 | 640 |
```

### results/README.md

```markdown
# Benchmark Results

このディレクトリにはベンチマーク結果が保存されます。

## ファイル命名規則

- `php_YYYYMMDD_HHMMSS.json` - PHP ベンチマーク結果
- `ruby_YYYYMMDD_HHMMSS.json` - Ruby ベンチマーク結果
- `summary_YYYYMMDD_HHMMSS.md` - 比較サマリー

## 結果の再生成

```bash
./scripts/generate-table.sh <timestamp>
```

## 過去結果の比較

複数タイムスタンプの結果を比較するには:

```bash
./scripts/compare-results.sh <timestamp1> <timestamp2>
```
```

### 検証項目

- [ ] results/ ディレクトリ作成
- [ ] PHP JSON 出力確認
- [ ] Ruby JSON 出力確認
- [ ] generate-table.sh 動作確認
- [ ] Markdown テーブル正常生成
