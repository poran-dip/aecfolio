import { defineConfig } from "tsdown";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: ["src/index.ts", "src/manifests.ts", "src/fixtures.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  target: false,
});
