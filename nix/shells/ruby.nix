# Ruby development environment
# Version is dynamically selected from bench.json via flake.nix
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

    # Auto-install dependencies if Gemfile exists
    if [ -f Gemfile ] && [ ! -d .bundle ]; then
      echo "Installing Ruby dependencies..."
      bundle install --quiet
    fi
  '';

  # Environment identifier
  LIQUID_BENCH_RUBY = "1";
}
