import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // GitHub Pages project URL:
  // https://masarray.github.io/soundfiteq/
  //
  // Because the repository name is "soundfiteq",
  // Vite must build assets under /soundfiteq/.
  base: "/soundfiteq/",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
});
