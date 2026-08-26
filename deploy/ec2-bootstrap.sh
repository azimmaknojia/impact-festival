#!/bin/bash
# One-time setup on stealthtanks-web (Ubuntu). Run as root or with sudo.
set -euo pipefail

APP_DIR="/var/www/impact-festival"
DOMAIN="theimpactfestival.com"
REPO="https://github.com/azimmaknojia/impact-festival.git"

echo "===== Impact Festival EC2 bootstrap ====="

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx git

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
else
  cd "$APP_DIR" && git fetch origin main && git reset --hard origin/main
fi

cd "$APP_DIR"
mkdir -p data/registrations
chown -R ubuntu:ubuntu "$APP_DIR"

sudo -u ubuntu bash -lc "cd '$APP_DIR' && pm2 start ecosystem.config.js --env production || pm2 reload ecosystem.config.js --env production"
sudo -u ubuntu pm2 save

cp "$APP_DIR/deploy/nginx-http-only.conf" /etc/nginx/sites-available/impact-festival
ln -sf /etc/nginx/sites-available/impact-festival /etc/nginx/sites-enabled/impact-festival
nginx -t && systemctl reload nginx

echo ""
echo "Bootstrap complete."
echo "1. Point DNS for $DOMAIN to this server's public IP."
echo "2. Run: sudo bash $APP_DIR/deploy/ssl-setup.sh"
echo "3. Set REG_ADMIN_TOKEN in $APP_DIR/.env and restart PM2."
