import { Command } from "commander";

export const validateCommand = new Command("validate")
  .description("Validate blackboard artifacts against schemas")
  .option("--spoke", "Validate spoke manifest (.collab/manifest.yaml)")
  .action((_opts) => {
    console.error("Not yet implemented: collab validate");
    process.exit(1);
  });
