# ドキュメント

プロジェクトの使用方法・構成・貢献ガイド。他フェーズと並行作業可能。

## 依存関係

```
なし（独立）
```

---

## プロジェクトドキュメント

### 目的

プロジェクトの使用方法・構成・結果の説明

### 成果物

- README.md
- CONTRIBUTING.md

### README.md

```markdown
# Liquid Template Engine Benchmarks

Performance comparison benchmarks for PHP and Ruby Liquid template engine implementations.

## Target Libraries

| Language | Library | Note |
|----------|---------|------|
| Ruby | [Shopify/liquid](https://github.com/Shopify/liquid) | Official reference |
| PHP | [keepsuit/php-liquid](https://github.com/keepsuit/php-liquid) | PHP implementation |
| PHP | [kalimatas/php-liquid](https://github.com/kalimatas/php-liquid) | PHP implementation |

## Quick Start

### Requirements

- [Nix](https://nixos.org/download.html) (recommended)
- Or: PHP 8.3+, Ruby 3.3+, Composer, Bundler

### Setup

```bash
# Clone repository
git clone https://github.com/your/liquid-benchmarks.git
cd liquid-benchmarks

# Enter Nix environment
nix-shell

# Fetch vendor libraries
./scripts/setup-vendors.sh

# Install PHP dependencies
cd php && composer install && cd ..

# Install Ruby dependencies
cd ruby && bundle install && cd ..
```

### Run Benchmarks

```bash
# Run all benchmarks
./scripts/bench-all.sh

# PHP only (with profile)
./scripts/bench-php.sh quick      # Development
./scripts/bench-php.sh standard   # Standard
./scripts/bench-php.sh precise    # High precision

# Ruby only
./scripts/bench-ruby.sh
```

## Directory Structure

```
.
├── data/                 # Test data (YAML)
│   ├── small.yml
│   ├── medium.yml
│   ├── large.yml
│   └── 2xl.yml
├── templates/            # Liquid templates
│   ├── primitive/        # Basic elements
│   ├── ecommerce/        # E-commerce
│   ├── blog/             # Blog
│   ├── email/            # Email
│   ├── cms/              # CMS
│   └── stress/           # Stress tests
├── php/                  # PHP benchmarks
│   ├── composer.json
│   ├── phpbench.json
│   └── src/
├── ruby/                 # Ruby benchmarks
│   ├── Gemfile
│   └── benchmark.rb
├── vendors/              # Libraries (git clone)
├── scripts/              # Execution scripts
├── results/              # Benchmark results
└── docs/                 # Documentation
```

## Benchmark Categories

| Category | Description |
|----------|-------------|
| primitive | Variables, filters, conditions, loops |
| ecommerce | Products, collections, cart, checkout |
| blog | Posts, archives, categories |
| email | Order confirmation, shipping, multi-language |
| cms | Dynamic pages, forms |
| stress | Large data, deep nesting, load tests |

## Measurements

- **Parse**: Template parsing time
- **Render**: Rendering time
- **Parse + Render**: Total time
- **Memory**: Memory usage

## Results

See the `results/` directory for latest benchmark results.

## Version Switching

Run benchmarks with specific versions:

```bash
# Switch keepsuit to v0.9.0
./scripts/switch-version.sh keepsuit v0.9.0

# Switch Shopify/liquid to v5.8.0
./scripts/switch-version.sh shopify v5.8.0
```

## License

MIT
```

### CONTRIBUTING.md

```markdown
# Contributing

## Development Environment

```bash
# Nix recommended
nix-shell

# Or manually install PHP 8.3+ / Ruby 3.3+
```

## Adding Templates

1. Add `.liquid` file to `templates/<category>/`
2. Add corresponding data to `data/*.yml` if needed
3. Add test cases to PHP/Ruby benchmark code

### Constraints

- Use only Shopify official features
- Use `include` tag (`render` not supported by kalimatas)
- Verify all implementations work

## Adding Benchmarks

### PHP

Add method to `php/src/<Library>/<Library>Bench.php`:

```php
#[Bench\Groups(['category'])]
#[Bench\Revs(100)]
#[Bench\Iterations(10)]
public function benchNewTemplate(): void
{
    $template = Template::parse($this->loader->load('category', 'name'));
    $template->render($this->data);
}
```

### Ruby

Add to `ruby/benchmark.rb`:

```ruby
x.report('category/name - parse+render') do
  runner.benchmark_parse_and_render('category', 'name', data)
end
```

## PR Checklist

- [ ] Verify all implementations work
- [ ] `./scripts/bench-php.sh quick` succeeds
- [ ] `./scripts/bench-ruby.sh` succeeds
- [ ] Update documentation if needed
```

### 検証項目

- [ ] README.md 作成
- [ ] CONTRIBUTING.md 作成
- [ ] クイックスタート手順確認
- [ ] ディレクトリ構成図正確
- [ ] 全コマンド動作確認
