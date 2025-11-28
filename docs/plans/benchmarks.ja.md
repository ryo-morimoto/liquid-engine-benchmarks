# ベンチマーク実装

PHP と Ruby のベンチマーク実装。PHP/Ruby は並行作業可能。

## 依存関係

```
素材準備 ────┬────→ ベンチマーク実装
開発環境 ────┘
```

---

## ベンチマークカテゴリ

### 1. Primitive Benchmarks（基本要素）

| ベンチマーク | 内容 | 計測対象 |
|-------------|------|---------|
| `benchVariable` | `{{ name }}` | 変数展開速度 |
| `benchFilterChain` | `{{ x \| a \| b \| c }}` | フィルター連鎖 |
| `benchConditionSimple` | `{% if x %}` | 単純条件 |
| `benchConditionNested` | 3階層ネスト | ネスト条件 |
| `benchLoopSimple` | 100件ループ | 基本ループ |
| `benchLoopNested` | 2重ループ | ネストループ |

### 2. E-Commerce Benchmarks（Shopify風）

| ベンチマーク | 内容 | 想定シナリオ |
|-------------|------|-------------|
| `benchProduct` | 商品詳細 | バリアント/画像/レビュー |
| `benchCollection` | コレクション | 商品一覧/フィルター/ソート |
| `benchCart` | カート | 明細/合計/クーポン |
| `benchCheckout` | チェックアウト | 住所/支払い/確認 |
| `benchTheme` | テーマ全体 | レイアウト込み |

### 3. Blog Benchmarks（Jekyll風）

| ベンチマーク | 内容 | 想定シナリオ |
|-------------|------|-------------|
| `benchPost` | 記事ページ | 本文/メタ/関連記事 |
| `benchArchive` | アーカイブ | 年月別一覧 |
| `benchCategory` | カテゴリ | 階層カテゴリ |
| `benchTagCloud` | タグクラウド | 全タグ集計 |

### 4. Email Benchmarks（通知メール）

| ベンチマーク | 内容 | 想定シナリオ |
|-------------|------|-------------|
| `benchOrderConfirmation` | 注文確認 | 明細/合計/配送先 |
| `benchPersonalized` | パーソナライズ | 条件分岐多数 |
| `benchMultiLanguage` | 多言語 | 言語切替ロジック |

### 5. Stress Benchmarks（ストレステスト）

#### 条件分岐パターン

| ベンチマーク | 内容 | 規模 |
|-------------|------|------|
| `benchIfElsifChain` | if/elsif 連鎖 | 100+ 分岐 |
| `benchCaseWhen` | case/when switch | 50+ ケース |
| `benchNestedIf` | ネストif | 10+ 階層 |
| `benchMixedConditionals` | 複合条件 | 全パターン混合 |

#### ループパターン

| ベンチマーク | 内容 | 規模 |
|-------------|------|------|
| `benchHugeLoop` | 単純大量ループ | 10,000 件 |
| `benchNestedLoop` | 2重ループ | 100 x 100 |
| `benchTripleLoop` | 3重ループ | 20 x 20 x 20 |

#### その他の極端なケース

| ベンチマーク | 内容 | 規模 |
|-------------|------|------|
| `benchFilterHell` | フィルター連鎖 | 20+ フィルター |
| `benchIncludeHeavy` | 多数インクルード | 50+ パーシャル |
| `benchDeepNesting` | 深いネスト | 10+ 階層 |
| `benchWorstCase` | 全部入り | 最悪ケース |

### 6. Cache Benchmarks（キャッシュ効果）

| ベンチマーク | 内容 |
|-------------|------|
| `benchColdStart` | キャッシュなし初回実行 |
| `benchWarmCache` | キャッシュあり実行 |
| `benchCacheInvalidation` | キャッシュ無効化後 |

---

## PHP ベンチマーク

### 目的

PHPBench による keepsuit/kalimatas のパフォーマンス測定

### 成果物

- php/composer.json
- php/phpbench.json
- php/src/Common/Database.php
- php/src/Common/TemplateLoader.php
- php/src/Keepsuit/KeepsuitBench.php
- php/src/Kalimatas/KalimatasBench.php

### php/composer.json

```json
{
    "name": "benchmark/liquid-php",
    "description": "PHP Liquid benchmark suite",
    "type": "project",
    "require": {
        "php": "^8.3",
        "symfony/yaml": "^7.0"
    },
    "require-dev": {
        "phpbench/phpbench": "^1.3"
    },
    "repositories": [
        {
            "type": "path",
            "url": "../vendors/keepsuit-liquid"
        },
        {
            "type": "path",
            "url": "../vendors/kalimatas-liquid"
        }
    ],
    "autoload": {
        "psr-4": {
            "Benchmark\\": "src/"
        }
    },
    "scripts": {
        "bench": "phpbench run --report=aggregate",
        "bench:quick": "phpbench run --iterations=5 --revs=50 --warmup=1 --report=aggregate",
        "bench:precise": "phpbench run --iterations=20 --revs=500 --warmup=5 --report=aggregate",
        "bench:keepsuit": "phpbench run src/Keepsuit --report=aggregate",
        "bench:kalimatas": "phpbench run src/Kalimatas --report=aggregate"
    }
}
```

### php/phpbench.json

```json
{
    "runner.bootstrap": "vendor/autoload.php",
    "runner.path": "src",
    "runner.php_config": {
        "opcache.enable": 1,
        "opcache.enable_cli": 1,
        "opcache.jit_buffer_size": "64M",
        "opcache.jit": 1255
    }
}
```

### 実行プロファイル

| Profile | Iterations | Revs | Warmup | 用途 |
|---------|-----------|------|--------|------|
| quick | 5 | 50 | 1 | 開発確認 |
| standard | 10 | 100 | 3 | 日常測定 |
| precise | 20 | 500 | 5 | 公開用 |

### php/src/Common/Database.php

```php
<?php

declare(strict_types=1);

namespace Benchmark\Common;

use Symfony\Component\Yaml\Yaml;

/**
 * ベンチマーク用テストデータを読み込む
 * 各スケール（small/medium/large/2xl）のYAMLファイルをパースし、
 * Liquid テンプレートで使用する変数を提供する
 */
class Database
{
    private array $cache = [];

    public function __construct(
        private string $dataDir = __DIR__ . '/../../../data'
    ) {}

    /**
     * 指定スケールのデータを読み込む
     */
    public function load(string $scale): array
    {
        if (!isset($this->cache[$scale])) {
            $path = "{$this->dataDir}/{$scale}.yml";
            $this->cache[$scale] = Yaml::parseFile($path);
        }
        return $this->cache[$scale];
    }
}
```

### php/src/Common/TemplateLoader.php

```php
<?php

declare(strict_types=1);

namespace Benchmark\Common;

/**
 * テンプレートファイルを読み込む
 * 全実装で共通のテンプレートを使用するため、
 * エンジン固有の処理は行わない
 */
class TemplateLoader
{
    public function __construct(
        private string $baseDir = __DIR__ . '/../../../templates'
    ) {}

    /**
     * テンプレートを読み込む
     */
    public function load(string $category, string $name): string
    {
        $path = "{$this->baseDir}/{$category}/{$name}.liquid";
        if (!file_exists($path)) {
            throw new \RuntimeException("Template not found: {$path}");
        }
        return file_get_contents($path);
    }

    /**
     * カテゴリ内の全テンプレートを取得
     */
    public function listCategory(string $category): array
    {
        $pattern = "{$this->baseDir}/{$category}/*.liquid";
        $files = glob($pattern);
        return array_map(fn($f) => basename($f, '.liquid'), $files);
    }
}
```

### php/src/Keepsuit/KeepsuitBench.php

```php
<?php

declare(strict_types=1);

namespace Benchmark\Keepsuit;

use Benchmark\Common\Database;
use Benchmark\Common\TemplateLoader;
use Keepsuit\Liquid\Template;
use PhpBench\Attributes as Bench;

/**
 * keepsuit/php-liquid ベンチマーク
 */
#[Bench\BeforeMethods('setUp')]
class KeepsuitBench
{
    private Database $database;
    private TemplateLoader $loader;
    private array $data;

    public function setUp(): void
    {
        $this->database = new Database();
        $this->loader = new TemplateLoader();
        $this->data = $this->database->load('medium');
    }

    #[Bench\Groups(['primitive'])]
    #[Bench\Revs(100)]
    #[Bench\Iterations(10)]
    public function benchVariable(): void
    {
        $template = Template::parse($this->loader->load('primitive', 'variable'));
        $template->render($this->data);
    }

    #[Bench\Groups(['primitive'])]
    #[Bench\Revs(100)]
    #[Bench\Iterations(10)]
    public function benchLoopSimple(): void
    {
        $template = Template::parse($this->loader->load('primitive', 'loop-simple'));
        $template->render($this->data);
    }

    #[Bench\Groups(['ecommerce'])]
    #[Bench\Revs(50)]
    #[Bench\Iterations(10)]
    public function benchProduct(): void
    {
        $template = Template::parse($this->loader->load('ecommerce', 'product'));
        $template->render(['product' => $this->data['products'][0]]);
    }

    #[Bench\Groups(['stress'])]
    #[Bench\Revs(10)]
    #[Bench\Iterations(5)]
    public function benchHugeLoop(): void
    {
        $template = Template::parse($this->loader->load('stress', 'huge-loop'));
        $template->render($this->data);
    }
}
```

### ParamProviders によるスケール切替

```php
#[ParamProviders('provideDataScales')]
public function benchRenderCollection(array $params): void
{
    $this->runner->render($params['scale']);
}

public function provideDataScales(): \Generator
{
    yield 'small' => ['scale' => 'small'];
    yield 'medium' => ['scale' => 'medium'];
    yield 'large' => ['scale' => 'large'];
    yield '2xl' => ['scale' => '2xl'];
}
```

### 検証項目

- [ ] composer install 成功
- [ ] phpbench run 成功
- [ ] keepsuit 全ベンチ実行
- [ ] kalimatas 全ベンチ実行
- [ ] 結果 JSON 出力

---

## Ruby ベンチマーク

### 目的

benchmark/ips による Shopify/liquid のパフォーマンス測定

### 成果物

- ruby/Gemfile
- ruby/lib/database.rb
- ruby/lib/theme_runner.rb
- ruby/benchmark.rb

### ruby/Gemfile

```ruby
source 'https://rubygems.org'

# Liquid（vendors/ からローカル参照）
gem 'liquid', path: '../vendors/shopify-liquid'

# ベンチマーク
gem 'benchmark-ips', '~> 2.13'
gem 'memory_profiler', '~> 1.0'

# YAML パース
gem 'yaml', '~> 0.3'
```

### 測定方式

Shopify 公式ベンチマーク準拠:
- `benchmark/ips` で iterations/second 測定
- フェーズ別: tokenize / parse / render / parse+render
- warmup=10秒, time=20秒

### ruby/lib/database.rb

```ruby
# frozen_string_literal: true

require 'yaml'

# ベンチマーク用テストデータを読み込む
class Database
  def initialize(data_dir: File.expand_path('../../data', __dir__))
    @data_dir = data_dir
    @cache = {}
  end

  # 指定スケールのデータを読み込む
  def load(scale)
    @cache[scale] ||= YAML.load_file("#{@data_dir}/#{scale}.yml")
  end
end
```

### ruby/lib/theme_runner.rb

```ruby
# frozen_string_literal: true

require 'liquid'

# テンプレート実行ラッパー
# フェーズ別測定（parse/render/parse+render）をサポート
class ThemeRunner
  def initialize(template_dir: File.expand_path('../../templates', __dir__))
    @template_dir = template_dir
    @cache = {}
  end

  # テンプレートソースを読み込む
  def load(category, name)
    path = "#{@template_dir}/#{category}/#{name}.liquid"
    File.read(path)
  end

  # パース済みテンプレートを取得（キャッシュ）
  def parse(category, name)
    key = "#{category}/#{name}"
    @cache[key] ||= Liquid::Template.parse(load(category, name))
  end

  # パースのみ実行
  def benchmark_parse(category, name)
    Liquid::Template.parse(load(category, name))
  end

  # レンダーのみ実行（パース済み）
  def benchmark_render(category, name, data)
    parse(category, name).render(data)
  end

  # パース + レンダー実行
  def benchmark_parse_and_render(category, name, data)
    Liquid::Template.parse(load(category, name)).render(data)
  end
end
```

### ruby/benchmark.rb

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require 'bundler/setup'
require 'benchmark/ips'
require 'json'

require_relative 'lib/database'
require_relative 'lib/theme_runner'

database = Database.new
runner = ThemeRunner.new

data = database.load('medium')
results = {}

# Primitive Benchmarks
Benchmark.ips do |x|
  x.config(warmup: 10, time: 20)

  x.report('primitive/variable - parse') do
    runner.benchmark_parse('primitive', 'variable')
  end

  x.report('primitive/variable - render') do
    runner.benchmark_render('primitive', 'variable', data)
  end

  x.report('primitive/variable - parse+render') do
    runner.benchmark_parse_and_render('primitive', 'variable', data)
  end

  x.report('primitive/loop-simple - parse+render') do
    runner.benchmark_parse_and_render('primitive', 'loop-simple', data)
  end
end

# E-Commerce Benchmarks
Benchmark.ips do |x|
  x.config(warmup: 10, time: 20)

  product_data = { 'product' => data['products'].first }

  x.report('ecommerce/product - parse+render') do
    runner.benchmark_parse_and_render('ecommerce', 'product', product_data)
  end

  x.report('ecommerce/collection - parse+render') do
    runner.benchmark_parse_and_render('ecommerce', 'collection', data)
  end
end

# Output results as JSON
puts JSON.pretty_generate({
  library: 'shopify/liquid',
  version: Liquid::VERSION,
  ruby_version: RUBY_VERSION,
  date: Time.now.iso8601,
  benchmarks: results
})
```

### 検証項目

- [ ] bundle install 成功
- [ ] ruby benchmark.rb 成功
- [ ] 全テンプレート測定完了
- [ ] 結果 JSON 出力

---

## ベンチマーク方針

### 共通テンプレートの制約

全実装で同一の共通テンプレートを使用するため、以下の制約を設ける：

1. **使用機能**: Shopify 公式機能のうち全実装がサポートするもののみ
2. **include タグ**: `render` は kalimatas 非対応のため `include` を使用
3. **独自機能**: ベンチ対象外（比較対象がないため）

### 対象外の機能

以下の機能は比較対象がないためベンチマークから除外：

- **keepsuit 独自**: ストリーミングレンダリング
- **kalimatas 独自**: `extends/block`、`paginate`
- **Shopify 独自**: `render`、`echo`、`liquid`、`doc` タグ

---

## 測定の公平性

### 公平性の確保

- 全実装で共通のテンプレート・データを使用
- 同一マシン上で同一条件下で測定
- Ruby は公式リファレンス実装としてベースライン

### 互換性の考慮

- `render` タグは kalimatas 未対応のため、共通テストでは `include` を使用
- Ruby 固有の機能（YJIT など）は有効化して測定
- PHP OPcache/JIT も有効化して最適条件で測定

### 測定メトリクスの違い

| 言語 | ツール | メトリクス |
|------|--------|-----------|
| Ruby | benchmark/ips | iterations/second, mean, stdev |
| PHP | PHPBench | mean, mode, stdev, rstdev, mem_peak |

比較時は mean を基準に正規化。
