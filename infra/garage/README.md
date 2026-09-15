# AECFolio — Garage

The object store: proof files, avatars, and (soon) rendered CV PDFs. S3-compatible, so the API talks to it with the AWS SDK and nothing in the application is Garage-specific except the shape `packages/config` validates the keys in.

`garage.toml` is mounted read-only into the container at `/etc/garage.toml` by both compose files. Secrets are not in it; they come from the environment.

---

## Why Garage

MinIO was the plan, and its community edition is gone: no images published since late 2025, repository archived in 2026. Of what is left, RustFS was still at release candidates, Ceph wants three nodes minimum, and SeaweedFS and Garage were the two real options. Garage won on being a single binary with a one-node mode built in.

## First start does the setup

The container runs `garage server --single-node --default-bucket`. On first start that:

1. assigns a single-node cluster layout,
2. creates an access key from `GARAGE_DEFAULT_ACCESS_KEY` / `GARAGE_DEFAULT_SECRET_KEY`,
3. creates the bucket named by `GARAGE_DEFAULT_BUCKET` and grants that key read, write and owner on it.

On later starts it finds all three already present and changes nothing. There is no init container and no script to run by hand.

Compose feeds those variables from `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `S3_BUCKET`, the same values the API reads, so the two cannot disagree. **Changing the key in `.env` after first start does not rotate it** — Garage has already stored the old one. Rotate with `garage key` inside the container, or drop the volume in development.

Garage refuses a key id shorter than 8 characters at startup. `packages/config` goes further and requires the exact shape Garage generates (`GK` plus 24 hex, and a 64-hex secret), so a bad value fails in the API's error message instead of in Garage's logs.

## Addresses bind to `0.0.0.0`

Garage's example config binds `[::]`. On a host or Docker network without IPv6 that panics at startup inside the RPC layer, with a backtrace that does not mention the address. Both listeners bind IPv4 here.

## The bucket's CORS rules come from the API

In development the browser at `:3000` uploads to Garage at `:3900`, which is cross-origin. The API applies a CORS rule to the bucket on startup allowing `CORS_ORIGIN` to `PUT`, `GET` and `HEAD`. In production nginx serves the bucket from the same origin as the app, so the rule is unused there but harmless.

## Health

`/garage status` is the healthcheck. The image is `FROM scratch`, so there is no shell or `wget` to reach an HTTP endpoint with; the CLI talks to the node over RPC and exits non-zero if it cannot.

## Useful commands

```bash
docker compose -f compose.dev.yml exec garage /garage status
docker compose -f compose.dev.yml exec garage /garage bucket info storage
docker compose -f compose.dev.yml exec garage /garage key list
```
