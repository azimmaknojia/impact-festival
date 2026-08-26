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

## Known TODO
- Sign-up and feedback forms have no backend; they open a prefilled WhatsApp/SMS
  message to Shahid. Needs a real form backend before collecting registrations or payment.
- Add real photos of Sidhpur / past events.
- Confirm final dates, then remove the "tentative" labels.
