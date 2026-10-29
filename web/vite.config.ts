import { defineConfig } from "vite";
import fs from "node:fs";
import { checkDocs } from "./src/docs/markdown.ts";
// @ts-ignore: a plain ES module shared with the build scripts
import { loadNetwork, htmlMeta } from "./scripts/network.mjs";
// PLEA_NETWORK picks the deployment at build time (scripts/network.mjs): its title, link previews and
// first paint go into index.html here; its chain, contracts and site settings into dist/imd-deployment.json (manifest.mjs).
const { site, net } = loadNetwork();
const meta: Record<string, string> = htmlMeta(site, net.network);
const keys: Record<string, string> = {
  PLEA_CHAIN: meta.chain,
  PLEA_TITLE: meta.title,
  PLEA_DESCRIPTION: meta.description,
  PLEA_OG_TITLE: meta.ogTitle,
  PLEA_OG_DESCRIPTION: meta.ogDescription,
  PLEA_OG_IMAGE: meta.ogImage,
  PLEA_OG_URL: meta.ogUrl,
  PLEA_OG_IMAGE_ALT: meta.ogImageAlt,
};
// The docs (docs/NN-slug.md at the repository root, rendered by src/docs): the build fails on a page
// outside the sidebar, an unknown {{number}} or diagram, a broken docs link or the word "mainnet"
// (src/docs/markdown.ts checkDocs; the unit tests run the same checks and the numbers' own).
function checkTheDocs() {
  const dir = new URL("../docs/", import.meta.url);
  const files = Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter((f) => /^\d\d-.*\.md$/.test(f))
      .map((f) => [f, fs.readFileSync(new URL(f, dir), "utf8")]),
  );
  const numbers = JSON.parse(fs.readFileSync(new URL("./src/docs/numbers.json", import.meta.url), "utf8"));
  const diagrams = fs
    .readdirSync(new URL("./src/docs/diagrams/", import.meta.url))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.slice(0, -4));
  return checkDocs(files, {
    numbers: Object.keys(numbers),
    diagrams,
    numberText: (k) => numbers[k]?.text,
  });
}
export default defineConfig({
  base: "./",
  // The dev server reads the docs from the repository root (src/docs/pages.ts).
  server: { fs: { allow: [".."] } },
  build: { outDir: "../dist", emptyOutDir: true, chunkSizeWarningLimit: 1200 },
  plugins: [
    {
      name: "plea-network-meta",
      transformIndexHtml: (html) =>
        html.replace(/%(PLEA_[A-Z_]+)%/g, (m, k) => {
          if (!(k in keys)) throw Error(`index.html names an unknown ${m}`);
          return keys[k];
        }),
    },
    {
      name: "plea-docs",
      buildStart() {
        const problems = checkTheDocs();
        if (problems.length) this.error(`The docs have ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
      },
    },
  ],
});
