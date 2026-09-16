import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import path from "path";

const env = loadEnv("test", process.cwd(), "");
Object.assign(process.env, env);

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
