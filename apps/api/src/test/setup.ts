import { testBucketName } from "./bucket";
import { testDatabaseUrl } from "./database-url";

process.env.DATABASE_URL = testDatabaseUrl();
process.env.S3_BUCKET = testBucketName();
process.env.NODE_ENV = "test";

process.env.BETTER_AUTH_URL ??= "http://localhost:3002";
process.env.BETTER_AUTH_SECRET ??= "test-secret-at-least-32-characters-long!!";
process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret";
process.env.CORS_ORIGIN ??= "http://localhost:3000";
