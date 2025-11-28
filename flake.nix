{
  description = "Liquid template engine benchmarks";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Load benchmark configuration from leb.config.json
        # This is the single source of truth for runtime versions
        benchConfig = builtins.fromJSON (builtins.readFile ./leb.config.json);
        runtimes = benchConfig.runtimes;

        # Version string to Nix package name mapping
        # Maps version strings from leb.config.json to nixpkgs attribute names
        versionToPackage = {
          php = {
            "8.3" = "php83";
            "8.4" = "php84";
          };
          ruby = {
            "3.2" = "ruby_3_2";
            "3.3" = "ruby_3_3";
            "3.4" = "ruby_3_4";
          };
        };

        # Helper function to select package by version
        selectPackage = lang: version:
          let
            packageName = versionToPackage.${lang}.${version}
              or (throw "Unsupported ${lang} version: ${version}");
          in
            pkgs.${packageName};

        # Load language-specific shell definitions
        # Each file receives pkgs, version info, and returns mkShell arguments
        shellConfigs = {
          php = import ./nix/shells/php.nix {
            inherit pkgs;
            phpPackage = selectPackage "php" runtimes.php;
          };
          ruby = import ./nix/shells/ruby.nix {
            inherit pkgs;
            rubyPackage = selectPackage "ruby" runtimes.ruby;
          };
        };

        # Generate combined shell configuration for all languages
        allShellConfig = import ./nix/shells/all.nix {
          inherit pkgs shellConfigs;
        };

      in
      {
        devShells = {
          # Language-specific shells
          php = pkgs.mkShell shellConfigs.php;
          ruby = pkgs.mkShell shellConfigs.ruby;

          # Combined shell with all languages (default)
          default = pkgs.mkShell allShellConfig;
        };
      }
    );
}
