# 実装間の構文差分

Liquid テンプレートエンジン実装間の機能差分まとめ。

## 対象ライブラリ

| 言語 | ライブラリ | 備考 |
|------|-----------|------|
| Ruby | Shopify/liquid | 公式リファレンス実装 |
| PHP | keepsuit/php-liquid | PHP 実装 |
| PHP | kalimatas/php-liquid | PHP 実装 |

---

## Shopify/liquid 独自機能（v5.x）

### タグ

| 機能 | 説明 | keepsuit | kalimatas |
|------|------|----------|-----------|
| `render` タグ | スコープ分離された部分テンプレート | ✅ | ❌ |
| `echo` タグ | `{{ }}` の代替構文 | ✅ | ❌ |
| `liquid` タグ | 複数行Liquid構文 | ✅ | ❌ |
| `inline_comment` | `{% # comment %}` 形式 | ✅ | ❌ |
| `doc` タグ | LiquidDoc ドキュメント | ✅ | ❌ |
| スコープ分離 | `render` 内で外部変数非参照 | ✅ | N/A |
| `include` 禁止 | `render` 内での `include` 禁止 | ✅ | N/A |

### フィルター

| フィルター | 説明 | keepsuit | kalimatas |
|-----------|------|----------|-----------|
| `base64_encode` | Base64 エンコード | ✅ | ❌ |
| `base64_decode` | Base64 デコード | ✅ | ❌ |
| `base64_url_safe_*` | URL安全Base64 | ✅ | ❌ |
| `sum` | 配列の合計 | ✅ | ❌ |
| `find` / `find_index` | 配列検索 | ✅ | ❌ |
| `reject` | 配列フィルタ（逆条件） | ✅ | ❌ |
| `has` | プロパティ存在チェック | ✅ | ❌ |
| `at_least` / `at_most` | 数値範囲制限 | ✅ | ❌ |
| `sort_natural` | 自然順ソート | ✅ | ❌ |

---

## 基本機能の差分

| 差分項目 | Ruby (official) | keepsuit | kalimatas |
|---------|-----------------|----------|-----------|
| **条件評価** | 左→右 + 短絡評価 | 左→右 + 短絡評価 | 左→右（短絡評価なし） |
| **エラーモード** | lax/warn/strict/strict2 | strict/lax | lax のみ |
| **ストリーミング** | ❌ | ✅（実験的） | ❌ |
| `extends/block` | ❌ | ❌ | ✅ |
| `paginate` | ❌ | ❌ | ✅ |

