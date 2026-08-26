# Impact Festival website — change log

Every applied change gets a line here: date, who asked, what changed, whether it went live.

| Date | Requested by | Change | Live |
|------|--------------|--------|------|
| 2026-08-18 | Azim | Initial site built and deployed | yes |
| 2026-08-21 | Azim | Village map added to hero + set as link-preview image | yes |
| 2026-08-21 | Azim | Contact changed to "Impact Festival Team — Shahid Maknojia" | yes |
| 2026-08-21 | Azim | Dates changed to Dec 24–27 (tentative), itinerary cut to 4 days | yes |
| 2026-08-21 | Azim | Group size >1 adds name/age rows; village is now a dropdown with Other | yes |
- 2026-08-21 | Shahid (approved by Azim) | Replaced 'Rudra Mahalaya & Bindu Sarovar' fact-list item with 'Historic Methan Jamatkhana' (using existing verified 1978 jamatkhana foundation fact) | LIVE yes
- 2026-08-21 | Shahid (approved by Azim) | Trimmed 'Our ancestral villages' line to end at 'surround Sidhpur.' (removed Methan/1978 tail) | LIVE yes
- 2026-08-21 | Shahid (approved by Azim, full country list) | Added registration BACKEND (Netlify Function + Blobs store) + 'Country of origin' dropdown (full world list) + renamed 'Send via WhatsApp' submit button to 'Register'. Data viewable at /.netlify/functions/registrations?token=REG_ADMIN_TOKEN (JSON, &format=csv, DELETE &key=). Kept 'Send via Text Message'. Verified end-to-end (POST 200, read-back, 401 guard, delete). | LIVE yes
- 2026-08-21 | Shahid (approved by Azim, option B) | Contact section: removed 'Shahid Maknojia' name, replaced (832) 606-8254 phone with mailto impactfestival26@gmail.com, removed WhatsApp/Send a Text/Call buttons. Same name+phone->email swap applied to footer, 'Who's organizing' FAQ, and sign-up form note. Sponsor/Financial-Aid buttons + SMS PHONE var left functional (unchanged). | LIVE yes
- 2026-08-22 | Shahid (approved by Azim) | HERO: festival map (sidhpur-map.jpg) now the full-bleed homepage background with dark navy overlay for legibility; removed the duplicate side map figure (hero now single-column). | LIVE yes
- 2026-08-22 | Shahid (approved by Azim) | WHY SIDHPUR: added 4-photo grid (Bohra Vad heritage streets, Methan Jamatkhana, Rani ki Vav Patan, AKDN at work in Gujarat) in new images/ folder; deploy.sh now publishes images/. | LIVE yes
- 2026-08-22 | Shahid (approved by Azim) | REGISTRATION: removed 'Send via Text Message' button + its JS handler; added optional 'Do you need a visa to travel to India?' Yes/No dropdown (name=needs_visa, stored by backend + added to CSV export). Verified backend captures needs_visa. | LIVE yes
- 2026-08-22 | Shahid | HERO tweak: lightened map overlay to a left-to-right navy gradient (0.93->0.34) so the festival map stands out while keeping the original navy tone on the text side; added text-shadow on hero copy for legibility. Verified desktop + 375px. | LIVE yes
- 2026-08-23 | Shahid (approved by Azim) | HOMEPAGE REDESIGN: new hero = festival poster (images/festival-poster.jpg) as navy-framed tile on LEFT, title+subtitle+meta+CTAs on RIGHT; hero background changed to warm map-paper cream (#f0e4c6) with dark readable text (red eyebrow). VIBRANCY: festival palette vars (blue/red/green/orange/teal) applied to eyebrows, mission bar gradient, and rotating accent borders on pillar cards, fact-list, experience cards. Verified desktop + 375px. Previewed on draft, approved. | LIVE yes
- 2026-08-23 | Shahid (approved by Azim) | VIBRANCY pt2: itinerary .day cards get rotating festival top borders (blue/green/red/orange); both form cards (signup+feedback) get a festival gradient top stripe. Previewed on draft, approved, verified via live DOM computed styles. | LIVE yes
- 2026-08-23 | OPS NOTE | Netlify free-plan '--prod' publishes can return 'JSONHTTPError: Forbidden' after many rapid deploys in a day, while DRAFT deploys still succeed. Workaround: run a draft deploy (netlify deploy --dir=.deploy --functions=netlify/functions), then promote it to production via API: netlify api restoreSiteDeploy --data '{"site_id":"ba643c7e-14a9-40af-bf6e-acc0a5a6ce0d","deploy_id":"<draft id>"}'. Draft includes functions, so the backend stays intact.
