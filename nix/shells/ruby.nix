# Ruby development environment
# Version is dynamically selected from leb.config.json via flake.nix
{ pkgs, rubyPackage }:

{
  buildInputs = [
    rubyPackage
    pkgs.bundler
  ];

  # Shell hook executed on environment activation
  shellHook = ''
    echo "Ruby: $(ruby -v)"

    # Enable YJIT (JIT compiler available in Ruby 3.1+)
    export RUBY_YJIT_ENABLE=1

    # Generate Gemfile from leb.config.json
    bun src/run.ts setup ruby

    # Auto-install dependencies if Gemfile.lock doesn't exist
    if [ -f Gemfile ] && [ ! -f Gemfile.lock ]; then
      echo "Installing Ruby dependencies..."
      bundle install --quiet
    fi
  '';

  # Environment identifier
  LIQUID_BENCH_RUBY = "1";
}
