# NETWORK_DEPENDENCY_MAP.md

Every external endpoint the upstream **Anarlog** desktop app can contact, at commit `08aad83`. Read-only analysis; paths are upstream-relative.

**PHI legend:** 🔴 audio/transcripts/notes/titles/participant identities can transit · 🟡 identifiers/metadata that may be re-identifying · ⚪ neither.
**Trigger legend:** **AUTO** = fires without user action (often on launch) · **USER** = requires an explicit user action · **OPT-IN** = requires a feature to be enabled first, then may become AUTO.

---

## 1. Configuration spine

Every vendor host is driven by four build-time variables, baked in at compile/bundle time (`.github/workflows/desktop_cd.yaml`):

| Var | Release value | Read at |
|---|---|---|
| `VITE_API_URL` | `https://api.anarlog.so` | `apps/desktop/src/env.ts:8`; `plugins/calendar/src/lib.rs:51-62` (Rust `env!`, required in release) |
| `VITE_APP_URL` | `https://anarlog.so` | `apps/desktop/src/env.ts:7` |
| `VITE_SUPABASE_URL` / `_ANON_KEY` | a `*.supabase.co` project | `apps/desktop/src/auth/client.ts:47-61`; `plugins/attachment-sync/src/lib.rs:14-28` |
| `POSTHOG_API_KEY` | GitHub secret, `assert!` `phc_*` in release | `plugins/analytics/src/lib.rs:55-65` — **mandatory at compile time for official releases** |

`SENTRY_DSN` is likewise baked in via `option_env!` (`apps/desktop/src-tauri/src/lib.rs:84`). The Tauri HTTP scope is effectively unrestricted (`https://**`, `http://**`) with **no CSP** — so the webview itself can reach any host, independent of this table.

## 2. What auto-starts network on launch (no user action)

Ordered earliest-first. This is the list that matters most for "no telemetry / no cloud dependency" goals:

1. **Sentry (Rust + minidump upload)** — `apps/desktop/src-tauri/src/lib.rs:83-125`, before the Tauri builder; `traces_sample_rate: 1.0`.
2. **Sentry (JS + Session Replay)** — `apps/desktop/src/main.tsx:82` → `error-reporting.ts:124`, at module load; `replaysSessionSampleRate: 0.1` (10% of all sessions), `replaysOnErrorSampleRate: 1.0`.
3. **PostHog `app_started`** (+ `app_first_opened` on first run) — `apps/desktop/src/main.tsx:110-119`.
4. **Updater check** → `desktop2.hyprnote.com`, then a 30-minute loop; auto-installs cached updates and relaunches — `plugins/updater2/src/lib.rs:52-63` (defaults enabled).
5. **Supabase session load + auto-refresh** → `*.supabase.co/auth/v1/token`, on launch, every ~30 s tick, and on every window focus — `apps/desktop/src/auth/context.tsx:567-628`.
6. **PostHog `identify`** on cold start for any signed-in user, sending **email + plan + OS** — `apps/desktop/src/auth/context.tsx:106-163`.
7. **CloudSync credential exchange** → `api.anarlog.so/sync/token`, then SQLite Cloud every ~30 s (signed-in + paid + sync on) — `apps/desktop/src/auth/cloudsync.ts:1306`; `apps/desktop/src-tauri/src/db.rs:6`.
8. **Attachment transfer runner** (same gating) — `apps/desktop/src/attachment-sync/lifecycle.tsx:50-63`.
9. **Cloud API backfill** if previously enabled — can upload **every** local meeting — `apps/desktop/src/cloud-api/client.ts:322-334`.
10. **Calendar `list_connection_ids`** → `api.anarlog.so/nango/connections` whenever calendar UI state is queried and a token exists — `crates/calendar/src/lib.rs:68-100`.
11. **`local-api` autostart** (loopback, only if previously enabled) — `plugins/local-api/src/lib.rs:63-97`.
12. **`plugins/relay`** binds `127.0.0.1:1423` unconditionally in debug/devtools builds — `apps/desktop/src-tauri/src/lib.rs:236-240`.

**Not auto-started:** model downloads (USER), local LLM server (behind `if false`), feature-flag fetch (`Feature::Chat` is hardcoded, so PostHog flags are never queried), changelog (only when the tab opens).

**HIPAA-first consequence:** items 1–4 fire *before sign-in and before any user gesture*, sending crash/replay/analytics/version data to three third parties (Sentry, PostHog, the updater host). Items 5–10 are gated on auth but still represent standing vendor connections. All of 1–3 and 9 must be removed or made build-time-absent; 4 must be repointed to an org-controlled feed; 5–10 must be repointed to org infrastructure or disabled for PHI.

## 3. Authentication flow (network view)

- Desktop opens `https://anarlog.so/auth?flow=desktop&scheme=<anarlog|…>` in the **system browser** (`apps/desktop/src/auth/context.tsx:709-727`).
- Web app runs Supabase auth — **Google or GitHub OAuth**, or magic link (`apps/web/src/functions/auth.ts:192-238`).
- Returns `<scheme>://auth/callback?access_token=…&refresh_token=…` — **tokens in a URL query string** (`apps/web/src/lib/desktop-auth-handoff.ts:7-21`), ingested via `plugins/deeplink2` (or a loopback `127.0.0.1:0` fallback used only by the onboarding demo).
- Refresh is JS-side via supabase-js (`autoRefreshToken:true`); a native Rust refresh client exists but is **dead code** (feature not enabled). No client-side JWT signature verification.
- **Sign-in is optional**; local STT + local LLM work offline. But onboarding auto-starts a trial that flips STT/LLM to cloud.

Entitlements ride in the Supabase JWT (`hyprnote_pro`, `hyprnote_lite`, plus `trialing`), joined from Stripe via a Postgres auth hook. Gated behind auth **and** subscription: Anarlog Cloud STT/LLM, CloudSync, attachment backup, share links, web search, pyannote proxy, Cloud API.

## 4. Third-party OAuth via Nango — tokens held server-side

`crates/nango` targets `https://api.nango.dev` and runs **only inside `apps/api`** (the desktop has no Nango dependency). Brokered: Google Calendar, Google Drive, Google Mail, Outlook, GitHub, Linear, Slack, Discord (`crates/api-nango/src/integrations.rs`).

**Token custody is 100% server-side.** The desktop opens `anarlog.so/app/integration?...` in the browser; the web app mints a Nango Connect session; Nango completes OAuth and **holds the credentials**. The desktop only ever receives an opaque `connection_id`. Net effect: **the vendor cloud (and Nango) can read the user's entire Google Calendar / Outlook / GitHub / Linear on their behalf, indefinitely, without the desktop running.** This is directly incompatible with "Google OAuth per user" under org control and must be replaced (see `REFACTOR_PLAN.md`).

## 5. Telemetry & crash reporting

| System | Host | Default | Opt-out | PHI |
|---|---|---|---|---|
| **PostHog** (product analytics, Rust-side) | `us.i.posthog.com` | **ON**; `POSTHOG_API_KEY` mandatory in release | Settings toggle (`telemetry_consent`), PostHog only | 🟡 `identify` sends **email + Supabase user id + plan + OS**; `distinct_id` = machine fingerprint; ~78 event call sites (metadata/enums, no transcript text found). The opt-out act itself emits a `settings_changed` event. |
| **Sentry** (Rust) | `*.ingest.sentry.io` (DSN is a build secret) | **ON**; `traces_sample_rate:1.0`; **minidump upload** | none exposed | 🟡 sanitized stacks + tags incl. `enduser.id`/`enduser.pseudo.id`. Redaction strips `$HOME`, emails, IPv4. |
| **Sentry** (JS) | same | **ON**; **Session Replay 10%/100%-on-error** | none exposed | 🟡 masked-text/blocked-media DOM+interaction recordings of the app UI. |
| **OTLP/Honeycomb** | `api.honeycomb.io` | **API-side only** — desktop has no OTEL dep | n/a | ⚪ (desktop injects `x-request-id`/`x-device-fingerprint` headers the API records) |
| **openstatus** | probes → public hosts | external synthetic monitoring, not desktop code | n/a | ⚪ |

The single Settings toggle reaches **PostHog only**; **Sentry (including session replay and minidumps) has no user-facing opt-out**. For HIPAA-first, all three must be compiled out — "no telemetry, no analytics."

## 6. Updater

- **stable** feed: `https://desktop2.hyprnote.com/update/{{target}}-{{arch}}-{{bundle_type}}/{{current_version}}?channel=stable` (`tauri.conf.stable.json:19-24`) — still on the **legacy `hyprnote.com`** domain.
- staging/dev: `active:false`.
- **Signature verification is mandatory and sound** — minisign/ed25519 pubkey embedded (`tauri.conf.json:104`), verified before install (`crates/updater-core/src/lib.rs:270,342-348`), re-verified in CI. This is a domain-hygiene and passive-fingerprinting concern (unauthenticated GET within seconds of launch, every 30 min), not a code-execution one. Must be repointed to an org-controlled, MDM-distributed feed.

## 7. Other desktop network paths

| Component | Bind / target | Auth | Default | PHI |
|---|---|---|---|---|
| `plugins/local-api` | `127.0.0.1:33443` | Bearer, SHA-hashed key | **disabled** | 🔴 serves `/meetings`, `/transcript`, `/export` over loopback |
| local-api webhooks | arbitrary user URL | HMAC-SHA256 | off unless enabled | 🔴 full export + concatenated `transcript_text` to any host |
| `plugins/relay` | `127.0.0.1:1423` WS | **NONE** | debug/devtools builds only (**incl. staging `--features devtools`**) | full Tauri IPC bridge — any local page can `invoke` any command |
| `plugins/deeplink2` callback | `127.0.0.1:0` ephemeral | none, single-use, 600 s TTL | on demand | ⚪ |
| `crates/local-stt-server` | `127.0.0.1:0` ephemeral | **none**, `CORS Any` | local inference (behind disabled `whisper-cpp` feature) | 🔴 accepts audio |
| `plugins/hooks` | arbitrary | — | user-configured | spawns arbitrary commands → arbitrary network |
| `plugins/js` | arbitrary | — | user templates | `eval` in QuickJS |
| `plugins/{mcp,webhook,messenger,network}` | — | — | not registered / stub | ⚪ |
| chrome-native-host | NativeMessaging | Chrome manifest | **not bundled** with desktop | — |

## 8. Consolidated endpoint table

### 8.1 First-party (Anarlog-controlled)

| Host / endpoint | Purpose | Trigger | PHI |
|---|---|---|---|
| `desktop2.hyprnote.com/update/…` | Update feed | **AUTO** launch + 30 min | ⚪ (leaks version/arch/IP) |
| `api.anarlog.so/listen`, `/stt/*` | Hosted STT (stream + batch) | USER record, when provider=anarlog | 🔴 raw audio |
| `api.anarlog.so/chat/completions`, `/llm/*` | Hosted LLM (→ OpenRouter → Claude) | USER summarize/chat/enhance | 🔴 transcripts + notes + participants |
| `api.anarlog.so/sync/token`, `/sync/e2ee/witness/*`, `/sync/attachment-backups/*` | CloudSync/attachment plumbing | **AUTO** (paid + sync) | 🟡 (ciphertext + metadata) |
| `api.anarlog.so/sync/shares/{id}/snapshot` | Publish share | USER share | 🔴 **plaintext** title + note body |
| `api.anarlog.so/shared-notes/*` | Read/claim shares | USER | 🔴 (inbound) |
| `api.anarlog.so/v1/sync-snapshots/{id}`, `/v1/meetings/*`, `/mcp` | **Cloud API** server-readable copy | OPT-IN → AUTO + backfill all history | 🔴 **plaintext** full meeting content |
| `api.anarlog.so/v1/cloud-api/{keys,settings}` | Cloud API key mgmt | USER | ⚪ |
| `api.anarlog.so/calendar/{google,outlook}/*` | Calendar read via Nango | AUTO refresh / USER | 🔴 event titles, attendees, links |
| `api.anarlog.so/ticket/{github,linear}/*` | Ticket lists | USER | 🟡 |
| `api.anarlog.so/nango/{connections,session}` | Integration state / connect | **AUTO** (connections) / USER | 🟡 |
| `api.anarlog.so/research/search` | Web-search tool | USER (paid) | 🔴 search query |
| `api.anarlog.so/subscription/*` | Billing RPC | AUTO (`can-start-trial`) / USER | ⚪ |
| `anarlog.so/auth`, `/app/{checkout,portal,integration}`, `/share/*` | Browser handoffs | USER | ⚪ / 🔴 (share) |
| `docs.anarlog.so`, `anarlog.so/discord` | Help / community | USER | ⚪ |

### 8.2 Vendor-operated third parties (contacted directly by the device)

| Host | Purpose | Trigger | PHI |
|---|---|---|---|
| `<project>.supabase.co/auth/v1/*` | Supabase auth / refresh | **AUTO** launch + 30 s + focus | 🟡 tokens |
| `<project>.supabase.co/rest/v1/rpc/*` | Share management RPCs | USER | 🟡 |
| `<project>.supabase.co/storage/v1/object/sign/*` | Attachment up/download | AUTO/USER | 🔴 (encrypted for backups) |
| `*.sqlite.cloud` | CloudSync replication | **AUTO** every 30 s | 🔴 (E2EE ciphertext) |
| `us.i.posthog.com` | Analytics | **AUTO** launch | 🟡 email + fingerprint + plan + OS |
| `*.ingest.sentry.io` | Errors, traces, minidumps, replay | **AUTO** process start | 🟡 stacks + replays |
| `hyprnote.s3.us-east-1.amazonaws.com`, `storage2.hyprnote.com` | Local model downloads | **USER** | ⚪ |
| `raw.githubusercontent.com/fastrepl/char/…` | Changelog | USER | ⚪ |
| `gravatar.com/avatar/<sha256(email)>` | Account avatar | AUTO (signed in) | 🟡 SHA-256 of email |
| `api.nango.dev` | OAuth broker | **server-side only** — desktop never contacts it | — |

### 8.3 Third-party AI providers (direct from device, BYO key) — all 🔴

Selected in Settings → Transcription / Intelligence; traffic goes device → provider, bypassing the vendor cloud.

- **STT:** `api.deepgram.com` · `api.assemblyai.com` · `api.soniox.com` · `api.fireworks.ai` · `api.openai.com` · `api.gladia.io` · `api.elevenlabs.io` · `dashscope-intl.aliyuncs.com` · `api.mistral.ai` · `api.pyannote.ai` · `api.cohere.com` · AWS Transcribe · Azure Speech · `speech.googleapis.com` · `api.groq.com` · `api.rev.ai` · Speechmatics · `api.together.xyz` · `api.x.ai` · `api.cartesia.ai` · `api.aquavoice.com` · custom.
- **LLM:** `openrouter.ai` · `api.openai.com` · `api.anthropic.com` (with `anthropic-dangerous-direct-browser-access:true`) · Cohere · `api.groq.com` · `api.x.ai` · `api.together.xyz` · `api.fireworks.ai` · `api.cerebras.ai` · `api.mistral.ai` · `generativelanguage.googleapis.com` · Bedrock · Vertex AI · Cloudflare Workers AI · Azure OpenAI/AI · custom.
- **Local/loopback (🟢):** LM Studio `127.0.0.1:1234`, Ollama `127.0.0.1:11434`, Apple Foundation Models (on-device), embedded STT servers on ephemeral loopback ports.

### 8.4 Vendor-cloud upstreams (where `api.anarlog.so` forwards your PHI)

LLM → OpenRouter (→ Anthropic). STT → Deepgram (default), Soniox, AssemblyAI, Gladia, ElevenLabs, Fireworks, OpenAI, Mistral, DashScope, Cartesia, AquaVoice, Cohere. Diarization → pyannote.ai. Research → Exa + Jina. Email → Loops.so. Sync → SQLite Cloud. Traces → Honeycomb. Billing → Stripe.

## 9. Implications for the HIPAA-first target

The target permits Google Workspace as the durable record, Google OAuth per user, and Google Cloud only for org-managed services (voice directory, policy). Against that bar:

- **Must be removed / compiled out:** PostHog, Sentry (both clients, replay, minidumps), the `api.anarlog.so` STT and LLM proxies for PHI, Cloud API & Connectors, share snapshots, CloudSync/attachment-backup to vendor infrastructure, the vendor updater domain, Gravatar, and all direct third-party STT/LLM providers for clinical content.
- **Must be repointed to org control:** authentication (Google OAuth per user, org IdP), calendar (Google directly under org OAuth, not Nango server-side custody), model downloads (MDM-distributed or org mirror), and the updater feed.
- **May be retained for nonclinical workflows only, under administrator policy:** cloud AI (explicitly nonclinical), behind a hard, default-off, policy-gated switch that never applies to PHI-tagged sessions.
- **Keep (local, no egress):** on-device STT/LLM, Apple Calendar (EventKit), loopback inference servers — with the unauthenticated ones (`local-stt-server`, `relay`) hardened or removed.

The per-endpoint disposition, with security impact / engineering tradeoff / migration risk, is in `REFACTOR_PLAN.md`.
