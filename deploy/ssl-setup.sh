#!/bin/bash
# Run on the EC2 host after DNS points to this server.
set -euo pipefail

DOMAIN="theimpactfestival.com"
APP_DIR="/var/www/impact-festival"
EMAIL="${CERTBOT_EMAIL:-info@financial-loop.com}"

certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos --email "$EMAIL"

cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/impact-festival
ln -sf /etc/nginx/sites-available/impact-festival /etc/nginx/sites-enabled/impact-festival
nginx -t && systemctl reload nginx

echo "SSL active for https://$DOMAIN"
