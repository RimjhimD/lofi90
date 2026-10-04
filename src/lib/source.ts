import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { codeToHtml } from "shiki";

/** Reads a file under src/ (registry paths look like "src/library/..."). Runs at build time only. */
export async function readRepoFile(relPath: string): Promise<string> {
  if (!relPath.startsWith("src/")) throw new Error(`readRepoFile only reads files under src/: ${relPath}`);
  return readFile(path.join(process.cwd(), "src", relPath.slice(4)), "utf8");
}

export async function highlight(code: string, file: string): Promise<string> {
  const lang = file.endsWith(".md") ? "markdown" : file.endsWith(".ts") ? "ts" : "tsx";
  return codeToHtml(code, { lang, theme: "vitesse-dark" });
}
