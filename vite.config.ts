import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` produces dist/index.html as one self-contained file.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: "es2020", chunkSizeWarningLimit: 2000 },
});
