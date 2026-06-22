---
name: caching-strategies
description: "Caching specialist covering HTTP caching, CDN, Redis patterns, cache invalidation, stale-while-revalidate, application-level caching, and cache thundering herd prevention. Use when implementing any caching layer — browser, CDN, server, or database. Invoke for Cache-Control headers, ETag/Last-Modified, Redis caching patterns, CDN configuration, SWR/Stale-while-revalidate, cache invalidation strategies, and preventing cache stampedes."
license: MIT
compatibility: opencode
metadata:
  author: opencode
  version: "1.0.0"
  domain: performance
  triggers: cache, caching, CDN, Redis, ETag, Cache-Control, stale, invalidation, performance, speed, memory, store, SWR
  role: specialist
  scope: implementation
  output-format: code
---

# Caching Strategies

Production-grade caching patterns for every layer of the stack. Caching is the #1 performance lever — and the #1 source of stale-data bugs.

## Core Principles

1. **Cache is a performance optimization, not a correctness strategy** — never trade correctness for speed.
2. **Every cache needs an invalidation strategy** — implicit (TTL) or explicit (event-driven). No cache lives forever.
3. **Cache at the right layer** — the further from the origin, the higher the impact and the harder the invalidation.
4. **Know your data** — static assets cache aggressively, user data cache rarely, API responses cache with care.
5. **Measure before caching** — profile which paths actually need caching. Don't cache prematurely.

## Cache Layers (Ordered by Distance from Origin)

```
Browser ── CDN ── Reverse Proxy ── Application ── Database
  ↑           ↑         ↑               ↑            ↑
  hardest     ...       ...             ...       easiest to invalidate
  to           precise
  invalidate
```

## HTTP Caching

### Cache-Control Directives

| Directive | Meaning | Use case |
|-----------|---------|----------|
| `public` | Any cache can store | Static assets, non-sensitive content |
| `private` | Only browser cache | User-specific content (dashboard, profile) |
| `no-cache` | Must revalidate with origin every time | Dynamic content that can be stale |
| `no-store` | Never cache | Sensitive data (auth tokens, PII) |
| `max-age=N` | Cache for N seconds | Versioned assets: 31536000 (1 year) |
| `s-maxage=N` | Shared cache max-age (overrides max-age for CDN/proxies) | Public API responses |
| `stale-while-revalidate=N` | Serve stale cache for N seconds while revalidating in background | News feeds, lists — freshness is not critical |
| `stale-if-error=N` | Serve stale cache for N seconds if origin errors | Graceful degradation |
| `immutable` | Never needs revalidation | Content-hashed assets (bundle.abc123.js) |

### ETag & Last-Modified

- **ETag**: Content hash (MD5/SHA of response body). Strong validator.
- **Last-Modified**: Timestamp. Weak validator (1-second resolution).
- Use ETag for precise caching, Last-Modified as fallback.
- For dynamic content, compute ETag from data version hash, not response body.

### Cache flow decision tree

```
Is this request cachable?
├── No (auth, POST, sensitive) → no-store
├── Yes → Is it a static asset?
│   ├── Yes → public, max-age=31536000, immutable
│   └── No → Is it user-specific?
│       ├── Yes → private, max-age=N
│       └── No → Is freshness critical?
│           ├── Yes → no-cache, ETag
│           └── No → public, max-age=N, stale-while-revalidate=M
```

## CDN Caching

### Configuration patterns

| Content type | CDN TTL | Browser TTL | Invalidation key |
|-------------|---------|-------------|------------------|
| Static assets (JS, CSS, images) | 1 year | 1 year | Content hash in URL |
| API responses (public) | 60s | 60s | URL + query params |
| API responses (user-specific) | 0 (bypass) | private | N/A |
| HTML pages | 300s | 300s | URL |
| Sitemaps, feeds | 3600s | 3600s | URL |
| Redirects, error pages | 60s | 60s | URL |

### CDN invalidation strategies

1. **URL-based** — Invalidate specific paths. Precise but slow for many URLs.
2. **Cache tag** — Tag responses with `Cache-Tag` header, invalidate by tag. Fast, bulk.
3. **Purge all** — Nuclear option. Avoid in production.
4. **Versioned URLs** — Old assets eventually expire via TTL. No invalidation needed.

### Cache tag pattern (CloudFront, Fastly, Cloudflare)

```http
Cache-Tag: product-123, category-electronics, region-us
```

Invalidate all responses tagged with `product-123` when the product updates.

## Redis Caching Patterns

### Read-Through

```
Request → Check Redis
├── Hit → Return cached data
└── Miss → Query DB → Store in Redis → Return data
TTL: set with expiry
```

### Write-Through

```
Write Request → Update DB → Update Redis (synchronously)
Cons: slower writes, always consistent
```

### Write-Behind (Write-Back)

```
Write Request → Update Redis → Async update DB
Pros: fast writes
Cons: data loss risk if Redis crashes before DB write
```

### Cache-Aside

```
Request → Check Redis → Miss → Query DB → Store in Redis → Return
Write → Delete from Redis (not update) → Write to DB
```

This is the most common and safest pattern.

### Redis data structures for caching

| Data type | Use case | TTL strategy |
|-----------|----------|-------------|
| String | Simple values, HTML fragments, serialized JSON | Fixed TTL |
| Hash | Object fields (user profile, product) | Per-hash TTL or field-level expiry |
| Sorted Set | Leaderboards, paginated feeds | Trim + TTL |
| List | Recent items, queues | LTRIM + TTL |
| Set | Tags, categories, unique visitors | TTL |

### Thundering herd prevention

When a popular cache key expires and multiple requests hit the DB simultaneously:

1. **Mutex locking** — One request acquires a lock, queries DB, updates cache. Others wait for the lock or serve stale.
2. **Early recompute** — Refresh cache before it expires (e.g., at 80% of TTL).
3. **Stale-while-revalidate** — Serve stale data, refresh async.
4. **Jitter TTL** — Add random offset to TTL to prevent mass expiry.

```python
# Mutex lock pattern (pseudocode)
if cache.exists(key):
    return cache.get(key)

if redis.lock(f"lock:{key}", ttl=5):
    data = db.query(...)
    cache.set(key, data, ttl=60)
    return data

# Other requests: wait and retry, or serve stale
sleep(0.1)
return cache.get(key)  # Likely populated now
```

## Application-Level Caching

### In-memory caching

| Library | Language | When to use |
|---------|----------|-------------|
| `node-cache` | Node.js | Simple TTL cache |
| `lru-cache` | Node.js | LRU eviction with max size |
| `functools.lru_cache` | Python | Function result caching |
| `cachetools` | Python | Advanced TTL + LRU |
| Guava Cache | Java | Production-grade, stats, eviction |
| `stale-while-revalidate` (lib) | JS | SWR pattern for API calls |

### SWR (Stale-While-Revalidate) pattern

```
1. Serve stale cached data immediately (instant)
2. Fetch fresh data in background (async)
3. Update cache with fresh data
4. Re-render with fresh data
```

Use `@tanstack/react-query` (formerly React Query), `swr` (Vercel), or `@ngneat/elf` for this pattern in frontend apps.

### Memoization

- Pure function results only
- LRU eviction for memory-bound applications
- WeakRef for automatic GC in JS

## Cache Invalidation Strategies

| Strategy | How | Best for |
|----------|-----|----------|
| **TTL** | Fixed time expiry | Data with known freshness window |
| **Event-driven** | Invalidate on data change | Data that changes infrequently with clear events |
| **Versioned** | Bump version key | API responses, configuration |
| **Tag-based** | Invalidate by tag group | Multi-key resources (product page has product + reviews + stock) |
| **Write-through** | Update cache on write | Consistency-critical data |
| **Manual purge** | Admin action or webhook | Emergency invalidation |

### Invalidation decision tree

```
Does data change?
├── Never → TTL = infinity (static assets with content hash)
├── Predictable schedule → TTL aligned to schedule (sitemaps, reports)
├── On explicit events → Event-driven (content publish → purge)
└── Arbitrarily → Hybrid: TTL baseline + event-driven early invalidation
```

### Propagating invalidations

For distributed caches, use:
- **Redis Pub/Sub** — One service publishes "key:product-123 invalidated", all caches handle it
- **Message queue** — More durable, survives restarts
- **Database change data capture (CDC)** — Debezium, read DB replication log

## Browser Caching (Service Workers)

### Cache strategies for SW

| Strategy | Implementation | Use case |
|----------|---------------|----------|
| Cache first, network fallback | Serve from cache, fetch on miss | Static assets, offline-first apps |
| Network first, cache fallback | Fetch from network, fallback to cache | API responses, dynamic content |
| Stale-while-revalidate | Serve cache, update in background | Lists, news feeds |
| Network only | Always fetch | Auth, payment, critical writes |
| Cache only | Never fetch | Pre-cached app shell |

### Cache versioning

```javascript
const CACHE_VERSION = 'v2'
const CACHE_NAME = `app-cache-${CACHE_VERSION}`

self.addEventListener('activate', (event) => {
  // Delete old caches
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(name => name !== CACHE_NAME)
      .map(name => caches.delete(name))
  )
})
```

## Cache Monitoring

| Metric | What it tells you |
|--------|------------------|
| Hit rate | % of requests served from cache. Target > 90% for static, > 70% for dynamic |
| Miss rate | What's not being cached. Investigate low-value misses |
| Staleness | Average age of served cached data |
| Invalidation latency | Time between data change and cache update |
| Eviction rate | How often TTL expires before next request (increase TTL or LRU size) |

## Anti-Patterns

| Anti-pattern | Why it's wrong | Fix |
|-------------|---------------|-----|
| Caching POST responses | POST is non-idempotent, implies side effects | Cache GET only |
| `max-age=0` instead of `no-cache` | Forces revalidation but still stores | Use `no-cache` for clarity |
| No cache invalidation plan | Data goes stale silently | Always set a TTL or add event-driven invalidation |
| Cache everything | Cache misses for short-tail data waste memory | Profile and cache selectively |
| Long TTL for user data | User sees stale profile/avatar | Use short TTL + background refresh |
| Not varying by `Accept` header | Cached HTML served when client wants JSON | Add `Vary: Accept` |
