# Combined shell environment for all languages
# Use this shell when running benchmarks that require all languages
{ pkgs, shellConfigs }:

let
  # Merge buildInputs from all shell configurations
  allBuildInputs = builtins.concatLists (
    builtins.map (config: config.buildInputs or []) (builtins.attrValues shellConfigs)
  );

  # Merge shellHooks from all shell configurations
  allShellHooks = builtins.concatStringsSep "\n" (
    builtins.map (config: config.shellHook or "") (builtins.attrValues shellConfigs)
  );

  # Common utility tools
  commonTools = with pkgs; [
    jq       # JSON processing
    yq-go    # YAML processing
    gnuplot  # Graph generation
  ];

in
{
  buildInputs = allBuildInputs ++ commonTools;

  shellHook = ''
    echo "======================================"
    echo "Liquid Benchmark Environment"
    echo "======================================"
    ${allShellHooks}
    echo "======================================"
    echo "Common tools: jq, yq, gnuplot"
    echo "======================================"
  '';

  # Flag indicating all environments are active
  LIQUID_BENCH_ALL = "1";
}
