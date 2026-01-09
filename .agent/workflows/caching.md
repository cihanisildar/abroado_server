# Caching Strategy Workflow

This workflow describes the multi-layer caching strategy implemented for the Gurbetlik API.

## Layer 1: Gateway Proxy Cache (NGINX)
- **Purpose**: Cache complete HTTP responses to reduce latency and API load.
- **Location**: `docker/gateway/nginx.conf`
- **Storage**: `/var/cache/nginx/api_cache` (Shared across gateway instances)
- **TTL**: 10 minutes for 200 responses, 1 minute for 404s.
- **Debugging**: Check `X-Cache-Status` header (HIT/MISS/BYPASS).
- **Bypass**: Add `Cache-Control: no-cache` to your request header.

## Layer 2: Domain Object Cache (Redis)
- **Purpose**: Cache database query results and domain models.
- **Location**: `src/lib/redis.ts` & `src/repositories/*.ts`
- **Pattern**: Cache-Aside (Lazy loading).
- **TTL**: 1 hour (default for user profiles).
- **Consistency**: Cache is explicitly invalidated (`cache.del`) during updates.

## Verification
- Run `make cache-clear` to purge all gateway caches.
- Hit `/health` to verify Redis status.
- Use `curl -i` to verify NGINX cache headers.

## Scaling
- To scale Layer 1, add more gateway instances behind a Cloud Load Balancer.
- To scale Layer 2, upgrade Redis memory or use Redis Cluster.
