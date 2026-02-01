import { Command } from "commander";

export const journalCommand = new Command("journal")
  .description("Manage journal entries");

journalCommand
  .command("append")
  .description("Append a new journal entry")
  .option("--project <name>", "Project journal (default: root governance)")
  .action((_opts) => {
    console.error("Not yet implemented: collab journal append");
    process.exit(1);
  });
