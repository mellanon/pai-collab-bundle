import { Command } from "commander";

export const issueCommand = new Command("issue")
  .description("Manage GitHub issues");

issueCommand
  .command("list")
  .description("Query issues by scope, type, priority")
  .option("--scope <project>", "Filter by project scope label")
  .option("--type <type>", "Filter by type label")
  .option("--priority <priority>", "Filter by priority label")
  .action((_opts) => {
    console.error("Not yet implemented: collab issue list");
    process.exit(1);
  });

issueCommand
  .command("create")
  .description("Create a new issue with proper labels")
  .argument("<title>", "Issue title")
  .action((_title) => {
    console.error("Not yet implemented: collab issue create");
    process.exit(1);
  });
