/**
 * F-4: TypeScript types for pai-collab blackboard artifacts.
 * Derived from pai-collab CONTRIBUTING.md schema definitions.
 */

// === PROJECT.yaml ===

export type ProjectStatus =
  | "proposed"
  | "building"
  | "hardening"
  | "contrib-prep"
  | "review"
  | "shipped"
  | "evolving"
  | "archived";

export type ProjectType = "skill" | "bundle" | "tool" | "infrastructure";

export interface ProjectContributor {
  zone: "maintainer" | "trusted" | "untrusted";
  since: string;
}

export interface ProjectSource {
  repo: string;
  branch: string;
}

export interface Project {
  name: string;
  maintainer: string;
  status: ProjectStatus;
  created: string;
  license: string;
  contributors: Record<string, ProjectContributor>;
  type?: ProjectType;
  upstream?: string;
  fork?: string;
  source?: ProjectSource;
  contrib_branch?: string;
  source_branch?: string;
  tag?: string;
  paths?: string[];
  tests?: string;
  docs?: string;
}

// === CONTRIBUTORS.yaml ===

export type TrustZone = "maintainer" | "trusted" | "untrusted";

export interface Contributor {
  zone: TrustZone;
  since: string;
  promoted_by?: string;
  timezone?: string;
  tags?: string[];
  availability?: "open" | "limited" | "unavailable";
}

export interface Contributors {
  contributors: Record<string, Contributor>;
}

// === JOURNAL.md ===

export type JournalPhase =
  | "Specify"
  | "Build"
  | "Harden"
  | "Contrib Prep"
  | "Review"
  | "Release"
  | "Evolve";

export interface JournalEntry {
  date: string;
  title: string;
  author: string;
  phase: string;
  status: string;
  issues: string[];
  whatHappened: string;
  whatEmerged: string;
}

export interface Journal {
  maintainer: string;
  entries: JournalEntry[];
}

// === REGISTRY.md ===

export interface RegistryProject {
  name: string;
  maintainer: string;
  status: string;
  source: string;
  contributors: string;
}

export interface RegistryAgent {
  agent: string;
  operator: string;
  platform: string;
  skills: string;
  availability: string;
  currentWork: string;
}

export interface Registry {
  projects: RegistryProject[];
  agents: RegistryAgent[];
}
