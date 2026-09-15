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

- **`proxy_pass` has no URI part.** nginx passes the path through untouched. A signature covers the path, so rewriting `/storage/` away would invalidate every URL.
- **`Host` is `$http_host`, not `$host`.** The signature also covers the host, including a port if the browser used one. `$host` drops the port.
- **The bucket name is fixed.** `compose.yml` hardcodes `S3_BUCKET: storage` and `GARAGE_DEFAULT_BUCKET: storage` rather than reading them from `.env`, because this location block cannot follow a rename.

Request buffering is off so an upload streams to Garage instead of spooling to disk first. The size cap is enforced twice upstream of this: the signature pins the exact `Content-Length` the API agreed to, and the API checks the stored object's size again before it will attach the key to anything.

Being public does not make the bucket readable. Garage refuses any request without a valid signature, and only the API holds the key.

## `server_name _`

The underscore is not a wildcard; nginx has no such syntax. It is simply a name that can never match a real `Host` header, used by convention to mean "this block is not claiming a domain."

What actually makes this block handle every request is `listen 80 default_server` — that flag means "serve anything arriving on this port that no other block claims." Since this is the only server block in the file, the effect is that the stack serves whatever domain it is deployed behind without needing an edit here.

## `client_max_body_size`

Raised to 10m. Students attach proof images and certificates, and nginx's 1m default rejects a phone photo before it ever reaches the API.

---

## The worker has no rule here, deliberately

There is no `location` block for the PDF worker, and there must not be one until the worker has authentication of its own.

The worker exposes endpoints that drive headless Chromium. It has no auth middleware and no shared secret, so anything that can reach port 3001 can drive it. Its only protection today is network topology: it publishes no port in `compose.yml` and nginx does not route to it, so it is reachable only from inside the compose network.

The API calls it directly over that network. Nothing outside needs to.

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
