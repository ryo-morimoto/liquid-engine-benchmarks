# 開発環境

Nix による再現可能な開発環境とライブラリ管理。素材準備と並行作業可能。

## 依存関係

```
なし（独立）
```

---

## 環境構築

### 目的

Nix による再現可能な PHP + Ruby 開発環境

### 成果物

- shell.nix
- .envrc

### shell.nix

```nix
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # PHP 環境
    php83
    php83Packages.composer
    php83Extensions.opcache
    php83Extensions.yaml

    # Ruby 環境
    ruby_3_3
    bundler

    # ユーティリティ
    jq
    yq-go      # YAML処理
    gnuplot    # グラフ生成（オプション）
  ];

  shellHook = ''
    echo "Liquid Benchmark Environment"
    echo "  PHP: $(php -v | head -1)"
    echo "  Ruby: $(ruby -v)"

    # PHP OPcache/JIT設定
    export PHP_CLI_SERVER_WORKERS=4

    # Ruby YJIT有効化
    export RUBY_YJIT_ENABLE=1
  '';
}
```

### PHP OPcache/JIT 設定

ベンチマーク実行時は以下の設定を使用（phpbench.json で設定）:

```ini
opcache.enable=1
opcache.enable_cli=1
opcache.jit_buffer_size=64M
opcache.jit=1255
```

### Ruby YJIT 設定

Ruby 3.3+ では YJIT を有効化して最適なパフォーマンスで測定:

```bash
export RUBY_YJIT_ENABLE=1
```

### .envrc

```bash
use nix
```

### 検証項目

- [ ] nix-shell 起動成功
- [ ] PHP 8.3 利用可能
- [ ] Ruby 3.3 利用可能
- [ ] Composer 利用可能
- [ ] Bundler 利用可能

---

## ライブラリ管理

### 目的

ベンチマーク対象ライブラリのバージョン管理と切替機構

### 成果物

- vendors/ ディレクトリ
- scripts/setup-vendors.sh
- .gitignore 更新

### vendors/ 構成

```
vendors/
├── shopify-liquid/    # Shopify/liquid (Ruby)
├── keepsuit-liquid/   # keepsuit/php-liquid (PHP)
└── kalimatas-liquid/  # kalimatas/php-liquid (PHP)
```

### scripts/setup-vendors.sh

```bash
#!/bin/bash
set -euo pipefail

VENDORS_DIR="vendors"
mkdir -p "$VENDORS_DIR"

# Shopify/liquid (Ruby)
if [ ! -d "$VENDORS_DIR/shopify-liquid" ]; then
    git clone https://github.com/Shopify/liquid.git "$VENDORS_DIR/shopify-liquid"
else
    git -C "$VENDORS_DIR/shopify-liquid" fetch --tags
fi

# keepsuit/php-liquid (PHP)
if [ ! -d "$VENDORS_DIR/keepsuit-liquid" ]; then
    git clone https://github.com/keepsuit/php-liquid.git "$VENDORS_DIR/keepsuit-liquid"
else
    git -C "$VENDORS_DIR/keepsuit-liquid" fetch --tags
fi

# kalimatas/php-liquid (PHP)
if [ ! -d "$VENDORS_DIR/kalimatas-liquid" ]; then
    git clone https://github.com/kalimatas/php-liquid.git "$VENDORS_DIR/kalimatas-liquid"
else
    git -C "$VENDORS_DIR/kalimatas-liquid" fetch --tags
fi

echo "Vendors setup complete"
```

### バージョン切替

```bash
# バージョン切替例
cd vendors/keepsuit-liquid
git checkout v0.9.0
cd ../../php
composer update

# Ruby
cd vendors/shopify-liquid
git checkout v5.8.0
cd ../../ruby
bundle install
```

### .gitignore 追加

```
vendors/
```

### 検証項目

- [ ] setup-vendors.sh 実行成功
- [ ] 各バージョンへの切替確認
- [ ] PHP composer install 成功
- [ ] Ruby bundle install 成功
