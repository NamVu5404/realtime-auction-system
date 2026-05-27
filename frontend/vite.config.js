import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  server: {
    port: 5173,
  },
  build: {
    esbuild: {
      drop: ["console", "debugger"],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — tiny, load first
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor-react";
          }
          // antd UI — exclude icons so tree-shaking removes unused ones
          if (id.includes("node_modules/antd/") || id.includes("node_modules/rc-")) {
            return "vendor-antd";
          }
          // @ant-design/icons: merge into vendor-antd to avoid circular chunk warning
          // (antd internally imports some icons, causing icons → antd → icons cycle)
          if (id.includes("node_modules/@ant-design/")) {
            return "vendor-antd";
          }
          // Charts — heavy, lazy-loadable
          if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-")) {
            return "vendor-charts";
          }
          // Rich text editor
          if (id.includes("node_modules/@tiptap/")) {
            return "vendor-tiptap";
          }
          // Emoji picker — ~300KB, only used in chat
          if (id.includes("node_modules/emoji-picker-react/")) {
            return "vendor-emoji";
          }
          // WebSocket
          if (id.includes("node_modules/@stomp/") || id.includes("node_modules/sockjs-client/")) {
            return "vendor-ws";
          }
          // State & data fetching
          if (id.includes("node_modules/@tanstack/") || id.includes("node_modules/zustand/") || id.includes("node_modules/axios/")) {
            return "vendor-data";
          }
          // DnD
          if (id.includes("node_modules/@dnd-kit/")) {
            return "vendor-dnd";
          }
          // Utilities
          if (id.includes("node_modules/lodash/") || id.includes("node_modules/dayjs/") || id.includes("node_modules/jwt-decode/")) {
            return "vendor-utils";
          }
        },
      },
    },
  },
});
