import { Command } from "commander";

export const statusCommand = new Command("status")
  .description("Show blackboard-wide overview")
  .option("--include-spokes", "Include spoke project status")
  .action((_opts) => {
    console.error("Not yet implemented: collab status");
    process.exit(1);
  });
