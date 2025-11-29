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
  ];

  # Shell hook executed on environment activation
  shellHook = ''
    echo "PHP: $(php -v | head -1)"

    # OPcache/JIT settings for CLI
    export PHP_CLI_SERVER_WORKERS=4

    # Generate composer.json from leb.config.json
    bun src/run.ts setup php

    # Auto-install dependencies if vendor doesn't exist
    if [ -f composer.json ] && [ ! -d vendor ]; then
      echo "Installing PHP dependencies..."
      composer install --quiet
    fi
  '';

  # Environment identifier
  LIQUID_BENCH_PHP = "1";
}
