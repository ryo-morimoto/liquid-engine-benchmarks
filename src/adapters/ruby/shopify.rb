# frozen_string_literal: true

##
# Shopify Liquid Adapter
#
# Benchmarks shopify/liquid Ruby library.
# https://github.com/Shopify/liquid
#

require_relative 'bootstrap'
require 'liquid'

# Read input from stdin
input = read_input
template_source = input['template']
data = input['data']
iterations = input['iterations'].to_i
warmup = input['warmup'].to_i

# Run benchmark
timings = run_benchmark(iterations: iterations, warmup: warmup) do |phase, parse_result|
  case phase
  when :parse
    Liquid::Template.parse(template_source)
  when :render
    parse_result.render(data)
  end
end

# Get library version
version = Liquid::VERSION

# Output result
write_output(
  library: 'shopify/liquid',
  version: version,
  lang: 'ruby',
  runtime_version: RUBY_VERSION,
  timings: timings
)
