import path from "node:path";
import { defineConfig } from "vitest/config";

// Keep tests isolated from Tailwind/PostCSS (native bindings); add @vitejs/plugin-react
// when you add `.tsx` tests that need JSX transform.
export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    // Use `jsdom` once on Node 20+ or with a pinned jsdom (v29 needs newer Node for ESM deps).
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
