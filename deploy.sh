#!/bin/bash
# Deploy Impact Festival to AWS EC2 (stealthtanks-web).
# Requires SSH key with access to the server (stealthtanks-key).
set -euo pipefail

cd "$(dirname "$0")"

EC2_HOST="${EC2_HOST:-32.193.181.198}"
EC2_USER="${EC2_USER:-ubuntu}"
APP_DIR="/var/www/impact-festival"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/stealthtanks-key}"

if [ ! -f "$SSH_KEY" ]; then
  echo "SSH key not found: $SSH_KEY"
  echo "Set SSH_KEY to the private key for stealthtanks-web, or use GitHub Actions deploy."
  exit 1
fi

RSYNC_SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"

echo "Deploying to $EC2_USER@$EC2_HOST:$APP_DIR ..."

rsync -avz --delete \
  --exclude node_modules \
  --exclude data \
  --exclude .env \
  --exclude .git \
  --exclude .deploy \
  --exclude .netlify \
  --exclude .wa \
  --exclude requests \
  --exclude '._*' \
  --exclude .DS_Store \
  -e "$RSYNC_SSH" \
  ./ "$EC2_USER@$EC2_HOST:$APP_DIR/"

$RSYNC_SSH "$EC2_USER@$EC2_HOST" "
  set -e
  cd '$APP_DIR'
  chmod 644 index.html admin.html sidhpur-map.jpg _redirects 2>/dev/null || true
  chmod 755 images 2>/dev/null || true
  chmod 644 images/*.jpg 2>/dev/null || true
  rm -f images/._* 2>/dev/null || true
  mkdir -p data/registrations
  (cd server && npm install --omit=dev)
  if [ -f .env ]; then set -a; . ./.env; set +a; fi
  pm2 reload ecosystem.config.js --update-env --env production || pm2 start ecosystem.config.js --env production
  pm2 save
  echo 'Deployed at '\$(date)
"

echo "Live: https://theimpactfestival.com"
