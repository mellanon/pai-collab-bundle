import { describe, test, expect } from "bun:test";
import { $ } from "bun";

const cli = join(import.meta.dir, "../src/index.ts");

function join(...parts: string[]) {
  return parts.join("/");
}

describe("CLI", () => {
  test("--version outputs version", async () => {
    const result = await $`bun ${cli} --version`.text();
    expect(result.trim()).toBe("0.1.0");
  });

  test("--help shows all command groups", async () => {
    const result = await $`bun ${cli} --help`.text();
    expect(result).toContain("project");
    expect(result).toContain("issue");
    expect(result).toContain("status");
    expect(result).toContain("journal");
    expect(result).toContain("onboard");
    expect(result).toContain("validate");
    expect(result).toContain("spoke");
  });

  test("project --help shows subcommands", async () => {
    const result = await $`bun ${cli} project --help`.text();
    expect(result).toContain("list");
    expect(result).toContain("status");
    expect(result).toContain("register");
  });

  test("spoke --help shows subcommands", async () => {
    const result = await $`bun ${cli} spoke --help`.text();
    expect(result).toContain("sync");
    expect(result).toContain("validate");
  });
});
