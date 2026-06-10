import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: true,
  treeshake: true,
  external: ["pg"],
});
