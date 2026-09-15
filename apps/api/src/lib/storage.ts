import { s3Env } from "@aecfolio/config";
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let internalClient: S3Client | undefined;
let publicClient: S3Client | undefined;

function createClient(endpoint: string) {
  return new S3Client({
    endpoint,
    region: s3Env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: s3Env.S3_ACCESS_KEY_ID,
      secretAccessKey: s3Env.S3_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

function internal() {
  internalClient ??= createClient(s3Env.S3_ENDPOINT);
  return internalClient;
}

function signer() {
  publicClient ??= createClient(s3Env.S3_PUBLIC_ENDPOINT);
  return publicClient;
}

function isNotFound(err: unknown) {
  return (
    err instanceof S3ServiceException &&
    (err.$metadata.httpStatusCode === 404 ||
      err.name === "NotFound" ||
      err.name === "NoSuchKey")
  );
}

export async function presignPut(
  key: string,
  contentType: string,
  size: number,
  expiresIn: number,
) {
  const url = await getSignedUrl(
    signer(),
    new PutObjectCommand({
      Bucket: s3Env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) },
  );
  return { url, headers: { "Content-Type": contentType } };
}

export function presignGet(
  key: string,
  expiresIn: number,
  disposition = "inline",
) {
  return getSignedUrl(
    signer(),
    new GetObjectCommand({
      Bucket: s3Env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: disposition,
    }),
    { expiresIn },
  );
}

export type ObjectHead = { size: number; contentType: string | null };

export async function headObject(key: string): Promise<ObjectHead | null> {
  try {
    const head = await internal().send(
      new HeadObjectCommand({ Bucket: s3Env.S3_BUCKET, Key: key }),
    );
    return {
      size: head.ContentLength ?? 0,
      contentType: head.ContentType ?? null,
    };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function readObjectPrefix(
  key: string,
  bytes: number,
): Promise<Uint8Array | null> {
  try {
    const res = await internal().send(
      new GetObjectCommand({
        Bucket: s3Env.S3_BUCKET,
        Key: key,
        Range: `bytes=0-${bytes - 1}`,
      }),
    );
    return res.Body ? await res.Body.transformToByteArray() : new Uint8Array();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
) {
  await internal().send(
    new PutObjectCommand({
      Bucket: s3Env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function ensureBucket() {
  try {
    await internal().send(new HeadBucketCommand({ Bucket: s3Env.S3_BUCKET }));
  } catch (err) {
    if (!isNotFound(err)) throw err;
    await internal().send(new CreateBucketCommand({ Bucket: s3Env.S3_BUCKET }));
  }
}

export async function ensureBucketCors(origins: string[]) {
  await internal().send(
    new PutBucketCorsCommand({
      Bucket: s3Env.S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "HEAD", "PUT"],
            AllowedHeaders: ["content-type"],
            ExposeHeaders: ["etag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}
