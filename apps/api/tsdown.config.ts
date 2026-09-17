import { defineConfig } from "tsdown";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  deps: {
    neverBundle: ["pg"],
    alwaysBundle: [/^@aecfolio\/(db|shared|ui)(\/|$)/],
  },
  target: false,
});
