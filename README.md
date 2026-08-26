# Impact Festival 2026 — event website

Live: https://theimpactfestival.com (also https://impact-festival-sidhpur.netlify.app)

- **Event:** Dec 24–29, 2026 (tentative), Sidhpur, Gujarat, India
- **Contact on site:** Shahid Maknojia, (832) 606-8254
- **Cost:** $99/person — intentionally NOT shown on the site yet
- **GitHub:** https://github.com/azimmaknojia/impact-festival

## Editing
Everything is in `index.html` — one self-contained file (HTML + CSS + JS, no build step).
Open it in a browser to preview locally.

## Deploying
Pushes to `main` deploy via GitHub Actions (`.github/workflows/deploy.yml`).

Manual deploy:
    ./deploy.sh

Netlify project `impact-festival-sidhpur` (ID `ba643c7e-14a9-40af-bf6e-acc0a5a6ce0d`),
free tier, account `ali@financial-loop.com`.

## Go live at theimpactfestival.com

Custom domain is configured in Netlify. DNS still points to Squarespace until you update it.

### 1. Squarespace DNS (info@financial-loop.com)

Squarespace → Domains → **theimpactfestival.com** → DNS Settings

Remove existing Squarespace records:
- `@` A records → `198.49.23.145`, `198.49.23.144`, `198.185.159.145`, `198.185.159.144`
- `www` CNAME → `ext-sq.squarespace.com`

Add Netlify records:

| Host | Type  | Value                              |
|------|-------|------------------------------------|
| `@`  | A     | `75.2.60.5`                        |
| `www`| CNAME | `impact-festival-sidhpur.netlify.app` |

Propagation usually takes 15 minutes–48 hours. Netlify will auto-provision HTTPS once DNS resolves.

### 2. Enable deploys from GitHub

Pick one:

**Option A — Link repo in Netlify (recommended)**  
[Netlify deploy settings](https://app.netlify.com/projects/impact-festival-sidhpur/configuration/deploys) → Link repository → GitHub → `azimmaknojia/impact-festival` → branch `main`. Build settings are in `netlify.toml`.

**Option B — GitHub Actions token**  
Create a [Netlify personal access token](https://app.netlify.com/user/applications#personal-access-tokens), then add it as repo secret `NETLIFY_AUTH_TOKEN` at https://github.com/azimmaknojia/impact-festival/settings/secrets/actions

### 3. Verify

- https://theimpactfestival.com loads the festival site (not Squarespace)
- Netlify → Domain management → SSL certificate issued
- Registration form posts to `/api/register`

## Known TODO
- Sign-up and feedback forms have no backend; they open a prefilled WhatsApp/SMS
  message to Shahid. Needs a real form backend before collecting registrations or payment.
- Add real photos of Sidhpur / past events.
- Confirm final dates, then remove the "tentative" labels.
