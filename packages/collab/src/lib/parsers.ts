/**
 * F-4: Schema parsing library.
 * Parse pai-collab blackboard artifacts into typed objects.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";
import type {
  Project,
  Contributors,
  Journal,
  JournalEntry,
  Registry,
  RegistryProject,
  RegistryAgent,
} from "./types";

// === PROJECT.yaml ===

export function readProject(projectDir: string): Project {
  const filePath = join(projectDir, "PROJECT.yaml");
  if (!existsSync(filePath)) {
    throw new Error(`PROJECT.yaml not found in ${projectDir}`);
  }
  const raw = readFileSync(filePath, "utf-8");
  try {
    return parseYaml(raw) as Project;
  } catch (e) {
    throw new Error(
      `Failed to parse PROJECT.yaml in ${projectDir}: ${(e as Error).message}`
    );
  }
}

export function readAllProjects(
  blackboardRoot: string
): Array<{ dirName: string; project: Project }> {
  const projectsDir = join(blackboardRoot, "projects");
  if (!existsSync(projectsDir)) {
    return [];
  }
  const dirs = readdirSync(projectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const results: Array<{ dirName: string; project: Project }> = [];
  for (const dirName of dirs) {
    const dirPath = join(projectsDir, dirName);
    if (existsSync(join(dirPath, "PROJECT.yaml"))) {
      try {
        results.push({ dirName, project: readProject(dirPath) });
      } catch {
        // Skip projects with unparseable PROJECT.yaml
      }
    }
  }
  return results;
}

// === CONTRIBUTORS.yaml ===

export function readContributors(blackboardRoot: string): Contributors {
  const filePath = join(blackboardRoot, "CONTRIBUTORS.yaml");
  if (!existsSync(filePath)) {
    throw new Error(`CONTRIBUTORS.yaml not found in ${blackboardRoot}`);
  }
  const raw = readFileSync(filePath, "utf-8");
  try {
    return parseYaml(raw) as Contributors;
  } catch (e) {
    throw new Error(
      `Failed to parse CONTRIBUTORS.yaml: ${(e as Error).message}`
    );
  }
}

// === JOURNAL.md ===

const HEADING_RE = /^(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+)$/;
const FIELD_RE = (name: string) =>
  new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+)$`, "m");
const ISSUE_RE = /#(\d+)/g;

function parseJournalEntry(block: string): JournalEntry | null {
  const lines = block.split("\n");
  const headingLine = lines[0]?.trim();
  if (!headingLine) return null;

  const headingMatch = headingLine.match(HEADING_RE);
  if (!headingMatch) return null;

  const [, date, title] = headingMatch;

  const text = lines.slice(1).join("\n");

  const author = text.match(FIELD_RE("Author"))?.[1]?.trim() ?? "";
  const phase = text.match(FIELD_RE("Phase"))?.[1]?.trim() ?? "";
  const status = text.match(FIELD_RE("Status"))?.[1]?.trim() ?? "";
  const issuesRaw = text.match(FIELD_RE("Issues"))?.[1] ?? "";
  const issues = [...issuesRaw.matchAll(ISSUE_RE)].map((m) => `#${m[1]}`);

  // Extract "What Happened" section
  const whatHappened = extractSection(text, "What Happened");
  const whatEmerged = extractSection(text, "What Emerged");

  return {
    date,
    title,
    author,
    phase,
    status,
    issues,
    whatHappened,
    whatEmerged,
  };
}

function extractSection(text: string, heading: string): string {
  const re = new RegExp(
    `###\\s*${heading}\\s*\\n([\\s\\S]*?)(?=###|---\\s*$|$)`
  );
  const match = text.match(re);
  return match?.[1]?.trim() ?? "";
}

export function readJournal(projectDir: string): Journal {
  const filePath = join(projectDir, "JOURNAL.md");
  if (!existsSync(filePath)) {
    return { maintainer: "", entries: [] };
  }
  const raw = readFileSync(filePath, "utf-8");

  // Extract maintainer from header
  const maintainerMatch = raw.match(FIELD_RE("Maintainer"));
  const maintainer = maintainerMatch?.[1]?.trim() ?? "";

  // Split on ## headings (entry boundaries)
  const blocks = raw.split(/\n(?=## \d{4})/);
  const entries: JournalEntry[] = [];

  for (const block of blocks) {
    const trimmed = block.replace(/^## /, "").trim();
    const entry = parseJournalEntry(trimmed);
    if (entry) {
      entries.push(entry);
    }
  }

  return { maintainer, entries };
}

// === REGISTRY.md ===

function parseMarkdownTable(text: string): string[][] {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return []; // header + separator + at least one row

  // Skip header and separator
  return lines.slice(2).map((line) =>
    line
      .split("|")
      .slice(1, -1) // Remove empty first/last from leading/trailing |
      .map((cell) => {
        // Strip markdown links: [text](url) → text
        return cell.trim().replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      })
  );
}

function extractTableAfterHeading(
  content: string,
  heading: string
): string[][] {
  const re = new RegExp(`##\\s*${heading}[\\s\\S]*?\\n(\\|[\\s\\S]*?)(?=\\n##|$)`);
  const match = content.match(re);
  if (!match) return [];
  return parseMarkdownTable(match[1]);
}

export function readRegistry(blackboardRoot: string): Registry {
  const filePath = join(blackboardRoot, "REGISTRY.md");
  if (!existsSync(filePath)) {
    throw new Error(`REGISTRY.md not found in ${blackboardRoot}`);
  }
  const raw = readFileSync(filePath, "utf-8");

  const projectRows = extractTableAfterHeading(raw, "Active Projects");
  const projects: RegistryProject[] = projectRows.map((cells) => ({
    name: cells[0] ?? "",
    maintainer: cells[1] ?? "",
    status: cells[2] ?? "",
    source: cells[3] ?? "",
    contributors: cells[4] ?? "",
  }));

  const agentRows = extractTableAfterHeading(
    raw,
    "Agent Registry \\(Daemon Entries\\)"
  );
  const agents: RegistryAgent[] = agentRows.map((cells) => ({
    agent: cells[0] ?? "",
    operator: cells[1] ?? "",
    platform: cells[2] ?? "",
    skills: cells[3] ?? "",
    availability: cells[4] ?? "",
    currentWork: cells[5] ?? "",
  }));

  return { projects, agents };
}
