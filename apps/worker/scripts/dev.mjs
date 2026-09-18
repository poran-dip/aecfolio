#!/usr/bin/env node
import spawn from "cross-spawn";

const child = spawn("dotenv-run", ["--", "tsx", "watch", "src/index.ts"], {
  stdio: ["ignore", "inherit", "inherit"],
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
