import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The repository root's .env. Variables already set in the shell win over the file.
const envFile = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}
