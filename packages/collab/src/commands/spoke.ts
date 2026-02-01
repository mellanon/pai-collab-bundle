import { Command } from "commander";

export const spokeCommand = new Command("spoke")
  .description("Spoke project operations");

spokeCommand
  .command("sync")
  .description("Generate .collab/status.yaml from current state")
  .action(() => {
    console.error("Not yet implemented: collab spoke sync");
    process.exit(1);
  });

spokeCommand
  .command("validate")
  .description("Validate .collab/manifest.yaml against spoke schema")
  .action(() => {
    console.error("Not yet implemented: collab spoke validate");
    process.exit(1);
  });
