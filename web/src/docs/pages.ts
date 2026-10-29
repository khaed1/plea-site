/// <reference types="vite/client" />
/** The docs as bundled by Vite: the 18 Markdown files at the repository root (docs/NN-slug.md; the
 * folder docs/imd-run9 is not a page) as text, the diagrams in ./diagrams, and numbers.json. Parsed
 * once at load. The build (vite.config.ts, plugin "plea-docs") refuses a file outside the sidebar, an
 * unknown {{key}} or diagram, and the other checks of markdown.ts checkDocs. */
import type { ComponentType } from "react";
import { DOCS, fileOf } from "./order";
import { parse, type Block } from "./markdown";
import { numberWords } from "./numbers";
import { NUMBERS } from "./numbers-context";
import { buildIndex } from "./search";

export { NUMBERS };
const files = import.meta.glob("../../../docs/[0-9][0-9]-*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
export const DIAGRAMS = Object.fromEntries(
  Object.entries(
    import.meta.glob("./diagrams/*.tsx", { import: "default", eager: true }) as Record<string, ComponentType>,
  ).map(([path, component]) => [path.replace(/^.*\/|\.tsx$/g, ""), component]),
);
/** The file's own words for a number: ids and the search index never move with the chain. */
const fileText = (key: string) => numberWords(NUMBERS, key);
export type LoadedPage = (typeof DOCS)[number] & { blocks: Block[] };
export const PAGES: LoadedPage[] = DOCS.map((p) => {
  const md = files[`../../../docs/${fileOf(p)}`] ?? `# ${p.title}\n`;
  return { ...p, blocks: parse(md, fileText).blocks };
});
export const INDEX = buildIndex(PAGES, fileText);
