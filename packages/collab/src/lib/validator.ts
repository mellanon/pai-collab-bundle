/**
 * F-5: Schema validation for pai-collab blackboard artifacts.
 * Reports violations with suggested fixes.
 */

import { join } from "path";
import {
  readProject,
  readAllProjects,
  readContributors,
  readJournal,
  readRegistry,
} from "./parsers";
import type { Project, ProjectStatus, TrustZone } from "./types";

export interface Violation {
  file: string;
  field: string;
  message: string;
  suggestion?: string;
}

const VALID_STATUSES: ProjectStatus[] = [
  "proposed", "building", "hardening", "contrib-prep",
  "review", "shipped", "evolving", "archived",
];

const VALID_LICENSES = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause"];

const VALID_ZONES: TrustZone[] = ["maintainer", "trusted", "untrusted"];

const VALID_PHASES = [
  "Specify", "Build", "Harden", "Contrib Prep", "Review", "Release", "Evolve",
];

function validateProject(
  dirName: string,
  project: Project
): Violation[] {
  const violations: Violation[] = [];
  const file = `projects/${dirName}/PROJECT.yaml`;

  const required: (keyof Project)[] = [
    "name", "maintainer", "status", "created", "license", "contributors",
  ];
  for (const field of required) {
    if (project[field] === undefined || project[field] === null) {
      violations.push({
        file,
        field,
        message: `Missing required field '${field}'`,
        suggestion: `Add '${field}' to PROJECT.yaml`,
      });
    }
  }

  if (project.status && !VALID_STATUSES.includes(project.status)) {
    violations.push({
      file,
      field: "status",
      message: `Invalid status '${project.status}'`,
      suggestion: `Valid values: ${VALID_STATUSES.join(", ")}`,
    });
  }

  if (project.license && !VALID_LICENSES.includes(project.license)) {
    violations.push({
      file,
      field: "license",
      message: `Invalid license '${project.license}'`,
      suggestion: `Accepted: ${VALID_LICENSES.join(", ")}`,
    });
  }

  if (project.contributors) {
    for (const [handle, contrib] of Object.entries(project.contributors)) {
      if (!contrib.zone) {
        violations.push({
          file,
          field: `contributors.${handle}.zone`,
          message: `Missing zone for contributor '${handle}'`,
          suggestion: `Add zone: maintainer | trusted | untrusted`,
        });
      } else if (!VALID_ZONES.includes(contrib.zone)) {
        violations.push({
          file,
          field: `contributors.${handle}.zone`,
          message: `Invalid zone '${contrib.zone}' for '${handle}'`,
          suggestion: `Valid zones: ${VALID_ZONES.join(", ")}`,
        });
      }
      if (!contrib.since) {
        violations.push({
          file,
          field: `contributors.${handle}.since`,
          message: `Missing 'since' date for contributor '${handle}'`,
          suggestion: `Add since: YYYY-MM-DD`,
        });
      }
    }
  }

  return violations;
}

function validateContributors(blackboardRoot: string): Violation[] {
  const violations: Violation[] = [];
  const file = "CONTRIBUTORS.yaml";

  try {
    const data = readContributors(blackboardRoot);
    if (!data.contributors) {
      violations.push({
        file,
        field: "contributors",
        message: "Missing 'contributors' key",
        suggestion: "Add top-level 'contributors:' map",
      });
      return violations;
    }
    for (const [handle, contrib] of Object.entries(data.contributors)) {
      if (!contrib.zone) {
        violations.push({
          file,
          field: `${handle}.zone`,
          message: `Missing zone for '${handle}'`,
          suggestion: `Add zone: maintainer | trusted | untrusted`,
        });
      } else if (!VALID_ZONES.includes(contrib.zone)) {
        violations.push({
          file,
          field: `${handle}.zone`,
          message: `Invalid zone '${contrib.zone}'`,
          suggestion: `Valid zones: ${VALID_ZONES.join(", ")}`,
        });
      }
      if (!contrib.since) {
        violations.push({
          file,
          field: `${handle}.since`,
          message: `Missing 'since' for '${handle}'`,
          suggestion: `Add since: YYYY-MM-DD`,
        });
      }
    }
  } catch (e) {
    violations.push({
      file,
      field: "",
      message: (e as Error).message,
    });
  }

  return violations;
}

function validateJournals(blackboardRoot: string): Violation[] {
  const violations: Violation[] = [];
  const projects = readAllProjects(blackboardRoot);

  for (const { dirName } of projects) {
    const projectDir = join(blackboardRoot, "projects", dirName);
    const journal = readJournal(projectDir);
    const file = `projects/${dirName}/JOURNAL.md`;

    for (const entry of journal.entries) {
      if (!entry.date) {
        violations.push({ file, field: "date", message: `Entry missing date` });
      }
      if (!entry.author) {
        violations.push({
          file,
          field: "author",
          message: `Entry '${entry.date} — ${entry.title}' missing Author`,
          suggestion: `Add **Author:** @handle (agent: name)`,
        });
      }
      if (!entry.phase) {
        violations.push({
          file,
          field: "phase",
          message: `Entry '${entry.date}' missing Phase`,
          suggestion: `Add **Phase:** ${VALID_PHASES.join(" | ")}`,
        });
      } else if (!VALID_PHASES.includes(entry.phase)) {
        violations.push({
          file,
          field: "phase",
          message: `Invalid phase '${entry.phase}' in entry '${entry.date}'`,
          suggestion: `Valid: ${VALID_PHASES.join(", ")}`,
        });
      }
      if (!entry.status) {
        violations.push({
          file,
          field: "status",
          message: `Entry '${entry.date}' missing Status`,
          suggestion: `Add **Status:** one-line description`,
        });
      }
    }
  }

  return violations;
}

function validateConsistency(blackboardRoot: string): Violation[] {
  const violations: Violation[] = [];

  try {
    const registry = readRegistry(blackboardRoot);
    const projects = readAllProjects(blackboardRoot);
    const projectMap = new Map(projects.map((p) => [p.dirName, p.project]));

    for (const rp of registry.projects) {
      // Try to find matching project by name or dirName
      const name = rp.name;
      const project = projectMap.get(name) ??
        [...projectMap.entries()].find(
          ([, p]) => p.name === name || p.name.toLowerCase() === name.toLowerCase()
        )?.[1];

      if (!project) continue;

      if (rp.status && project.status && rp.status !== project.status) {
        violations.push({
          file: "REGISTRY.md",
          field: "status",
          message: `Status mismatch for '${name}': REGISTRY says '${rp.status}', PROJECT.yaml says '${project.status}'`,
          suggestion: `Update REGISTRY.md to '${project.status}'`,
        });
      }
      if (rp.maintainer && project.maintainer && rp.maintainer.replace("@", "") !== project.maintainer) {
        violations.push({
          file: "REGISTRY.md",
          field: "maintainer",
          message: `Maintainer mismatch for '${name}': REGISTRY says '${rp.maintainer}', PROJECT.yaml says '${project.maintainer}'`,
          suggestion: `Update REGISTRY.md to '@${project.maintainer}'`,
        });
      }
    }
  } catch {
    // REGISTRY.md might not exist
  }

  return violations;
}

export function validateBlackboard(blackboardRoot: string): Violation[] {
  const violations: Violation[] = [];

  // Validate all PROJECT.yaml files
  const projects = readAllProjects(blackboardRoot);
  for (const { dirName, project } of projects) {
    violations.push(...validateProject(dirName, project));
  }

  // Validate CONTRIBUTORS.yaml
  violations.push(...validateContributors(blackboardRoot));

  // Validate JOURNAL.md entries
  violations.push(...validateJournals(blackboardRoot));

  // Cross-file consistency
  violations.push(...validateConsistency(blackboardRoot));

  return violations;
}
