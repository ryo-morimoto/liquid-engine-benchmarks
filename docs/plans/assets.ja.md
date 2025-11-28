# 素材準備

テストデータとテンプレートの作成。他フェーズと並行作業可能。

## 依存関係

```
なし（独立）
```

---

## ユースケース分類

Liquid テンプレートエンジンの主要ユースケースとベンチマーク対象。

| カテゴリ | 主な用途 | 特徴 |
|---------|---------|------|
| **E-Commerce** | Shopify テーマ | 商品/コレクション/カート/チェックアウト |
| **Static Site** | Jekyll / Hugo | ブログ/ドキュメント/カテゴリ/タグ |
| **Email/Notification** | トランザクションメール | パーソナライズ/条件分岐/フォールバック |
| **CMS** | 動的コンテンツ | ユーザー入力/API連携 |
| **Stress Test** | 極端なケース | 大量条件分岐/深いネスト/巨大ループ |

---

## テストデータ

### 目的

ベンチマーク用の共通テストデータ定義

### 成果物

- data/small.yml
- data/medium.yml
- data/large.yml
- data/2xl.yml

### スケール定義

| Scale | Products | Collections | Cart Items | 用途 |
|-------|----------|-------------|------------|------|
| small | 10 | 3 | 3 | 軽量テスト |
| medium | 50 | 10 | 10 | 標準EC規模 |
| large | 200 | 30 | 25 | 大規模サイト |
| 2xl | 500 | 50 | 50 | ストレステスト |

### データスキーマ

```yaml
products:
  - id: integer
    title: string
    price: integer (cents)
    description: string
    variants:
      - id: integer
        title: string
        price: integer
        available: boolean
    images:
      - src: string
        alt: string

collections:
  - id: integer
    title: string
    description: string
    products: [product_id, ...]

cart:
  items:
    - product_id: integer
      variant_id: integer
      quantity: integer
      price: integer
  total_price: integer
  item_count: integer

user:
  name: string
  email: string
  address:
    street: string
    city: string
    country: string
    zip: string

blog:
  posts:
    - id: integer
      title: string
      content: string
      author: string
      published_at: datetime
      tags: [string, ...]
  categories:
    - id: integer
      name: string
      slug: string
```

### サンプル (data/small.yml)

```yaml
products:
  - id: 1
    title: "Sample Product 1"
    price: 1990
    description: "A great product"
    variants:
      - id: 101
        title: "Small"
        price: 1990
        available: true
      - id: 102
        title: "Large"
        price: 2490
        available: true
    images:
      - src: "/images/product-1.jpg"
        alt: "Product 1"
  # ... 9 more products

collections:
  - id: 1
    title: "Featured"
    description: "Our featured products"
    products: [1, 2, 3, 4, 5]
  # ... 2 more collections

cart:
  items:
    - product_id: 1
      variant_id: 101
      quantity: 2
      price: 3980
  total_price: 3980
  item_count: 2

user:
  name: "John Doe"
  email: "john@example.com"
  address:
    street: "123 Main St"
    city: "Tokyo"
    country: "Japan"
    zip: "100-0001"
```

### 検証項目

- [ ] 各 YAML ファイル作成
- [ ] PHP で読み込み確認
- [ ] Ruby で読み込み確認
- [ ] スキーマ一貫性確認

---

## テンプレート

### 目的

全実装で共通のベンチマーク用 Liquid テンプレート作成

### 成果物

- templates/primitive/*.liquid
- templates/ecommerce/*.liquid
- templates/blog/*.liquid
- templates/email/*.liquid
- templates/cms/*.liquid
- templates/stress/*.liquid

### 方針

- 全実装がサポートする Shopify 公式機能のみ使用
- `include` タグ使用（`render` は kalimatas 非対応）
- 独自機能はベンチ対象外

### カテゴリ別テンプレート

#### primitive/（基本要素）

| ファイル | 内容 |
|---------|------|
| variable.liquid | 変数展開 |
| filter-chain.liquid | フィルター連鎖 |
| condition-simple.liquid | 単純条件 |
| condition-nested.liquid | ネスト条件 |
| loop-simple.liquid | 基本ループ |
| loop-nested.liquid | ネストループ |

#### ecommerce/（EC サイト）

| ファイル | 内容 |
|---------|------|
| product.liquid | 商品詳細 |
| collection.liquid | コレクション一覧 |
| cart.liquid | カート |
| checkout.liquid | チェックアウト |
| theme.liquid | テーマ全体 |

#### blog/（ブログ）

| ファイル | 内容 |
|---------|------|
| post.liquid | 記事ページ |
| archive.liquid | アーカイブ |
| category.liquid | カテゴリ |
| tag-cloud.liquid | タグクラウド |
| layout.liquid | レイアウト |

#### email/（メール）

| ファイル | 内容 |
|---------|------|
| order-confirmation.liquid | 注文確認 |
| shipping-notification.liquid | 配送通知 |
| password-reset.liquid | パスワードリセット |
| personalized-promo.liquid | パーソナライズプロモ |
| multi-language.liquid | 多言語 |

#### cms/（CMS）

| ファイル | 内容 |
|---------|------|
| dynamic-page.liquid | 動的ページ |
| user-profile.liquid | ユーザープロフィール |
| api-content.liquid | API コンテンツ |
| form-builder.liquid | フォームビルダー |

#### stress/（ストレステスト）

| ファイル | 内容 | 規模 |
|---------|------|------|
| massive-conditionals.liquid | 条件分岐 | 100+ 分岐 |
| deep-nesting.liquid | 深いネスト | 10+ 階層 |
| huge-loop.liquid | 大量ループ | 10,000 件 |
| filter-hell.liquid | フィルター連鎖 | 20+ フィルター |
| include-heavy.liquid | インクルード | 50+ パーシャル |
| worst-case.liquid | 全部入り | 最悪ケース |

### テンプレート例

#### primitive/variable.liquid

```liquid
{{ user.name }}
{{ user.email }}
{{ product.title }}
{{ product.price | money }}
{{ cart.total_price | money }}
```

#### primitive/loop-simple.liquid

```liquid
{% for product in products %}
  <div class="product">
    <h2>{{ product.title }}</h2>
    <p>{{ product.price | money }}</p>
  </div>
{% endfor %}
```

#### ecommerce/product.liquid

```liquid
<div class="product-detail">
  <h1>{{ product.title }}</h1>
  <p class="price">{{ product.price | money }}</p>
  <p class="description">{{ product.description }}</p>

  {% if product.variants.size > 1 %}
    <select name="variant">
      {% for variant in product.variants %}
        <option value="{{ variant.id }}"
          {% unless variant.available %}disabled{% endunless %}>
          {{ variant.title }} - {{ variant.price | money }}
        </option>
      {% endfor %}
    </select>
  {% endif %}

  <div class="images">
    {% for image in product.images %}
      <img src="{{ image.src }}" alt="{{ image.alt }}">
    {% endfor %}
  </div>
</div>
```

### 検証項目

- [ ] 全テンプレート作成
- [ ] Shopify/liquid で動作確認
- [ ] keepsuit で動作確認
- [ ] kalimatas で動作確認
