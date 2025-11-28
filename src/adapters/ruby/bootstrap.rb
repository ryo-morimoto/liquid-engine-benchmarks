# frozen_string_literal: true

##
# Ruby Adapter Bootstrap
#
# Common initialization for all Ruby Liquid adapters.
# Provides stdin/stdout handling and timing utilities.
#

require 'json'

##
# Read JSON input from stdin.
# Validates required fields: template, data, iterations, warmup.
#
# @return [Hash] Input with keys: template, data, iterations, warmup
#
def read_input
  input = $stdin.read

  if input.nil? || input.empty?
    warn 'Error: No input received from stdin'
    exit 1
  end

  begin
    decoded = JSON.parse(input)
  rescue JSON::ParserError => e
    warn "Error: Invalid JSON input: #{e.message}"
    exit 1
  end

  # Validate required fields
  required = %w[template data iterations warmup]
  required.each do |field|
    unless decoded.key?(field)
      warn "Error: Missing required field: #{field}"
      exit 1
    end
  end

  decoded
end

##
# Write JSON output to stdout.
# Conforms to adapter-output.schema.json.
#
# @param output [Hash] Output hash with library, version, lang, runtime_version, timings
#
def write_output(output)
  puts JSON.generate(output)
end

##
# Measure execution time in milliseconds.
#
# @yield Block to measure
# @return [Array] [result, time_ms]
#
def measure_time
  start = Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond)
  result = yield
  finish = Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond)

  # Convert nanoseconds to milliseconds
  time_ms = (finish - start) / 1_000_000.0

  [result, time_ms]
end

##
# Run benchmark iterations.
# Executes warmup runs (discarded) followed by measured iterations.
#
# @param iterations [Integer] Number of measured iterations
# @param warmup [Integer] Number of warmup iterations
# @yield [phase] Block that receives :parse or :render and returns the operation result
# @yieldparam phase [Symbol] Either :parse or :render
# @yieldparam parse_result [Object, nil] Parse result (only for :render phase)
# @return [Hash] { parse_ms: Array<Float>, render_ms: Array<Float> }
#
def run_benchmark(iterations:, warmup:, &block)
  parse_timings = []
  render_timings = []

  # Warmup runs (results discarded)
  warmup.times do
    parse_result = block.call(:parse, nil)
    block.call(:render, parse_result)
  end

  # Measured iterations
  iterations.times do
    # Measure parse
    parse_result, parse_time = measure_time { block.call(:parse, nil) }
    parse_timings << parse_time

    # Measure render
    _, render_time = measure_time { block.call(:render, parse_result) }
    render_timings << render_time
  end

  {
    parse_ms: parse_timings,
    render_ms: render_timings
  }
end
