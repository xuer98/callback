import type { UiFile, UiTemplate, UiWorkspace } from "./types";

// Boundary validation for the admin console's "UI workspace" JSON: the
// default template, its optional alternate in the other framework, and per
// template the starter files, the reference files and, for React, the test
// file's contents. Used by admin-actions.ts once the JSON has parsed.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUiFiles(
  value: unknown,
  label: string,
): { files: UiFile[] } | { error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: `${label} must be a non-empty array of {name, contents}.` };
  }
  for (const file of value) {
    if (
      !isRecord(file) ||
      typeof file.name !== "string" ||
      file.name.trim() === "" ||
      typeof file.contents !== "string"
    ) {
      return {
        error: `Every file in ${label} needs a name and contents string.`,
      };
    }
  }
  return { files: value as unknown as UiFile[] };
}

function parseUiTemplate(
  value: unknown,
  label: string,
): { template: UiTemplate } | { error: string } {
  if (
    !isRecord(value) ||
    (value.framework !== "react" && value.framework !== "vanilla")
  ) {
    return {
      error: `${label} must be {"framework": "react" | "vanilla", "files": [{name, contents}, ...], "solution"?: [...], "tests"?: "..."}.`,
    };
  }
  const files = parseUiFiles(value.files, `${label}.files`);
  if ("error" in files) return files;
  const template: UiTemplate = {
    framework: value.framework,
    files: files.files,
  };
  if (value.solution !== undefined) {
    const solution = parseUiFiles(value.solution, `${label}.solution`);
    if ("error" in solution) return solution;
    template.solution = solution.files;
  }
  if (value.tests !== undefined) {
    if (typeof value.tests !== "string" || value.framework !== "react") {
      return {
        error: `${label}.tests must be a string, the contents of the test file, and only React templates have one.`,
      };
    }
    template.tests = value.tests;
  }
  return { template };
}

/** A parsed "UI workspace" value, checked field by field. */
export function parseUiWorkspace(
  value: unknown,
): { ui: UiWorkspace } | { error: string } {
  const primary = parseUiTemplate(value, "UI workspace");
  if ("error" in primary) return primary;
  const ui: UiWorkspace = { ...primary.template };
  const alternateRaw = (value as Record<string, unknown>).alternate;
  if (alternateRaw !== undefined) {
    const alternate = parseUiTemplate(alternateRaw, "UI workspace alternate");
    if ("error" in alternate) return alternate;
    if (alternate.template.framework === ui.framework) {
      return { error: "The alternate template must use the other framework." };
    }
    ui.alternate = alternate.template;
  }
  return { ui };
}
