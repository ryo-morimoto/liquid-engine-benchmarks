# Ruby development environment
# Version is dynamically selected from leb.config.json via flake.nix
{ pkgs, rubyPackage }:

{
  buildInputs = [
    rubyPackage
    pkgs.bundler
    pkgs.jq
  ];

  # Shell hook executed on environment activation
  shellHook = ''
    echo "Ruby: $(ruby -v)"

    # Enable YJIT (JIT compiler available in Ruby 3.1+)
    export RUBY_YJIT_ENABLE=1

    # Generate Gemfile from leb.config.json if needed
    if [ -f leb.config.json ]; then
      # Extract Ruby libraries and generate Gemfile
      GEMFILE_GENERATED=$(jq -r '
        "# frozen_string_literal: true\n# Auto-generated from leb.config.json\n\nsource \"https://rubygems.org\"\n\n" +
        ([.libraries[] | select(.lang == "ruby") | "gem \"\(.package)\""] | join("\n"))
      ' leb.config.json)

      # Check if Gemfile needs to be updated
      if [ ! -f Gemfile ] || [ "$(cat Gemfile)" != "$GEMFILE_GENERATED" ]; then
        echo "Generating Gemfile from leb.config.json..."
        echo -e "$GEMFILE_GENERATED" > Gemfile
      fi
    fi

    # Auto-install dependencies if Gemfile exists
    if [ -f Gemfile ] && [ ! -f Gemfile.lock ]; then
      echo "Installing Ruby dependencies..."
      bundle install --quiet
    fi
  '';

  # Environment identifier
  LIQUID_BENCH_RUBY = "1";
}
