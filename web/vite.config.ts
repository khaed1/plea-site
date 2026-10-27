import { defineConfig } from "vite";
// @ts-ignore: a plain ES module shared with the build scripts
import { loadNetwork, htmlMeta } from "./scripts/network.mjs";
// PLEA_NETWORK picks the deployment at build time (scripts/network.mjs): its title and link previews go
// into index.html here; its chain, contracts and site settings into dist/imd-deployment.json (manifest.mjs).
const { site, net } = loadNetwork();
const meta: Record<string, string> = htmlMeta(site);
const keys: Record<string, string> = {
  PLEA_TITLE: meta.title,
  PLEA_DESCRIPTION: meta.description,
  PLEA_OG_TITLE: meta.ogTitle,
  PLEA_OG_DESCRIPTION: meta.ogDescription,
  PLEA_OG_IMAGE: meta.ogImage,
  PLEA_OG_URL: meta.ogUrl,
  PLEA_OG_IMAGE_ALT: meta.ogImageAlt,
};
export default defineConfig({
  base: "./",
  build: { outDir: "../dist", emptyOutDir: true, chunkSizeWarningLimit: 1200 },
  // The first paint, before dist/imd-deployment.json has loaded, names the build's chain (main.tsx).
  define: { __PLEA_CHAIN__: JSON.stringify(net.network.name) },
  plugins: [
    {
      name: "plea-network-meta",
      transformIndexHtml: (html) =>
        html.replace(/%(PLEA_[A-Z_]+)%/g, (m, k) => {
          if (!(k in keys)) throw Error(`index.html names an unknown ${m}`);
          return keys[k];
        }),
    },
  ],
});
