# Vercel platform behavior for the TanStack Start + Nitro migration

Researched 2026-10-03. Target stack: TanStack Start, `nitro/vite`, Nitro `3.0.260903-beta`, Vercel preset, Vercel Functions on Fluid Compute.

Sources are limited to vercel.com/docs, vercel.com/kb, nitro.build, and the Nitro source on GitHub at tag `v3.0.260903-beta`. Every factual statement below cites its URL. The last two sections ("Implications for the plan" and "Unverified") are kept separate from the cited facts. Anything described as "derived from source" is my reading of Nitro code, not documented behavior.

---

## 1. Request limits

| Limit                                         | Value                          | Error when exceeded                             | Source                                                          |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------- | --------------------------------------------------------------- |
| Max URL length (path + query)                 | **14 KB**, enforced by the CDN | **414** `URL_TOO_LONG` ("Request-URI Too Long") | https://vercel.com/docs/errors/URL_TOO_LONG                     |
| Max single request header                     | **16 KB**                      | `REQUEST_HEADER_TOO_LARGE`                      | https://vercel.com/docs/errors/REQUEST_HEADER_TOO_LARGE         |
| Max combined request headers (names included) | **32 KB**                      | `REQUEST_HEADER_TOO_LARGE`                      | https://vercel.com/docs/errors/REQUEST_HEADER_TOO_LARGE         |
| Max request body to a Function                | **4.5 MB**                     | **413** `FUNCTION_PAYLOAD_TOO_LARGE`            | https://vercel.com/docs/functions/limitations#request-body-size |

- For URL_TOO_LONG, Vercel suggests: "Consider reducing the number of parameters or use `POST` method instead, where parameters can be sent in the request body" and "For form submissions, change from `GET` to `POST`" (https://vercel.com/docs/errors/URL_TOO_LONG).
- Cookies count toward the header limits: "Since cookies are included in the header, it's crucial to limit their size as part of the overall header size" (https://vercel.com/docs/errors/REQUEST_HEADER_TOO_LARGE).
- The `REQUEST_HEADER_TOO_LARGE` page I fetched did not show the HTTP status number. The search snippet for the same page says "Request failed statusCode: 431" (https://vercel.com/docs/errors/REQUEST_HEADER_TOO_LARGE). See Unverified.
- To get around the 4.5 MB body limit, Vercel recommends uploading directly from the client to storage such as Vercel Blob (https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).

## 2. Response limits and compression

### Size

- "The maximum payload size for the request body or the response body of a Vercel Function is **4.5 MB**." (https://vercel.com/docs/functions/limitations#request-body-size)
- A response over that size fails with `FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE`, status **500**, limit 4.5 MB (https://vercel.com/docs/errors/FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE).
- Streaming is exempt. The KB guide describes "streaming functions, which don't have this limit" and recommends streaming when a response can't be made smaller (https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
- Node.js Functions stream by default. The changelog title reads "Streaming now enabled by default for all Node.js Vercel Functions" (linked from https://vercel.com/docs/functions/streaming-functions). The Build Output API exposes `supportsResponseStreaming` in `.vc-config.json` (https://vercel.com/docs/build-output-api/primitives#serverless-function-configuration).
- Max duration with Fluid Compute is 300 s by default. On Pro/Enterprise it can go up to 800 s. "this includes time spent processing the request and sending the response, including streamed responses" (https://vercel.com/docs/functions/limitations#max-duration).
- **Cache size limit:** a response is only CDN-cacheable if it "doesn't exceed `10MB` in content length (`20MB` for streaming Vercel Function responses)" (https://vercel.com/docs/caching/cdn-cache#cacheable-response-criteria).

So the ~518 KB raw `/api/toc` JSON is roughly 9x under the 4.5 MB function limit and roughly 19x under the 10 MB cacheable limit.

### Compression

- The Vercel CDN supports gzip and Brotli and prefers Brotli when the client supports it (https://vercel.com/docs/how-vercel-cdn-works/compression#compression-algorithms).
- Compression is negotiated through `Accept-Encoding`. Browsers send it by default, which "automatically enables compression for Vercel's CDN". `curl`, Node `http`, and some bots don't send it (https://vercel.com/docs/how-vercel-cdn-works/compression#compression-negotiation).
- Only MIME types on an allowlist are compressed automatically. The list includes `application/json`, `application/javascript`, `font/otf`, `font/ttf`, `image/svg+xml`, `image/x-icon`, `text/css`, `text/plain`, and other text types (https://vercel.com/docs/how-vercel-cdn-works/compression#automatically-compressed-mime-types). `text/html` is not on the list as written; see Unverified. `woff`/`woff2` are not listed either (they are already compressed formats).
- `Accept` and `Accept-Encoding` are part of the CDN cache key by default (https://vercel.com/docs/caching/cdn-cache#use-cases).
- The compression page does not say whether the CDN compresses Function responses differently from static files. Its wording covers "deployment resources" in general (https://vercel.com/docs/how-vercel-cdn-works/compression).

## 3. CDN caching of Function responses

### What makes a Function response cacheable

- "To cache the response of Functions on Vercel's CDN, you must include `Cache-Control` headers with **any** of the following directives: `s-maxage=N`, `s-maxage=N, stale-while-revalidate=Z`, `s-maxage=N, stale-while-revalidate=Z, stale-if-error=Z`." `proxy-revalidate` is not supported (https://vercel.com/docs/caching/cdn-cache#using-vercel-functions).
- Cacheability criteria (https://vercel.com/docs/caching/cdn-cache#cacheable-response-criteria):
  - the request is `GET`/`HEAD` with no `Range` or `Authorization` header
  - the status is 200/404/410/301/302/307/308
  - the size is at most 10 MB (20 MB when streamed)
  - there is **no `set-cookie`**
  - there is no `private`/`no-cache`/`no-store`
  - there is no `Vary: *` and no `Vary` on a high-cardinality header such as `Cookie`
- The CDN cache is regional: "responses will be cached in the region the function was requested from" (https://vercel.com/docs/caching/cdn-cache#cache-control-options). It is "segmented by region" (https://vercel.com/docs/caching/cdn-cache#limits).
- When no cache header is set, the default is `cache-control: public, max-age=0, must-revalidate`, "which instructs both the CDN and the browser not to cache" (https://vercel.com/docs/caching/cache-control-headers#default-cache-control-value).
- Cache-Control set by a Function overrides headers for the same route in `vercel.json` (https://vercel.com/docs/caching/cdn-cache#how-to-cache-responses).

### `max-age` without `s-maxage`

- In `Cache-Control`, the documented directives that trigger Function caching all include `s-maxage` (https://vercel.com/docs/caching/cdn-cache#using-vercel-functions). Read literally, `Cache-Control: max-age=N` on its own does not populate the Vercel CDN cache.
- In the **targeted** headers (`CDN-Cache-Control`, `Vercel-CDN-Cache-Control`), `max-age` is the CDN TTL. In Vercel's example, `Vercel-CDN-Cache-Control: max-age=3600` gives "Vercel's Cache ... a TTL of 3600 seconds" (https://vercel.com/docs/caching/cache-control-headers#example-usage).

### `stale-while-revalidate` / `stale-if-error`

- `s-maxage` is the CDN freshness window. After it expires, the CDN serves the stale copy and revalidates asynchronously (https://vercel.com/docs/caching/cache-control-headers#s-maxage).
- `stale-while-revalidate` is supported. "The first request is served synchronously. Subsequent requests are served from the cache and revalidated asynchronously if the cache is 'stale'." (https://vercel.com/docs/caching/cache-control-headers#stale-while-revalidate)
- `stale-if-error` is supported. On a 500, network error or DNS error, the CDN serves the stale copy for the given window (https://vercel.com/docs/caching/cache-control-headers#stale-if-error).
- A request with `Pragma: no-cache` (which browser devtools often send) revalidates synchronously and returns `x-vercel-cache: REVALIDATED` (https://vercel.com/docs/caching/cache-control-headers#pragma-no-cache).

### Maximum duration honored

- "Max cache time: **1 year**" for `s-maxage`, `max-age` and `stale-while-revalidate`. "cache times are best-effort and not guaranteed ... If your asset is rarely requested (e.g. once a day), it may be evicted from the regional cache." (https://vercel.com/docs/caching/cdn-cache#limits)
- `s-maxage` ranges from 1 s to 31536000 s (https://vercel.com/docs/caching/cache-control-headers#s-maxage-example).

The planned `/api/toc` values (`s-maxage=2592000` = 30 days, `stale-while-revalidate=86400` = 1 day) are within these limits.

### What the browser receives

- "If you set `Cache-Control` without a `CDN-Cache-Control`, the Vercel CDN strips `s-maxage` and `stale-while-revalidate` from the response before sending it to the browser." (https://vercel.com/docs/caching/cdn-cache#cdn-cache-control)
- "If you use this header to instruct the CDN to cache data, such as with the `s-maxage` directive, Vercel returns the following `cache-control` header to the client: `cache-control: public, max-age=0, must-revalidate`" (https://vercel.com/docs/headers/response-headers#cache-control).
- In the comparison table, a Function sending `Cache-Control: s-maxage=60` results in `Cache-Control: public, max-age=0` reaching the client (https://vercel.com/docs/caching/cache-control-headers#functions-have-priority-over-config-files).
- When `CDN-Cache-Control` or `Vercel-CDN-Cache-Control` is also set, "Vercel forwards `Cache-Control` to the client as is, including `s-maxage`" (https://vercel.com/docs/caching/cache-control-headers#s-maxage).

These pages disagree on what happens to the browser-facing `max-age=1800` in a combined `Cache-Control` header. See Unverified.

### `CDN-Cache-Control` / `Vercel-CDN-Cache-Control`

- Both are supported as RFC 9213 targeted cache headers (https://vercel.com/docs/caching/cdn-cache#cdn-cache-control).
- Priority order (https://vercel.com/docs/caching/cache-control-headers#behavior):
  1. `Vercel-CDN-Cache-Control` has top priority, applies to Vercel only, and is consumed by Vercel, so it is never sent to the client or to downstream CDNs.
  2. `CDN-Cache-Control` "always overrides `Cache-Control`" and is also forwarded to downstream CDNs.
  3. `Cache-Control` has the lowest priority.
- Vercel's guidance (https://vercel.com/docs/caching/cache-control-headers#which-cache-control-headers-to-use-with-cdns):
  - use `Cache-Control` for the same policy everywhere
  - use `CDN-Cache-Control` for Vercel plus other CDNs
  - use `Vercel-CDN-Cache-Control` to target Vercel only
  - set all three to give each layer its own behavior
- Recommended values for a server-rendered page that is the same for every visitor: `max-age=0, s-maxage=86400`. A semi-static page: `max-age=120, s-maxage=86400` (https://vercel.com/docs/caching/cache-control-headers#recommended-settings).

### `x-vercel-cache` values

From https://vercel.com/docs/headers/response-headers#x-vercel-cache and https://vercel.com/docs/caching/cache-status:

| Value         | Meaning                                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HIT`         | Served from the cache, with no function invocation.                                                                                                                                                                        |
| `MISS`        | Not in the cache. Generated by the function or origin and stored if cacheable. Reasons include _Cold_ (first request, **after a new deployment**, or after eviction), _Request collapsed_, _Error_, and _Vary key denied_. |
| `STALE`       | A stale copy was served while the entry refreshed in the background. Reasons are _Time-based revalidation_ (SWR), _Tag-based invalidation_, and _Revalidation error_.                                                      |
| `PRERENDER`   | Served from static storage, for example a page prerendered at build time (Build Output API / ISR).                                                                                                                         |
| `REVALIDATED` | The entry had been deleted, for example by tag deletion or `Pragma: no-cache`, so it was regenerated in the foreground.                                                                                                    |
| `BYPASS`      | The cache was skipped on purpose. Reasons are Draft Mode, Prerender Bypass, and Crawler.                                                                                                                                   |

For runtime-cache data fetches the header "often shows `MISS` even if the data is served from the runtime cache" (https://vercel.com/docs/headers/response-headers#x-vercel-cache).

## 4. Cache invalidation

### New deployments

- The CDN cache key includes "The unique deployment URL", along with the method, URL, host and scheme. "Since each deployment has a different cache key, you can promote a new deployment to production without affecting the cache of the previous deployment." (https://vercel.com/docs/caching/cdn-cache/purge#cache-keys)
- A _Cold_ `MISS` happens "after a new deployment (Vercel scopes cached responses to the deployment that produced them)" (https://vercel.com/docs/caching/cache-status#cold).
- `max-age=0, s-maxage=86400` "lets Vercel's CDN cache and invalidate responses on deploy" (https://vercel.com/docs/caching/cache-control-headers#recommended-settings).
- ISR: "each new deployment uses its own ISR cache and does not reuse the cache from a previous deployment". "Cached content from previous deployments are not purged, so you can roll back without losing previously generated content." (https://vercel.com/docs/incremental-static-regeneration#benefits-of-vercels-cdn-for-isr)
- Static files are "automatically cached on Vercel's global network for the lifetime of the deployment after the first request". "If a static file is unchanged, the cached value can persist across deployments due to the hash used in the filename" (https://vercel.com/docs/caching/cdn-cache#static-files-caching).

In practice, every new deployment, production or preview, starts with a cold CDN cache for Function responses. Previous deployments keep their own caches.

### Cache keys and query strings

- The cache key includes the request URL, and "query strings are ignored for static files" (https://vercel.com/docs/caching/cdn-cache/purge#cache-keys). For Function responses, the query string is therefore part of the key.
- "Cache keys are not configurable. To purge the cache you must configure cache tags." (https://vercel.com/docs/caching/cdn-cache/purge#cache-keys)

### On-demand purge

Vercel offers two modes, _invalidate_ and _delete_ (https://vercel.com/docs/caching/cdn-cache/purge#understanding-cache-purging):

- **Invalidate** marks entries stale. The next request is served `STALE` and refreshed in the background.
- **Delete** removes entries. The next request is regenerated in the foreground (`REVALIDATED`) and can cause a stampede if many users hit it at once.

Purging by tag clears the CDN cache, the Runtime Cache and the Data Cache.

**Tagging responses** (https://vercel.com/docs/caching/cdn-cache/purge#cache-tags):

- Set a `Vercel-Cache-Tag: tag1,tag2` response header from a Function, or call `addCacheTag()` from `@vercel/functions`.
- Tags are case-sensitive and must not contain commas.
- Tags are scoped to project and environment (production or preview).
- Limits: 256 bytes per tag, 128 tags per response, 16 tags per bulk REST call (https://vercel.com/docs/caching/cdn-cache/purge#limits).

**Methods** (https://vercel.com/docs/caching/cdn-cache/purge#programmatically-purging-cdn-cache):

| Method              | Invalidate                                    | Delete                                                      |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `@vercel/functions` | `invalidateByTag()`, `invalidateBySrcImage()` | `dangerouslyDeleteByTag()`, `dangerouslyDeleteBySrcImage()` |
| CLI                 | `vercel cache invalidate --tag <t>`           | `vercel cache dangerously-delete --tag <t>`                 |
| REST                | `POST /v1/edge-cache/invalidate-by-tags`      | `/dangerously-delete-by-tag`                                |

**CLI** (https://vercel.com/docs/cli/cache):

```sh
vercel cache purge                 # purge CDN cache + Data cache for the current project
vercel cache purge --type cdn      # CDN cache only
vercel cache purge --type data     # Data cache only
vercel cache purge --yes           # skip confirmation
vercel cache invalidate --tag toc,filters            # mark stale (serve STALE, revalidate in background)
vercel cache dangerously-delete --tag toc            # delete (next request MISS, blocks)
vercel cache dangerously-delete --tag toc --revalidation-deadline-seconds 3600
```

**REST** (https://vercel.com/docs/rest-api/edge-cache/invalidate-by-tag):

```sh
curl -X POST 'https://api.vercel.com/v1/edge-cache/invalidate-by-tags?projectIdOrName=<project>&teamId=<team>' \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H 'Content-Type: application/json' \
  -d '{"tags":["toc"],"target":"production"}'
```

`target` is optional. It can be `production` or `preview`, and the default is all environments (https://vercel.com/docs/caching/cdn-cache/purge#cache-tag-scope).

**Dashboard** (https://vercel.com/docs/caching/cdn-cache/purge#manually-purging-vercel-cdn-cache):

1. Open Project, then **CDN**, then **Caches**, then **Purge cache**.
2. Choose Invalidate or Delete.
3. Choose Cache Tag or Source Image.
4. Enter a tag. "You can use `*` to purge the entire project."

Purging is free, but the regeneration it triggers is billed as normal usage (same URL).

**Nitro ISR on-demand:** set `vercel.config.bypassToken`, then send a `GET`/`HEAD` with `x-prerender-revalidate: <bypassToken>` (https://nitro.build/deploy/providers/vercel#on-demand-incremental-static-regeneration-isr, https://vercel.com/docs/frameworks/backend/nitro#on-demand-revalidation).

## 5. Nitro Vercel preset: Cache-Control and route rules

All source references are pinned to `v3.0.260903-beta`. The Nitro Vercel docs source is https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/docs/2.deploy/20.providers/vercel.md, rendered at https://nitro.build/deploy/providers/vercel.

### Available route rules

`headers`, `redirect`, `proxy`, `cors`, `cache`, `swr` ("Shortcut for `cache: { swr: true, maxAge: number }`"), `static`, `prerender`, and `isr` ("Incremental Static Regeneration (Vercel)") (https://nitro.build/docs/routing).

The unit tests confirm the shortcut. `swr: 60` normalizes to `cache: { swr: true, maxAge: 60 }`, and `swr: false` normalizes to `cache: false` (https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/test/unit/route-rules.test.ts).

### How the preset maps rules to Vercel output

- **`headers` / `redirect` rules** are written into the Build Output `config.json` `routes` as CDN-level header and redirect routes (`generateBuildConfig` in https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/presets/vercel/utils.ts). A `headers: { 'cache-control': ... }` route rule is therefore applied by Vercel's routing layer. Vercel docs say Function-returned Cache-Control overrides route-config headers for the same route (https://vercel.com/docs/caching/cdn-cache#how-to-cache-responses).
- **`proxy` rules** with an external URL and no advanced `ProxyOptions` become CDN rewrites, so no function is invoked (https://nitro.build/deploy/providers/vercel#proxy-route-rules).
- **`isr` rules** generate a Vercel **Prerender Function**: a `<route>-isr.func` plus a `.prerender-config.json` file (`generateFunctionFiles` / `writePrerenderConfig` in utils.ts above). The mapping is:
  - `isr: true` gives `expiration: false`, which never expires.
  - `isr: <number>` gives `expiration: <number>`.
  - An object passes through `expiration`, `group`, `allowQuery`, `passQuery` and `exposeErrBody` (https://nitro.build/deploy/providers/vercel#fine-grained-isr-config-via-route-rules).
  - "Do not combine the `isr` and `prerender` route rules on the same route." (same page)
- **What Vercel does with a Prerender Function:** it is "a Vercel Function that will be cached by the Vercel CDN in the same way as a static file". `expiration` is "Expiration time (in seconds) before the cached asset will be re-generated", where `false` means never. `allowQuery` behaves as follows: "If an empty array, query values are not considered for caching. If undefined each unique query value is cached independently" (https://vercel.com/docs/build-output-api/primitives#prerender-functions).
- **ISR on Vercel** has durable storage in the Function region, request collapsing, global purge within 300 ms, a 31-day unaccessed eviction, and a per-deployment cache. A failed revalidation keeps the stale copy and retries after 30 s (https://vercel.com/docs/incremental-static-regeneration). ISR is billed as function invocations plus ISR writes, ISR reads and Fast Origin Transfer (same page, "Pricing and limits").
- **The `swr` / `static` / `cache.swr` rules are rewritten to `isr` on Vercel** (derived from source). `deprecateSWR()` runs on `rollup:before` unless `future.nativeSWR: true` is set:
  - `cache: false` becomes `isr: false`
  - `static: X` becomes `isr: !X`
  - `cache.swr` becomes `isr = value.cache.swr`

  It then logs: "Nitro now uses `isr` option to configure ISR behavior on Vercel. Backwards-compatible support for `static` and `swr` options ... will be removed in the future versions." (https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/presets/vercel/utils.ts, `deprecateSWR`; hook wiring in https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/presets/vercel/preset.ts).

  Since `swr: 60` normalizes to `cache.swr === true`, this assignment produces `isr: true`, which means **`expiration: false` (never expires)**. The `maxAge: 60` is not carried over. This is my reading of the code; I have not tested it.

- The `future.nativeSWR` flag: "Opt in to Nitro's native `isr` route rule handling on Vercel and suppress backwards-compatibility warnings for legacy `swr`/`static` route options." (https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/types/config.ts)
- **The preset does not rewrite Cache-Control on Function responses.** I found no code in the preset's `utils.ts`/`preset.ts` that adds or alters `Cache-Control` on dynamic responses. The only Cache-Control it emits is for public-asset routes (see §6) and a `no-store` on 404s for missing assets (utils.ts, `generateBuildConfig`).
- Vercel's Nitro page lists Nitro ISR (via `isr` route rules and `bypassToken`) and Observability routing hints, which need `compatibilityDate >= 2025-07-15`, as supported (https://vercel.com/docs/frameworks/backend/nitro). Vercel's ISR framework table names Nuxt (`routeRules` + `isr`) and the generic "Build Output API — Define Prerender Functions". It does not list TanStack Start (https://vercel.com/docs/incremental-static-regeneration#using-isr).

## 6. Static assets (`public/`, build assets)

- Files in `.vercel/output/static` "are served with the Vercel Edge CDN" and are not modified (https://vercel.com/docs/build-output-api/primitives#static-files). Static files are cached on the CDN for the lifetime of the deployment after the first request. "Vercel **doesn't allow bypassing the cache for static files** by design." (https://vercel.com/docs/caching/cdn-cache#static-files-caching, https://vercel.com/docs/caching/cdn-cache#cacheable-response-criteria)
- **What Nitro emits for `public/` and Vite output** (derived from source):
  - The top-level `public/` directory gets `baseURL: "/"` and `fallthrough: true` (https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/config/resolvers/assets.ts).
  - The Vite client build output is registered as a public asset dir with `maxAge: 0, baseURL: "/", fallthrough: true` (https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/build/vite/plugin.ts, ~L467).
  - `getPublicAssetRoutes()` skips any dir with `fallthrough` or base `/` (utils.ts).

  So Nitro adds **no `Cache-Control` route** for `public/` files (fonts, favicon) or for hashed Vite chunks served from the root. The docs agree: "Falling-through directories are unaffected, including the top-level `public/` directory" (https://nitro.build/deploy/providers/vercel#public-asset-caching).

- Non-root, non-fallthrough `publicAssets` dirs get `Cache-Control: public, max-age=<maxAge>, immutable`, defaulting to **one year** if `maxAge` is unset. `maxAge: 0` opts out, and a `cache-control` route rule for the base overrides it. Missing files under such a base return `404` + `no-store` (https://nitro.build/deploy/providers/vercel#public-asset-caching; `DEFAULT_PUBLIC_ASSET_MAX_AGE = 31_536_000` in utils.ts).
- **Immutable static files:**
  - Opt-in, via `vercel.immutableStaticFiles: true` or `NITRO_VERCEL_IMMUTABLE_STATIC_FILES_ENABLED`.
  - Build assets are emitted under `/_vercel/immutable/` and shared across deployments.
  - The Nitro + Vite integration sets `assetsDir` automatically.
  - Not supported with a non-root `baseURL`.
  - The Nitro docs say "This feature is currently only available in the nightly release channel of Nitro v3" (https://nitro.build/deploy/providers/vercel#immutable-static-files).
  - On Vercel the preset turns it off with a warning unless the platform sets `VERCEL_IMMUTABLE_STATIC_FILES_ENABLED` (https://github.com/nitrojs/nitro/blob/v3.0.260903-beta/src/presets/vercel/immutable.ts).
- On the Vercel side, files under `/_vercel/immutable/` "are content-addressed, and Vercel serves them with `Cache-Control: public, max-age=31536000, immutable`" (https://vercel.com/docs/caching/cdn-cache#deleting-immutable-static-assets). They are "shared across deployments" and "always served with the routing config of the latest deployment" (https://vercel.com/docs/build-output-api/primitives#immutable-static-files).
- Vercel recommends `max-age=31536000, immutable` for "Immutable static assets (hashed JS, CSS, fonts)" and notes "Frameworks like Next.js set this automatically" (https://vercel.com/docs/caching/cache-control-headers#recommended-settings).
- `font/ttf` and `font/otf` are on the auto-compression allowlist, and so is `image/x-icon` (https://vercel.com/docs/how-vercel-cdn-works/compression#automatically-compressed-mime-types).

## 7. Vercel Web Analytics and Speed Insights

### Web Analytics

- **Enable it in the dashboard first:** Analytics, then the project, then **Enable**. "Enabling Web Analytics will add new routes (scoped at `/_vercel/insights/*` and `/<unique-path>/*`) after your next deployment." (https://vercel.com/docs/analytics/quickstart)
- Install with `npm i @vercel/analytics` (same page).
- **Generic React** (the docs' "create-react-app" tab): `import { Analytics } from '@vercel/analytics/react'` and render `<Analytics />` in the main app component. "When using the plain React implementation, there is no route support." (https://vercel.com/docs/analytics/quickstart)
- **"Other" frameworks:** call `inject()` from `@vercel/analytics`. It "should only be called once in your app, and must run in the client". There is no route support (same page).
- Props include `mode` (`auto` | `development` | `production`), `debug`, `beforeSend`, `scriptSrc`, `eventEndpoint` and `viewEndpoint`. Auto mode detection relies on env vars such as `NODE_ENV`. "If your used framework does not expose these environment variables, the automatic detection won't work correctly." (https://vercel.com/docs/analytics/package#mode)
- To verify, look for a Fetch/XHR request to `/<unique-path>/view` on page load (https://vercel.com/docs/analytics/quickstart). Custom events are Pro/Enterprise only (same page).

### Speed Insights

- Install with `npm i @vercel/speed-insights`. For React, `import { SpeedInsights } from '@vercel/speed-insights/react'` and render `<SpeedInsights />` in the main app file. "Other" frameworks call `injectSpeedInsights()` once, client-side (https://vercel.com/docs/speed-insights/quickstart).
- "Your deployments automatically include routes to collect Speed Insights events (scoped at `/_vercel/speed-insights/*` and `/<unique-path>/*`)." To verify, look for `/<unique-path>/script.js` in `<head>` (same page).
- The `/react` component accepts a `route` prop. Vercel's own example for older Next.js passes the router pathname into it (https://vercel.com/docs/speed-insights/quickstart, Next.js < 13.5 section).

### TanStack Start specifics

- Vercel's TanStack Start page covers setup with `nitro/vite` and Fluid Compute. It does **not** mention Analytics, Speed Insights, ISR or caching (https://vercel.com/docs/frameworks/full-stack/tanstack-start). The Vercel KB deploy guide has none of these topics either (https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel).
- Neither quickstart has a TanStack tab. The frameworks covered are nextjs, nextjs-app, sveltekit, remix, create-react-app, nuxt, vue, other, astro and html (https://vercel.com/docs/analytics/quickstart, https://vercel.com/docs/speed-insights/quickstart).
- npm registry check: `@vercel/analytics@2.0.1` exports `.`, `./react`, `./next`, `./remix`, `./vue`, `./nuxt`, `./astro`, `./sveltekit` and `./server`. `@vercel/speed-insights@2.0.0` has the same set without `./server`. Neither has a `./tanstack` entry (https://registry.npmjs.org/@vercel/analytics/latest, https://registry.npmjs.org/@vercel/speed-insights/latest).

---

## Implications for the plan

These are my inferences from the facts above. They are not cited facts.

- **Don't put large filter codes in the URL.** 14 KB is the hard CDN limit (414). A typical code (~1.3 KB of base64) fits easily. Codes of "tens of KB" will fail on `/?code=...`. Keep `?code=` for typical and shareable links. Route anything over roughly 8–10 KB, leaving room for path and other params, through the form `POST` to a server function, where the 4.5 MB body limit applies. Guard the size on the client before navigating, and show a clear error for a 414 instead of a blank failure.
- **POSTed renders are never CDN-cached.** Only `GET`/`HEAD` is cacheable, so every POST render is a function invocation. `GET /?code=` responses are cacheable per unique query string, if the HTML is public. Don't set cookies on that response; any `set-cookie` disables caching.
- **`/api/toc` will be cached as intended, but make the policy explicit with targeted headers.** The current header is valid and within limits, and Vercel compresses `application/json` automatically, so don't gzip in-app. The docs conflict on whether the browser sees `max-age=1800` or `max-age=0` when `s-maxage` is in plain `Cache-Control`. To remove the ambiguity, send:
  - `Cache-Control: public, max-age=1800` for browsers
  - `Vercel-CDN-Cache-Control: max-age=2592000, stale-while-revalidate=86400` for the Vercel CDN

  Also add `Vercel-Cache-Tag: toc` so `vercel cache invalidate --tag toc` can refresh it without a redeploy. Check with `curl -sI -H 'Accept-Encoding: br'` and look at `x-vercel-cache`.

- **Expect a cold cache after every deploy.** The cache key includes the deployment URL, so each production or preview deploy starts empty for `/api/toc` and SSR HTML. The first request in each region pays the full cost. The 30-day `s-maxage` only helps between deploys, and nothing has to be purged manually on deploy.
- **Don't use Nitro `swr`/`cache` route rules on Vercel without `future.nativeSWR: true`.** Based on my reading of the source, `swr: N` silently becomes `isr: true` (never expires) and drops `N`. If ISR is actually wanted, use an explicit `isr: { expiration, allowQuery: [...] }`, and remember that it ignores the response's Cache-Control in favor of the prerender config. For this app, plain `Cache-Control` / `Vercel-CDN-Cache-Control` from the handler is simpler and enough. Keep `isr` out of `/` unless `allowQuery: ['code']` is set deliberately.
- **Set long cache headers on fonts and hashed assets yourself, or enable immutable static files.** With the default Nitro + Vite output, root `public/` files and Vite chunks get no Nitro-generated `Cache-Control`. Either add `routeRules: { '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } } }`, adjusted to TanStack Start's real asset dir, or try `vercel.immutableStaticFiles`, which is flagged nightly-only and platform-gated. Give fonts/favicon in `public/` a shorter `max-age`, or rename them with a hash.
- **Analytics and Speed Insights:** enable Web Analytics in the dashboard, then render `<Analytics />` (`@vercel/analytics/react`) and `<SpeedInsights route={matchedRoutePattern} />` (`@vercel/speed-insights/react`) once in the TanStack root route's document shell. Both inject client scripts and don't block SSR. Pass `mode` explicitly if `NODE_ENV` detection misbehaves under Vite. There is no TanStack-specific package, and the docs say page-view route grouping isn't supported for plain React.

## Unverified

- **Status code for `REQUEST_HEADER_TOO_LARGE`.** The docs page as fetched didn't show it. 431 appears only in a search-result title (a community thread) and is not confirmed on vercel.com/docs.
- **What the browser receives for `/api/toc`'s combined `Cache-Control`.** Does it see `max-age=1800`, with only `s-maxage`/`swr` stripped (cdn-cache page), or `public, max-age=0, must-revalidate` (response-headers page and the comparison table)? Test with `curl -I` on a deployment.
- **Whether `Cache-Control: max-age=N` with no `s-maxage` is ever cached at the Vercel edge for Function responses.** The docs only list `s-maxage` variants, but the `stale-if-error` example uses `max-age=604800` with no `s-maxage`.
- **Whether `text/html` (SSR output) is auto-compressed.** It is not literally on the allowlist (`xhtml+xml` is), yet the page says HTML files compress 21% better with Brotli. Check `Content-Encoding` on a deployed SSR page.
- **Whether the CDN compresses streamed Function responses,** and what happens if the app sets `Content-Encoding` itself.
- **Whether the 4.5 MB response limit is measured before or after compression.** Not relevant at ~518 KB.
- **Exact default `Cache-Control` Vercel sends for files in `.vercel/output/static`** that Nitro emits without a header (fonts, favicon, Vite chunks). The documented global default is `public, max-age=0, must-revalidate`, but no page states it specifically for static files.
- **How `swr: N` maps to `isr` in practice.** That it becomes `isr: true` with no expiration comes from reading `deprecateSWR` plus the normalization tests, not from a build. Also unknown: what `future.nativeSWR: true` does at runtime for `cache`/`swr` rules on Vercel (Nitro's ocache-backed handler with per-instance storage), and whether it emits `s-maxage` headers.
- **Query-string handling for ISR when `allowQuery` is undefined.** Vercel's Nitro page says query params are "ignored by cache unless you specify them in the `allowQuery` array". The Build Output API spec says that when it is undefined, "each unique query value is cached independently". The Nitro docs agree with the latter.
- **Status of immutable static files in `3.0.260903-beta`.** The docs say nightly-only, but the code ships in this beta, gated on `VERCEL_IMMUTABLE_STATIC_FILES_ENABLED`.
- **Whether TanStack Start's own Vite/Nitro integration sets `Cache-Control` on `/assets/*`.** Not covered by these sources; check the TanStack Start research doc or a built `.vercel/output/config.json`.
- **Whether `@vercel/analytics/react` `<Analytics />` tracks client-side navigations in a TanStack Router SPA transition.** Docs only say "no route support" for plain React.
