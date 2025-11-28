# PHP development environment
# Version is dynamically selected from leb.config.json via flake.nix
{ pkgs, phpPackage }:

let
  # PHP package with required extensions for benchmarking
  php = phpPackage.withExtensions ({ enabled, all }: enabled ++ [
    all.opcache
  ]);
in
{
  buildInputs = [
    php
    php.packages.composer
    pkgs.jq
  ];

  # Shell hook executed on environment activation
  shellHook = ''
    echo "PHP: $(php -v | head -1)"

    # OPcache/JIT settings for CLI
    export PHP_CLI_SERVER_WORKERS=4

    # Generate composer.json from leb.config.json if needed
    if [ -f leb.config.json ]; then
      # Extract PHP libraries and generate composer.json
      COMPOSER_GENERATED=$(jq -r '
        {
          "name": "liquid-engine-benchmarks/adapters",
          "description": "PHP Liquid template engine adapters for benchmarking",
          "type": "project",
          "license": "MIT",
          "require": (
            { "php": ">=\(.runtimes.php)" } +
            ([.libraries[] | select(.lang == "php") | {(.package): "*"}] | add)
          ),
          "config": {
            "optimize-autoloader": true,
            "sort-packages": true
          }
        }
      ' leb.config.json)

      # Check if composer.json needs to be updated
      if [ ! -f composer.json ] || [ "$(cat composer.json)" != "$COMPOSER_GENERATED" ]; then
        echo "Generating composer.json from leb.config.json..."
        echo "$COMPOSER_GENERATED" > composer.json
      fi
    fi

    # Auto-install dependencies if composer.json exists
    if [ -f composer.json ] && [ ! -d vendor ]; then
      echo "Installing PHP dependencies..."
      composer install --quiet
    fi
  '';

  # Environment identifier
  LIQUID_BENCH_PHP = "1";
}
