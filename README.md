# Impact Festival 2026 — event website

Live: https://theimpactfestival.com

- **Event:** Dec 24–27, 2026 (tentative), Sidhpur, Gujarat, India
- **Contact on site:** Shahid Maknojia, (832) 606-8254
- **GitHub:** https://github.com/azimmaknojia/impact-festival

## Hosting (AWS)

Static site + small Node API on **stealthtanks-web** EC2 (`32.193.181.198`, profile `stealthtanks`).

| Piece | Path / port |
|-------|-------------|
| Static files | `/var/www/impact-festival/` (nginx root) |
| Registration API | `server/index.js` on `127.0.0.1:3002`, proxied at `/api/register` |
| Registrations storage | `/var/www/impact-festival/data/registrations/*.json` |
| Process manager | PM2 (`ecosystem.config.js`) |
| TLS | Let's Encrypt via certbot |

## Editing

Everything visible is in `index.html` (HTML + CSS + JS, no build step). Open locally in a browser to preview.

## Deploy

**Automatic:** push to `main` — GitHub Actions rsyncs to EC2 (needs `EC2_SSH_KEY` secret).

**Manual:**
```bash
SSH_KEY=~/.ssh/stealthtanks-key ./deploy.sh
```

## First-time server setup

On `stealthtanks-web` as root (once):

```bash
sudo bash /var/www/impact-festival/deploy/ec2-bootstrap.sh
```

After DNS points to the server:

```bash
sudo bash /var/www/impact-festival/deploy/ssl-setup.sh
```

Create `/var/www/impact-festival/.env` on the server (not in git):

```
REG_ADMIN_TOKEN=your-secret-token-here
```

Restart: `pm2 reload ecosystem.config.js --env production`

## Admin: export registrations

```
https://theimpactfestival.com/api/registrations?token=YOUR_TOKEN
https://theimpactfestival.com/api/registrations?token=YOUR_TOKEN&format=csv
```

## DNS (Squarespace)

Domain **theimpactfestival.com** is in Squarespace (info@financial-loop.com).

Remove Squarespace parking records, then add:

| Host | Type | Value |
|------|------|-------|
| `@` | **A** | `32.193.181.198` |
| `www` | **CNAME** | `theimpactfestival.com` |

Allow 15 min–48 hr for propagation, then run `deploy/ssl-setup.sh` if SSL is not yet active.

## Security group

Ensure `stealthtanks-sg` allows inbound **80** and **443** from `0.0.0.0/0` (likely already open for stealthtanks.com).
