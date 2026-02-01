import { Command } from "commander";

export const projectCommand = new Command("project")
  .description("Manage blackboard projects");

projectCommand
  .command("list")
  .description("List all registered projects")
  .action(() => {
    console.error("Not yet implemented: collab project list");
    process.exit(1);
  });

projectCommand
  .command("status")
  .argument("[name]", "Project name")
  .description("Show detailed project status")
  .action((_name) => {
    console.error("Not yet implemented: collab project status");
    process.exit(1);
  });

projectCommand
  .command("register")
  .argument("<name>", "Project name to register")
  .description("Scaffold a new project directory")
  .action((_name) => {
    console.error("Not yet implemented: collab project register");
    process.exit(1);
  });
