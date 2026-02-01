import { Command } from "commander";

export const onboardCommand = new Command("onboard")
  .description("Agent onboarding pipeline");

onboardCommand
  .command("arrive")
  .description("Read governance docs and summarize")
  .action(() => {
    console.error("Not yet implemented: collab onboard arrive");
    process.exit(1);
  });

onboardCommand
  .command("discover")
  .description("Scan projects and find contribution opportunities")
  .action(() => {
    console.error("Not yet implemented: collab onboard discover");
    process.exit(1);
  });

onboardCommand
  .command("report")
  .description("Generate onboarding completion report")
  .action(() => {
    console.error("Not yet implemented: collab onboard report");
    process.exit(1);
  });
