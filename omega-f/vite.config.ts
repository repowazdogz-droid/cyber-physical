import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        determinations: resolve(__dirname, "determinations/index.html"),
        "determinations-2026-01": resolve(__dirname, "determinations/2026-01/index.html"),
        "det-2026-01-plain": resolve(__dirname, "determinations/2026-01/plain/index.html"),
        "det-2026-01-pdf": resolve(__dirname, "determinations/2026-01/pdf/index.html"),
        methodology: resolve(__dirname, "methodology/index.html"),
        archive: resolve(__dirname, "archive/index.html"),
        audit: resolve(__dirname, "audit/index.html"),
        about: resolve(__dirname, "about/index.html"),
        contact: resolve(__dirname, "contact/index.html"),
      },
    },
  },
});

