#!/usr/bin/env bun
/**
 * collab CLI
 * CLI for pai-collab blackboard operations
 */

import { Command } from "commander";
import { version } from "../package.json";
import { projectCommand } from "./commands/project";
import { issueCommand } from "./commands/issue";
import { statusCommand } from "./commands/status";
import { journalCommand } from "./commands/journal";
import { onboardCommand } from "./commands/onboard";
import { validateCommand } from "./commands/validate";
import { spokeCommand } from "./commands/spoke";

const program = new Command()
  .name("collab")
  .description("CLI for pai-collab blackboard operations")
  .version(version)
  .option("--json", "Output as JSON (default)")
  .option("--pretty", "Output as human-readable table");

program.addCommand(projectCommand);
program.addCommand(issueCommand);
program.addCommand(statusCommand);
program.addCommand(journalCommand);
program.addCommand(onboardCommand);
program.addCommand(validateCommand);
program.addCommand(spokeCommand);

program.parse();
