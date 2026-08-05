# Total Health Tier 2 Secondary Consult prototype

Static, no-PHI prototype of a patient-facing landing page and six-step secondary-consult flow.

## Run locally

From this directory:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`.

## Privacy boundary

- No analytics, trackers, cookies, accounts, network form submissions, file uploads, database, local storage, or external JavaScript.
- Interactive choices remain only in page memory and clear on refresh.
- The prototype is not approved for patient data or clinical use.

## Deployment

The folder is compatible with static hosting and Vercel. `vercel.json` adds basic browser-hardening headers. A production clinical application requires a separately reviewed architecture, identity, consent, PHI controls, BAAs, audit logging, retention, incident response, and state-specific clinical coverage.
