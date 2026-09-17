import { defineConfig } from "tsdown";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: {
    index: "src/index.ts",
    manifests: "src/manifests.ts",
    fixtures: "src/fixtures.ts",
    icons: "src/icons/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  target: false,
});
