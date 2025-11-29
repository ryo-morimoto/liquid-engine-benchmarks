/**
 * CLI Module - Public API
 *
 * Exports CLI command handlers.
 * Each command follows Unix philosophy: do one thing well.
 */

import { run as benchRun, printHelp as benchHelp } from "./bench";
import { run as listRun, printHelp as listHelp } from "./list";
import { run as prepareRun, printHelp as prepareHelp } from "./prepare";
import { run as setupRun, printHelp as setupHelp } from "./setup";

export const bench = { run: benchRun, printHelp: benchHelp };
export const list = { run: listRun, printHelp: listHelp };
export const prepare = { run: prepareRun, printHelp: prepareHelp };
export const setup = { run: setupRun, printHelp: setupHelp };
