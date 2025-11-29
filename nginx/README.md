# Consolidated Nginx Configuration

This setup uses a single nginx folder to serve multiple sites including RSS Reader, Nextcloud, OpenCloud, Jellyfin, Portainer, and Vaultwarden.

## Configuration Files

- **`nginx.conf`** - Single-site RSS Reader (container-based)
- **`nginx-multi-site.conf`** - Multi-site production (external services)
- **`nginx-initial.conf`** - HTTP-only config for SSL certificate setup
- **`nginx-simple.conf`** - Basic config on port 8444 for testing
- **`entrypoint.sh`** - Startup script
- **`rss-reader-host-proxy.conf`** - Host-based proxy config (alternative)

## Supported Sites

- **streamlet.taranezy.com** - RSS Reader application
- **nextcloud.taranezy.com** - Nextcloud file sharing
- **opencloud.taranezy.com** - OpenCloud service (proxied to 192.168.100.5:9200)
- **jellyfin.taranezy.com** - Jellyfin media server (proxied to 192.168.100.5:8096)
- **portainer.taranezy.com** - Portainer Docker management
- **vaultwarden.taranezy.com** - Vaultwarden password manager

## Usage

### Single Site (RSS Reader only)
Use `docker-compose.prod.yml` in the `rss-reader-app` folder:
```bash
cd rss-reader-app
docker-compose -f docker-compose.prod.yml up -d
```
This uses `nginx.conf` which proxies to the local RSS Reader container.

### Multi-Site (All services)
Use `docker-compose.multi-site.yml` in the root:
```bash
# Configure environment
cp .env.multi-site.example .env
# Edit .env with your values

# Start all services
docker-compose -f docker-compose.multi-site.yml up -d
```
This uses `nginx-multi-site.conf` which proxies to external services.

## SSL Certificates

All domains need SSL certificates from Let's Encrypt using the `taranezy.com` certificate:
- Certificates should be at `/etc/letsencrypt/live/taranezy.com/`

## Switching Configurations

To use a different nginx config, modify the volume mount in docker-compose:

```yaml
volumes:
  - ./nginx/nginx-multi-site.conf:/etc/nginx/nginx.conf:ro  # For multi-site
  # or
  - ./nginx/nginx-initial.conf:/etc/nginx/nginx.conf:ro     # For SSL setup
  # or
  - ./nginx/nginx-simple.conf:/etc/nginx/nginx.conf:ro      # For testing
```