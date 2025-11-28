# Contributing

## Welcome Contributions

### Add new libraries

Add Liquid implementations to benchmark:

- [osteele/liquid](https://github.com/osteele/liquid) (Go)
- [cobalt-org/liquid-rust](https://github.com/cobalt-org/liquid-rust) (Rust)
- [harttle/liquidjs](https://github.com/harttle/liquidjs) (Node.js)

### Optimize runtime configurations

Improve benchmark accuracy with better runtime settings:

- PHP: OPcache, JIT tuning
- Ruby: YJIT options
- New languages: equivalent optimizations

### Add benchmark cases

Expand test coverage:

- New templates in `templates/<category>/`
- New data scales in `data/`
- Edge cases and real-world scenarios

### Add new languages

Extend beyond PHP/Ruby:

- Go, Rust, Node.js, Python implementations
- Consistent benchmark structure across languages

### Maintenance

- Dependency updates
- CI/CD improvements
- Bug fixes

## Setup

```bash
nix-shell
./scripts/setup-vendors.sh
cd php && composer install && cd ..
cd ruby && bundle install && cd ..
```

## Before PR

```bash
./scripts/bench-php.sh quick
./scripts/bench-ruby.sh
```
