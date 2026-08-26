#!/bin/bash
# Deploy the Impact Festival site to https://theimpactfestival.com
# Static source stays as ./index.html (single self-contained file).
# We assemble a clean ./.deploy publish dir so node_modules / source files are
# NOT uploaded as static assets, and bundle the serverless functions.
# Usage: ./deploy.sh
cd "$(dirname "$0")" || exit 1

rm -rf .deploy && mkdir .deploy
cp index.html sidhpur-map.jpg _redirects .deploy/ 2>/dev/null
cp -r images .deploy/images 2>/dev/null

npx --yes netlify-cli@latest deploy --prod \
  --dir=.deploy \
  --functions=netlify/functions \
  --site=ba643c7e-14a9-40af-bf6e-acc0a5a6ce0d
