# 開発環境

Nix Flakes による再現可能な開発環境とベンチマーク実行基盤。

## 依存関係

```
なし（独立）
```

---

## 環境構築

### 目的

Nix Flakes による再現可能な PHP + Ruby 開発環境

### 成果物

- flake.nix
- flake.lock
- .envrc
- nix/shells/php.nix
- nix/shells/ruby.nix
- nix/shells/all.nix

### ディレクトリ構成

```
nix/
└── shells/
    ├── php.nix     # PHP 8.3 + OPcache/JIT
    ├── ruby.nix    # Ruby 3.3 + YJIT
    └── all.nix     # 全言語 + ユーティリティ
```

### 使用方法

```bash
nix develop          # 全言語（デフォルト）
nix develop .#php    # PHP のみ
nix develop .#ruby   # Ruby のみ
```

### .envrc

```bash
use flake
```

direnv + nix-direnv でディレクトリに入ると自動で環境が有効化される。

### PHP OPcache/JIT 設定

ベンチマーク実行時は以下の設定を使用:

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

### 検証項目

- [ ] nix develop 起動成功
- [ ] PHP 8.3 利用可能
- [ ] Ruby 3.3 利用可能
- [ ] Composer 利用可能
- [ ] Bundler 利用可能
- [ ] Bun 利用可能

---

## ライブラリ管理

### 目的

ベンチマーク対象ライブラリのバージョン管理

### 方針

- **パッケージマネージャに委任**: Composer / Bundler を使用
- **vendors/ 方式は廃止**: Git clone による管理は行わない
- **バージョン指定は bench.yaml**: 一元管理

### 成果物

- bench.yaml

### bench.yaml スキーマ

```yaml
# ランタイムバージョン
runtimes:
  php: "8.3"
  ruby: "3.3"

# ベースライン（比較基準）
baseline:
  library: shopify
  version: "5.6.0"

# 対象ライブラリ
libraries:
  - lang: php
    name: keepsuit
    package: keepsuit/php-liquid
    versions: ["0.9.0", "0.10.0"]

  - lang: php
    name: kalimatas
    package: kalimatas/php-liquid
    versions: ["1.5.0"]

  - lang: ruby
    name: shopify
    package: liquid
    versions: ["5.5.0", "5.6.0"]
```

### 実行フロー

```
bench.yaml
    │
    ▼ パース
┌───────────────────────────────────────┐
│ Matrix 生成                            │
│  - php / keepsuit / 0.9.0             │
│  - php / keepsuit / 0.10.0            │
│  - php / kalimatas / 1.5.0            │
│  - ruby / shopify / 5.5.0             │
│  - ruby / shopify / 5.6.0             │
└───────────────────────────────────────┘
    │
    ▼ 並列実行
┌─────────────────────────────────────────┐
│ 各組み合わせで:                           │
│  1. 一時ディレクトリ作成                   │
│  2. composer.json / Gemfile 生成         │
│  3. 依存インストール                       │
│  4. ベンチマーク実行                       │
│  5. 結果 JSON 出力                        │
└─────────────────────────────────────────┘
    │
    ▼
results/{lang}-{library}-{version}.json
```

### 検証項目

- [ ] bench.yaml パース成功
- [ ] Matrix 生成成功
- [ ] 各ライブラリのインストール成功

---

## ベンチマーク実行

### 目的

言語非依存でフェーズ別（parse/render）の時間を計測

### 方針

- **hyperfine**: 全体時間の計測・統計
- **スクリプト内計測**: parse/render のフェーズ別時間
- **アダプターパターン**: ライブラリごとの API 差異を吸収

### ディレクトリ構成

```
benchmarks/
├── adapters/
│   ├── php/
│   │   ├── interface.php     # 共通インターフェース
│   │   ├── keepsuit.php      # Keepsuit アダプター
│   │   └── kalimatas.php     # Kalimatas アダプター
│   └── ruby/
│       ├── interface.rb      # 共通インターフェース
│       └── shopify.rb        # Shopify アダプター
├── run.php                   # PHP エントリポイント
└── run.rb                    # Ruby エントリポイント
```

### エントリポイント仕様

```bash
php benchmarks/run.php \
  --adapter=keepsuit \
  --template=primitive/variable \
  --scale=medium \
  --iterations=100
```

### 出力 JSON スキーマ

```json
{
  "library": "keepsuit/php-liquid",
  "version": "0.9.0",
  "runtime": "php 8.3.0",
  "template": "primitive/variable",
  "scale": "medium",
  "iterations": 100,
  "timings": {
    "parse_ms": 1.23,
    "render_ms": 4.56,
    "total_ms": 5.79
  },
  "memory_peak_bytes": 1048576,
  "timestamp": "2024-11-29T12:00:00Z"
}
```

### 検証項目

- [ ] PHP アダプター動作確認
- [ ] Ruby アダプター動作確認
- [ ] JSON 出力形式確認

---

## テスト

### 目的

アダプター出力が JSON Schema に準拠しているか検証

### 方針

- **Bun + Ajv**: JSON Schema バリデーション
- **各アダプターをテスト**: 出力形式の統一を保証

### ディレクトリ構成

```
tests/
├── package.json
├── schema/
│   └── result.json           # JSON Schema 定義
└── adapters.test.ts          # テストコード
```

### 実行方法

```bash
cd tests
bun install
bun test
```

### 検証項目

- [ ] bun test 成功
- [ ] 全アダプターの出力が Schema 準拠
