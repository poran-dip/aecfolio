# AECFolio — nginx

The reverse proxy for the production stack. It is the only service in `compose.yml` that publishes a port, so everything reaching the application goes through here first.

`default.conf` is mounted read-only into the container at `/etc/nginx/conf.d/default.conf`.

---

## Routing

Three rules:

| Path            | Goes to                                  |
| --------------- | ---------------------------------------- |
| `/api/`         | `api:3002`                               |
| `/storage/`     | `garage:3900` (the object store)         |
| everything else | `web:3000` (the React Router SSR server) |

Because both the API and the web app are served from one origin, the browser makes same-origin requests and the session cookie travels without any cross-origin handling. That is also why `PUBLIC_ORIGIN` in `.env` is a single value that becomes the API origin, the web origin, and the browser's API origin at once — see `compose.yml`.

## `/storage/` is the bucket, not a prefix

Browsers upload proof and avatars straight to Garage with a presigned PUT, and download them through a presigned GET that `/api/.../proof` redirects to. Both URLs are signed by the API against `PUBLIC_ORIGIN`, path-style, so they look like `<PUBLIC_ORIGIN>/storage/<key>?X-Amz-Signature=...` — `storage` is the bucket name.

Three things in that block are load-bearing:

- **`proxy_pass` has no URI part.** The upstream variable holds only a scheme, host and port, so nginx passes the original request URI, query string included, through untouched. A signature covers the path, so rewriting `/storage/` away would invalidate every URL.
- **`Host` is `$http_host`, not `$host`.** The signature also covers the host, including a port if the browser used one. `$host` drops the port.
- **The bucket name is fixed.** `compose.yml` hardcodes `S3_BUCKET: storage` and `GARAGE_DEFAULT_BUCKET: storage` rather than reading them from `.env`, because this location block cannot follow a rename.

Request buffering is off so an upload streams to Garage instead of spooling to disk first. The size cap is enforced twice upstream of this: the signature pins the exact `Content-Length` the API agreed to, and the API checks the stored object's size again before it will attach the key to anything.

Being public does not make the bucket readable. Garage refuses any request without a valid signature, and only the API holds the key.

## Upstreams are resolved per request

`proxy_pass` points at variables (`$api_upstream`, `$garage_upstream`, `$web_upstream`) with `resolver 127.0.0.11`, Docker's embedded DNS, rather than at `http://web:3000` directly. This is deliberate, and reverting it brings back a 502.

With a literal hostname, nginx looks `web` up once when it starts and keeps that IP for the life of the process. `docker compose up -d --build` recreates `api` and `web` whenever their images change, and a recreated container usually gets a new IP, but nginx's own config is unchanged, so compose leaves the nginx container running. nginx then sends every request to an address nothing is listening on, and the whole site returns 502 while every container reports healthy. With a variable, nginx asks the resolver again, caching the answer for `valid=10s`, so a recreated container is picked up within seconds.

`ipv6=off` because the compose network has no IPv6 and a AAAA lookup only adds a failed attempt. If you add an upstream, give it a `set` at server level like the others, not a literal hostname in `proxy_pass`.

## `server_name _`

The underscore is not a wildcard; nginx has no such syntax. It is simply a name that can never match a real `Host` header, used by convention to mean "this block is not claiming a domain."

What actually makes this block handle every request is `listen 80 default_server` — that flag means "serve anything arriving on this port that no other block claims." Since this is the only server block in the file, the effect is that the stack serves whatever domain it is deployed behind without needing an edit here.

## `client_max_body_size`

Raised to 10m. Students attach proof images and certificates, and nginx's 1m default rejects a phone photo before it ever reaches the API.

---

## The worker has no rule here, deliberately

There is no `location` block for the PDF worker, and there must not be one. Nothing outside the compose network has a reason to reach it: the API calls it directly, and browsers only ever talk to the API.

Two controls keep it that way. The worker publishes no port and nginx does not route to it, so it is reachable only from inside the network. And every route that renders anything requires `Authorization: Bearer <WORKER_SECRET>`, a secret only the API holds, so reaching the port is not enough to drive Chromium. `/` and `/health` stay open so the container healthcheck works without the secret. Adding a route here would not open the worker, but it would give anyone who learns the secret a way in from outside, so don't.

## TLS is not configured

`compose.yml` publishes only port 80 (not port `443`). An earlier version published 443 and mounted a certificates volume with no server block using them. That reads as "HTTPS is handled" to anyone skimming the file, while doing nothing. It was removed in favour of being explicit.

To finish it: mount real certificates, uncomment and complete the `443` block, republish `443` in `compose.yml`, and redirect port 80 to it. Or terminate TLS at whatever fronts the deployment — a load balancer, Cloudflare, a host-level proxy — and leave this as it is.

## Changing this file

`compose.yml` mounts it read-only, so edits happen here and take effect on container restart:

```bash
docker compose restart nginx
```

Check the syntax before restarting:

```bash
docker compose exec nginx nginx -t
```
