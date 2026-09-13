const get = (key: string) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env variable: ${key}`);
  return val;
};

export const env = {
  DATABASE_URL: get("DATABASE_URL"),
  DIRECT_URL: get("DIRECT_URL"),
  S3_ENDPOINT: get("S3_ENDPOINT"),
  S3_REGION: get("S3_REGION"),
  S3_ACCESS_KEY: get("S3_ACCESS_KEY"),
  S3_SECRET_KEY: get("S3_SECRET_KEY"),
  S3_BUCKET: get("S3_BUCKET"),
  BETTER_AUTH_URL: get("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: get("BETTER_AUTH_SECRET"),
  GOOGLE_CLIENT_ID: get("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: get("GOOGLE_CLIENT_SECRET"),
  NODE_ENV: get("NODE_ENV"),
  PUPPETEER_EXECUTABLE_PATH: get("PUPPETEER_EXECUTABLE_PATH"),
  WORKER_URL: get("WORKER_URL"),
  API_PORT: parseInt(get("API_PORT"), 10),
  WORKER_PORT: parseInt(get("WORKER_PORT"), 10),
  VITE_API_URL: get("VITE_API_URL"),
};
