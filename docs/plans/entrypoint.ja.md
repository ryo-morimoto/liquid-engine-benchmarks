# エントリーポイント実装計画

統一エントリーポイントによるベンチマーク実行基盤。

## 依存関係

```
素材準備 ────┬────→ エントリーポイント実装
開発環境 ────┘
```

---

## 概要

### 目的

- 言語間で統一されたベンチマーク実行
- JSON Schema による入出力の整合性保証
- Contract Test によるアダプター検証

### アーキテクチャ

```
run.ts (Bun)
    │
    ├─ 1. 引数解析
    │      --adapter, --template, --iterations, --warmup
    │
    ├─ 2. データ準備
    │      SQLite → JavaScript Object
    │
    ├─ 3. アダプター実行 (subprocess)
    │      ┌─────────────────────────────────┐
    │      │ php src/adapters/php/keepsuit.php
    │      │   stdin: AdapterInput (JSON)
    │      │   stdout: AdapterOutput (JSON)
    │      └─────────────────────────────────┘
    │
    ├─ 4. 統計計算
    │      raw timings → mean, stddev, min, max, median
    │
    └─ 5. JSON 出力
           result.schema.json 準拠
```

---

## ディレクトリ構成

```
src/
├── run.ts                          # 統一エントリーポイント
├── adapters/
│   ├── php/
│   │   ├── bootstrap.php           # 共通初期化
│   │   ├── keepsuit.php            # Keepsuit アダプター
│   │   └── kalimatas.php           # Kalimatas アダプター
│   └── ruby/
│       ├── bootstrap.rb            # 共通初期化
│       └── shopify.rb              # Shopify アダプター
├── lib/
│   ├── adapter-runner.ts           # アダプター実行
│   ├── data-loader.ts
│   ├── data-loader.test.ts         # 単体テスト
│   ├── statistics.ts
│   ├── statistics.test.ts          # 単体テスト
│   ├── template-loader.ts
│   ├── template-loader.test.ts     # 単体テスト
│   ├── validator.ts
│   └── validator.test.ts           # 単体テスト
└── types/
    └── adapter.ts                  # 型定義

tests/                              # インテグレーションテスト専用
├── adapters.test.ts                # Contract Test
└── e2e.test.ts                     # E2E テスト

schema/
├── adapter-input.schema.json       # 新規
└── adapter-output.schema.json      # 新規
```

---

## JSON Schema

### adapter-input.schema.json

アダプターへの入力フォーマット。

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "adapter-input.schema.json",
  "title": "Adapter Input",
  "type": "object",
  "required": ["template", "data", "iterations", "warmup"],
  "additionalProperties": false,
  "properties": {
    "template": {
      "type": "string",
      "minLength": 1,
      "description": "Liquid template source code"
    },
    "data": {
      "type": "object",
      "description": "Template variables"
    },
    "iterations": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10000
    },
    "warmup": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1000
    }
  }
}
```

### adapter-output.schema.json

アダプターからの出力フォーマット。

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "adapter-output.schema.json",
  "title": "Adapter Output",
  "type": "object",
  "required": ["library", "version", "lang", "timings"],
  "additionalProperties": false,
  "properties": {
    "library": {
      "type": "string"
    },
    "version": {
      "$ref": "base.schema.json#/definitions/semver"
    },
    "lang": {
      "$ref": "base.schema.json#/definitions/lang"
    },
    "runtime_version": {
      "type": "string"
    },
    "timings": {
      "type": "object",
      "required": ["parse_ms", "render_ms"],
      "properties": {
        "parse_ms": {
          "type": "array",
          "items": { "type": "number", "minimum": 0 }
        },
        "render_ms": {
          "type": "array",
          "items": { "type": "number", "minimum": 0 }
        }
      }
    }
  }
}
```

---

## コンポーネント責務

### run.ts

統一エントリーポイント。

**責務:**
- CLI 引数のパース
- データ/テンプレートの読込
- アダプター実行のオーケストレーション
- 統計計算
- result.schema.json 準拠の JSON 出力

**CLI:**
```bash
bun run src/run.ts \
  --adapter keepsuit \
  --template primitive/variable \
  --scale medium \
  --iterations 100 \
  --warmup 10
```

### lib/adapter-runner.ts

アダプター実行。

**責務:**
- アダプターの subprocess 起動
- stdin への入力 JSON 送信
- stdout からの出力 JSON 受信
- adapter-output.schema.json によるバリデーション
- タイムアウト処理

**設定:**
```typescript
const ADAPTERS = {
  keepsuit: {
    name: "keepsuit",
    lang: "php",
    command: ["php", "-d", "opcache.enable_cli=1", "src/adapters/php/keepsuit.php"],
  },
  kalimatas: {
    name: "kalimatas",
    lang: "php",
    command: ["php", "-d", "opcache.enable_cli=1", "src/adapters/php/kalimatas.php"],
  },
  shopify: {
    name: "shopify",
    lang: "ruby",
    command: ["ruby", "src/adapters/ruby/shopify.rb"],
    env: { RUBY_YJIT_ENABLE: "1" },
  },
};
```

### lib/statistics.ts

統計計算。

**責務:**
- 配列から mean, stddev, min, max, median を計算

**インターフェース:**
```typescript
interface PhaseMetrics {
  mean_ms: number;
  stddev_ms: number;
  min_ms: number;
  max_ms: number;
  median_ms: number;
}

function calculateMetrics(values: number[]): PhaseMetrics;
```

### lib/data-loader.ts

テストデータ読込。

**責務:**
- SQLite (benchmark.db) からデータ取得
- Scale に応じたデータサイズ調整

### lib/template-loader.ts

テンプレート読込。

**責務:**
- テンプレートファイルの読込
- カテゴリ/名前による検索

### lib/validator.ts

JSON Schema バリデーション。

**責務:**
- Ajv による Schema 検証
- エラーメッセージの整形

### adapters/php/bootstrap.php

PHP アダプター共通初期化。

**責務:**
- stdin からの JSON 読込
- Composer autoload
- 出力ヘルパー関数
- 時間計測関数

### adapters/php/keepsuit.php

Keepsuit アダプター。

**責務:**
- Keepsuit\Liquid\Template の parse/render 実行
- 各イテレーションの時間計測
- 生データ出力

### adapters/ruby/shopify.rb

Shopify アダプター。

**責務:**
- Liquid::Template の parse/render 実行
- 各イテレーションの時間計測
- 生データ出力

---

## テスト方針

| 種別 | 配置 | 対象 |
|------|------|------|
| 単体テスト | `src/lib/*.test.ts` | 純粋関数、ロジック |
| インテグレーション | `tests/` | subprocess、Schema 準拠検証 |

### 単体テスト対象

| モジュール | テスト内容 |
|------------|-----------|
| statistics.ts | mean, stddev, median 計算の正確性 |
| validator.ts | Schema バリデーションの動作 |
| data-loader.ts | SQLite からのデータ取得 |
| template-loader.ts | テンプレートファイル読込 |

### インテグレーションテスト

| ファイル | 内容 |
|----------|------|
| adapters.test.ts | 全アダプターが Schema 準拠か検証 |
| e2e.test.ts | run.ts の E2E テスト |

---

## 実装順序

```
Phase 1: 基盤 (並行可能)
├── 1.1 schema/adapter-input.schema.json
├── 1.2 schema/adapter-output.schema.json
└── 1.3 src/types/adapter.ts

Phase 2: ライブラリ (依存: Phase 1)
├── 2.1 src/lib/validator.ts + validator.test.ts
├── 2.2 src/lib/statistics.ts + statistics.test.ts
├── 2.3 src/lib/data-loader.ts + data-loader.test.ts
└── 2.4 src/lib/template-loader.ts + template-loader.test.ts

Phase 3: アダプター基盤 (依存: Phase 1)
├── 3.1 src/adapters/php/bootstrap.php
└── 3.2 src/adapters/ruby/bootstrap.rb

Phase 4: アダプター実装 (依存: Phase 3)
├── 4.1 src/adapters/php/keepsuit.php
├── 4.2 src/adapters/php/kalimatas.php
└── 4.3 src/adapters/ruby/shopify.rb

Phase 5: Contract Test (依存: Phase 2, 4)
└── 5.1 tests/adapters.test.ts

Phase 6: エントリーポイント (依存: Phase 2, 4)
├── 6.1 src/lib/adapter-runner.ts
└── 6.2 src/run.ts

Phase 7: E2E テスト (依存: Phase 5, 6)
└── 7.1 tests/e2e.test.ts
```

---

## 検証項目

| Phase | 検証コマンド | 期待結果 |
|-------|-------------|----------|
| 1 | Schema 構文チェック | エラーなし |
| 2 | `bun test src/lib/` | 単体テスト pass |
| 3 | `php src/adapters/php/bootstrap.php < input.json` | JSON パース成功 |
| 4 | `php src/adapters/php/keepsuit.php < input.json` | Schema 準拠出力 |
| 5 | `bun test tests/adapters.test.ts` | Contract Test pass |
| 6 | `bun run src/run.ts --help` | ヘルプ表示 |
| 7 | `bun test tests/e2e.test.ts` | E2E テスト pass |
