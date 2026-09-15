export function testBucketName() {
  if (process.env.TEST_S3_BUCKET) return process.env.TEST_S3_BUCKET;
  const base = process.env.S3_BUCKET;
  if (!base)
    throw new Error(
      "Set S3_BUCKET (or TEST_S3_BUCKET) before running the apps/api suite.",
    );
  return base.endsWith("-test") ? base : `${base}-test`;
}
