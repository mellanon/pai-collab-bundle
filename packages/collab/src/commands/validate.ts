import { Command } from "commander";
import { requireBlackboardRoot } from "../lib/discovery";
import { validateBlackboard } from "../lib/validator";
import { output } from "../lib/output";

export const validateCommand = new Command("validate")
  .description("Validate blackboard artifacts against schemas")
  .option("--spoke", "Validate spoke manifest (.collab/manifest.yaml)")
  .action((opts) => {
    if (opts.spoke) {
      console.error("Not yet implemented: collab validate --spoke");
      process.exit(1);
    }

    const root = requireBlackboardRoot();
    const violations = validateBlackboard(root.path);

    const parent = validateCommand.parent;
    if (parent?.opts().pretty) {
      if (violations.length === 0) {
        console.log("✓ All artifacts valid");
      } else {
        console.log(`Found ${violations.length} violation(s):\n`);
        for (const v of violations) {
          console.log(`  ✗ ${v.file}${v.field ? ` → ${v.field}` : ""}`);
          console.log(`    ${v.message}`);
          if (v.suggestion) {
            console.log(`    💡 ${v.suggestion}`);
          }
          console.log();
        }
      }
    } else {
      output(violations);
    }

    process.exit(violations.length > 0 ? 1 : 0);
  });
