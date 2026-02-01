import { Command } from "commander";
import { requireBlackboardRoot } from "../lib/discovery";
import { readAllProjects } from "../lib/parsers";
import { output } from "../lib/output";

export const projectCommand = new Command("project")
  .description("Manage blackboard projects");

projectCommand
  .command("list")
  .description("List all registered projects")
  .action(() => {
    const root = requireBlackboardRoot();
    const projects = readAllProjects(root.path);
    const rows = projects.map(({ dirName, project }) => ({
      name: project.name,
      dirName,
      maintainer: project.maintainer,
      status: project.status,
      type: project.type ?? "",
    }));

    const parent = projectCommand.parent;
    if (parent?.opts().pretty) {
      console.table(rows);
    } else {
      output(rows);
    }
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
