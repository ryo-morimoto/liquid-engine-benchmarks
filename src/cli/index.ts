/**
 * CLI Module - Public API
 *
 * Exports CLI command handlers.
 * Each command follows Unix philosophy: do one thing well.
 */

import { printHelp as benchHelp, run as benchRun } from "./bench";
import { printHelp as listHelp, run as listRun } from "./list";
import { printHelp as prepareHelp, run as prepareRun } from "./prepare";
import { printHelp as setupHelp, run as setupRun } from "./setup";

export const bench = { run: benchRun, printHelp: benchHelp };
export const list = { run: listRun, printHelp: listHelp };
export const prepare = { run: prepareRun, printHelp: prepareHelp };
export const setup = { run: setupRun, printHelp: setupHelp };
