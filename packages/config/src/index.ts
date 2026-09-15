import { z } from "zod";

const nodeEnv = z
  .enum(["development", "production", "test"])
  .default("development");

const required = (hint: string) =>
  z.string(`required — ${hint}`).min(1, `required — ${hint}`);

const port = (fallback: number) =>
  z.coerce.number().int().min(1).max(65535).default(fallback);

const origin = (label: string) =>
  required(`${label}, as an absolute http(s) URL`)
    .refine((value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, `${label} — must be an absolute http(s) URL, e.g. http://localhost:3000`)
    .refine(
      (value) => !/\/api\/?$/.test(value),
      `${label} — must be an origin only; drop the trailing "/api" (call sites append their own /api/... path)`,
    )
    .transform((value) => value.replace(/\/+$/, ""));

const dbSchema = z.object({
  DATABASE_URL: required(
    "e.g. postgresql://postgres:password@localhost:15432/aecfolio",
  ),
});

const authSchema = z.object({
  BETTER_AUTH_URL: origin("origin of the API"),
  BETTER_AUTH_SECRET: required("generate with `openssl rand -base64 32`").min(
    32,
    "must be at least 32 chars — generate with `openssl rand -base64 32`",
  ),
  GOOGLE_CLIENT_ID: required("Google OAuth client ID"),
  GOOGLE_CLIENT_SECRET: required("Google OAuth client secret"),
});

const apiSchema = z.object({
  NODE_ENV: nodeEnv,
  API_PORT: port(3002),
  CORS_ORIGIN: origin("origin of the web app"),
  WORKER_URL: origin("origin of the worker").default("http://localhost:3001"),
});

const s3Schema = z.object({
  S3_ENDPOINT: origin("origin the API reaches the object store on"),
  S3_PUBLIC_ENDPOINT: origin(
    "origin the browser reaches the object store on, used to sign upload and download URLs",
  ),
  S3_REGION: z.string().min(1).default("garage"),
  S3_BUCKET: required("bucket name, e.g. storage"),
  S3_ACCESS_KEY_ID: required(
    "generate with `echo GK$(openssl rand -hex 12)`",
  ).regex(
    /^GK[0-9a-f]{24}$/,
    "must be GK followed by 24 hex chars — generate with `echo GK$(openssl rand -hex 12)`",
  ),
  S3_SECRET_ACCESS_KEY: required("generate with `openssl rand -hex 32`").regex(
    /^[0-9a-f]{64}$/,
    "must be 64 hex chars — generate with `openssl rand -hex 32`",
  ),
});

const workerSchema = z.object({
  NODE_ENV: nodeEnv,
  WORKER_PORT: port(3001),
  PUPPETEER_EXECUTABLE_PATH: z.string().min(1).optional(),
});

const webSchema = z.object({
  NODE_ENV: nodeEnv,
  PUBLIC_API_URL: origin("public origin of the API"),
  INTERNAL_API_URL: origin("internal origin of the API").default(
    "http://localhost:3002",
  ),
});

function formatIssues(scope: string, error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const key = issue.path.join(".") || "(root)";
    return `  ${key}: ${issue.message}`;
  });
  return `Invalid environment for "${scope}":\n${lines.join("\n")}\n\nSee .env.example at the repo root.`;
}

function lazyEnv<T extends z.ZodType<object>>(
  scope: string,
  schema: T,
): z.infer<T> {
  let cached: z.infer<T> | undefined;

  const load = (): z.infer<T> => {
    if (cached) return cached;
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) throw new Error(formatIssues(scope, parsed.error));
    cached = parsed.data;
    return cached;
  };

  return new Proxy({} as z.infer<T>, {
    get: (_target, prop) => load()[prop as keyof z.infer<T>],
    has: (_target, prop) => prop in load(),
    ownKeys: () => Reflect.ownKeys(load()),
    getOwnPropertyDescriptor: (_target, prop) => ({
      ...Object.getOwnPropertyDescriptor(load(), prop),
      configurable: true,
    }),
  });
}

export const dbEnv = lazyEnv("db", dbSchema);
export const authEnv = lazyEnv("auth", authSchema);
export const apiEnv = lazyEnv("api", apiSchema);
export const s3Env = lazyEnv("s3", s3Schema);
export const workerEnv = lazyEnv("worker", workerSchema);
export const webEnv = lazyEnv("web", webSchema);

export type DbEnv = z.infer<typeof dbSchema>;
export type AuthEnv = z.infer<typeof authSchema>;
export type ApiEnv = z.infer<typeof apiSchema>;
export type S3Env = z.infer<typeof s3Schema>;
export type WorkerEnv = z.infer<typeof workerSchema>;
export type WebEnv = z.infer<typeof webSchema>;
