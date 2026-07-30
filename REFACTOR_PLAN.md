# REFACTOR_PLAN.md

Component-by-component plan to transform upstream **Anarlog** (commit `08aad83`) into a HIPAA-first, local-first meeting-intelligence app. Read-only analysis; **no code has been changed.** Paths are upstream-relative.

**This is a plan awaiting approval, not an implementation.** Per the task, every non-trivial decision below states its **security impact**, **engineering tradeoff**, and **migration risk**. Nothing here is executed until you approve.

---

## 1. Target architecture (the bar every decision is measured against)

- **Desktop:** Tauri + Rust core, React UI, native macOS modules where required.
- **Security boundary:** **Rust owns all sensitive operations.** Audio, transcripts, summaries, embeddings, OAuth tokens, and provider keys are **never directly accessible from React**.
- **Processing:** local-first; **no vendor cloud dependency for PHI**.
- **Durable record system:** **Google Workspace** (per-user Google OAuth, org-managed).
- **Org cloud:** **Google Cloud only for org-managed services** (voice directory, policy infrastructure) — never PHI content.
- **AI:** local-first, **administrator-approved models only**; **cloud AI only for explicitly nonclinical workflows**, default-off, policy-gated, never applied to PHI-tagged sessions.
- **Deployment:** small internal team, company-managed MDM-enforced Apple Silicon Macs, **nonclinical pilot first**.
- **Hard constraints during development:** no external upload, no telemetry, no analytics, no new cloud dependencies, **no real PHI, no real recordings** (use synthetic fixtures — `crates/audio-mock` already provides file-backed fake capture via `MOCK_AUDIO=1`).

## 2. Classification legend

- **KEEP** — retained with minimal change; already fits the target.
- **REFACTOR** — reused but requires architectural modification.
- **REPLACE** — removed and rebuilt (behavior kept, implementation swapped).
- **DELETE** — should not exist in the HIPAA-first version.

Decisions cross-reference the gap IDs (G1–G18) in `SECURITY_GAP_ANALYSIS.md`.

## 3. Guiding principles (decision order when components conflict)

1. **PHI never leaves the device except to Google Workspace under org OAuth.** This overrides convenience and existing features.
2. **Rust is the only holder of plaintext PHI and secrets.** The renderer gets rendered views and typed, minimal data — never keys, tokens, raw audio, or a SQL socket.
3. **Default-deny for network and AI.** Local by default; cloud is an explicit, policy-gated, nonclinical exception.
4. **Prefer subtraction.** The fastest path to auditability is removing surface, not adding controls on top of it.
5. **MDM is a compensating control, not a primary one.** FileVault/MDM assumed, but the app must be safe without them.

---

## 4. Component decisions

### 4.1 Desktop shell & framework

| Component | Disposition |
|---|---|
| Tauri 2.10 + Rust host (`apps/desktop/src-tauri`) | **KEEP** |
| React 19 + TanStack + Zustand + Tailwind + ProseMirror UI | **KEEP** |
| `tauri-specta` typed command/event generation | **KEEP** |
| Native macOS modules (`crates/mac,tcc,intercept,apple-calendar,detect`; `plugins/windows,permissions,local-llm`) | **KEEP** (see 4.7) |
| `withGlobalTauri: true`, no CSP, asset scope `**/*` (`tauri.conf.json`) | **REFACTOR** (G4) |
| Single capability `"windows":["*"]` (`capabilities/default.json`) | **REFACTOR** → per-window capabilities (G3) |
| `build.minify:false` in release (`vite.config.ts`) | **REFACTOR** (G15) |
| `plugins/relay` dev IPC bridge; `--features devtools` on staging | **REFACTOR** → never build outside pure dev (G9) |

**KEEP — Tauri + React + native modules.** *Security impact:* Tauri's Rust/webview split is exactly the boundary the target wants; keeping it is what makes "Rust owns sensitive operations" achievable. *Engineering tradeoff:* the framework is fine; the work is in how it's *configured*, not in replacing it. *Migration risk:* low — no framework change.

**REFACTOR — CSP + capability tightening.** *Security impact:* adds the containment that currently doesn't exist (G3/G4); the highest-leverage hardening in the project. *Engineering tradeoff:* a strict CSP + per-window capabilities will break features that assume ambient access (asset-protocol file reads, arbitrary `fetch`); each must be re-plumbed through a typed Rust command. Expect iterative CSP tuning against real feature use. *Migration risk:* medium — behavioral regressions in file/attachment loading and any component doing direct HTTP; mitigated by doing it feature-by-feature behind tests.

### 4.2 The trust boundary & renderer privileges (the central refactor)

| Component | Disposition |
|---|---|
| `plugin:db|execute` / `execute_proxy` from renderer (`plugins/db`) | **REFACTOR** → remove raw SQL from renderer; typed query API (G3) |
| Frontend hand-written SQL (53 files) + Drizzle sqlite-proxy (`packages/db*`) | **REFACTOR** → move queries behind Rust-owned, parameterized commands |
| `plugins/store2` secret access from renderer | **REFACTOR** → all secrets native-only (G11) |
| `plugins/auth` `get_item`/`set_item` to renderer | **REFACTOR** → session native-only (G2) |
| `plugins/js` (QuickJS `eval`) | **DELETE** (G3) |
| `plugins/hooks` (arbitrary process spawn) | **DELETE** for PHI build (G3) |
| `plugins/fs2` unscoped `write_text_file` | **REFACTOR** → route through `validate_path`; scope all fs ops (G3) |
| `plugins/opener2` unscoped open | **REFACTOR** → allowlist + extension filter (G3) |
| app-level `get_env` outside ACL (`apps/desktop/src-tauri/src/commands.rs:41`) | **REFACTOR** → remove or allowlist keys |
| `http:default` `https://**` + `unsafe-headers` | **REFACTOR** → host allowlist, drop `unsafe-headers` (G3) |

**REFACTOR — typed data API replacing renderer SQL.** *Security impact:* this is the core move that makes PHI "not reachable from React." Removing `execute`/`execute_proxy` means an XSS or malicious dependency can no longer read the whole DB or lift secrets. *Engineering tradeoff:* significant — 53 frontend files plus the Drizzle proxy currently assume arbitrary SQL. Each query becomes a named, parameterized Rust command (or a curated read-model). This is more code and more ceremony (the plugin ritual touches 4 files/2 languages per command) but is the price of the boundary. Live queries can be preserved via the existing `Channel<QueryEvent>` subscription over *typed* queries. *Migration risk:* high — the largest surface-area change; mitigated by (a) keeping the DB schema and Drizzle *types* as the shared contract, (b) generating typed accessors, (c) migrating read paths first (lower risk) then writes, (d) a compatibility shim period where a whitelisted read-only, `query_only` PRAGMA-enforced statement set is allowed while accessors are built.

**DELETE — `plugins/js`, `plugins/hooks`.** *Security impact:* removes an in-process `eval` and an arbitrary-process spawner from the renderer's reach — both are RCE-grade primitives with no place in a PHI build. *Engineering tradeoff:* any feature relying on user "hooks" or dynamic JS templates loses that extensibility; for an internal pilot this is acceptable and arguably desirable. *Migration risk:* low — verify no shipped feature depends on them (hooks appears user-configured; js has a single trivial test).

### 4.3 Storage & encryption at rest

| Component | Disposition |
|---|---|
| SQLite via `sqlx`, canonical model (`crates/db-app`, `db-core`) | **KEEP** (schema) / **REFACTOR** (open path) |
| Plaintext `app.db` | **REFACTOR** → SQLCipher / at-rest encryption (G1) |
| Tantivy `search_index/` plaintext, `STORED` full text | **REFACTOR** → encrypt or drop `STORED`; encrypt index dir (G1) |
| Audio files plaintext, retention `forever` | **REFACTOR** → encrypt at rest; PHI-appropriate default retention (G1/G12) |
| `auth.json` plaintext on macOS | **REPLACE** → macOS Keychain (G2) |
| Provider keys renderer-readable; webhook secrets plaintext | **REFACTOR** → native-only / sealed (G11) |
| Tombstone-only deletion, no purge | **REFACTOR** → real purge + secure-delete (G12) |
| `crates/cloudsync` closed `.dylib` + SQLite Cloud sync | **DELETE** for PHI build (G14) |
| `legacy/db-*` import of old Hyprnote vaults | **KEEP** if internal migration needed, else **DELETE** |

**REFACTOR — encrypt the local database.** *Security impact:* closes the single largest exposure (G1). Under an OS-Keychain-wrapped key held only by Rust, a stolen/imaged disk yields ciphertext. *Engineering tradeoff:* two viable routes — (a) **SQLCipher** (mature, transparent, requires swapping the SQLite build and `PRAGMA key` on open; but the vendored `cloudsync` extension assumes stock SQLite, and we're deleting it anyway, which frees this choice); or (b) **extend `crates/e2ee` field-sealing to the local rows** (reuses in-house crypto, but leaks queryability — you can't index/filter sealed columns without blind indexes, which the code already has primitives for). SQLCipher is the lower-friction default; field-sealing is better if selective disclosure is later needed. *Migration risk:* medium — a one-time re-encryption migration of existing local data; key-management edge cases (Keychain unavailability, key rotation). For a fresh internal pilot with no real PHI yet, migration risk is minimal because there's no legacy data to convert.

**REPLACE — token storage to Keychain.** *Security impact:* removes plaintext refresh/access tokens from disk on the primary platform (G2). *Engineering tradeoff:* small and self-contained — the code already uses `keyring` and native Keychain elsewhere (`plugins/store2`); this is extending that path to the session and removing the plaintext fallback. *Migration risk:* low — but the auth model is also changing (Google OAuth, 4.5), so do them together.

**DELETE — CloudSync + `cloudsync.dylib`.** *Security impact:* removes a closed binary from the trusted process and eliminates a vendor-cloud PHI replication path (G14). *Engineering tradeoff:* loses cross-device sync; the target replaces "durable record" with Google Workspace, so device-to-device CRDT is out of scope. If multi-device is later needed, it must be rebuilt on org infrastructure with auditable code. *Migration risk:* low for a single-device pilot; the DB open path must stop loading the extension (`crates/cloudsync/src/lib.rs:29-38`) and drop the `e2ee_records` replication assertion (`apps/desktop/src-tauri/src/db.rs:162-164`).

### 4.4 Audio capture pipeline

| Component | Disposition |
|---|---|
| `cpal` mic + macOS Core Audio system-audio tap (`crates/audio-actual`) | **KEEP** |
| Resample/join/AEC/VAD DSP (`resampler,aec,vad,vad-masking,audio-sync`) | **KEEP** |
| `crates/listener-core` orchestration; disk recorder | **KEEP** / **REFACTOR** (encrypt output) |
| `LISTENER_DEBUG` un-cleaned `audio_mic.wav`/`audio_spk.wav` | **REFACTOR** → remove from any non-dev build (G1) |
| `plugins/detect` meeting detection (mic-usage + Accessibility) | **KEEP** / review AX scope |
| `crates/agc`, `crates/segmentation`, `NormalizedSource`, `crates/vad-ext` (empty) | **DELETE** (dead code, G17) |

**KEEP — the capture + DSP pipeline.** *Security impact:* it is entirely on-device and never itself egresses; it's the local-first core the target wants. *Engineering tradeoff:* none to keep; the only change is encrypting the recorder's output and removing the debug WAV leak. *Migration risk:* low. *Note:* the macOS system-audio tap uses `kTCCServiceAudioCapture`, which MDM can pre-grant — good for managed deployment.

**REFACTOR — encrypt recorder output; kill debug WAVs.** *Security impact:* recorded audio is PHI; it must be encrypted at rest and the `LISTENER_DEBUG` per-source WAVs (`disk.rs:199-204`) must never exist outside a developer build. *Engineering tradeoff:* encrypting a streaming WAV writer adds a seal step on finalize (or streaming AEAD, which `crates/e2ee/src/blob.rs` already implements for attachments — reuse it). *Migration risk:* low.

### 4.5 Transcription (STT)

| Component | Disposition |
|---|---|
| On-device Soniqo/Parakeet CoreML (`crates/transcribe-soniqo`) | **KEEP** — make default |
| Apple SpeechAnalyzer (`crates/transcribe-speechanalyzer`) | **KEEP** — make default |
| `owhisper-client` provider abstraction | **REFACTOR** → restrict provider set by policy |
| Anarlog cloud STT proxy (`crates/transcribe-proxy`, `api.anarlog.so/stt`) | **REPLACE/DELETE** for PHI (G5) |
| Direct third-party cloud STT (Deepgram/Soniox/OpenAI/…) | **DELETE** for PHI; nonclinical-only if ever |
| `whisper.cpp` STT (compiled out), `local-stt-server` (unauth) | **DELETE** or **REFACTOR** if re-enabled (G9/G17) |
| `crates/am` Argmax sidecar (needs build-time `AM_API_KEY`) | **DELETE** for OSS/internal build |
| Default `anarlog/cloud` STT (`configure-paid-settings.ts`) | **REFACTOR** → local default (G5) |

**KEEP + make default — on-device STT.** *Security impact:* audio never leaves the device; this is the target's local-first STT. *Engineering tradeoff:* Soniqo/AppleSpeech are Apple-Silicon-only — perfect for the managed-Mac pilot, but the code must stop treating cloud as the fallback for unsupported hardware (there is no non-Apple hardware in scope, so this is simplifying, not limiting). *Migration risk:* low — invert the default in `configure-paid-settings.ts` and the provider sort.

**REPLACE/DELETE — cloud STT for PHI.** *Security impact:* removes the raw-audio egress path (G5). *Engineering tradeoff:* loses cloud STT's language breadth and zero-setup convenience; for the managed pilot, on-device Parakeet/AppleSpeech is sufficient. If a nonclinical cloud STT is ever wanted, it must be behind the same policy gate as cloud LLM (4.6). *Migration risk:* low — the routing already distinguishes local vs cloud (`apps/desktop/src/stt/useSTTConnection.ts`); we remove the cloud branch for PHI-tagged sessions and delete the vendor proxy dependency.

### 4.6 Intelligence (LLM / summaries)

| Component | Disposition |
|---|---|
| Local LLM: LM Studio, Ollama, Apple Foundation Models (`plugins/local-llm`) | **KEEP** — make default |
| Template/summary engine (`crates/template-app`, `plugins/template`) | **KEEP** |
| Anarlog cloud LLM proxy (`crates/llm-proxy`, `api.anarlog.so/llm` → OpenRouter → Claude) | **REPLACE/DELETE** for PHI (G5) |
| Direct BYO-key cloud LLM (OpenAI/Anthropic/…) | **REFACTOR** → policy-gated, nonclinical-only, admin-approved models |
| Default `anarlog/Auto` LLM (`configure-paid-settings.ts`) | **REFACTOR** → local default (G5) |
| Administrator model approval / allowlist | **REPLACE** → build it (does not exist today) |

**KEEP + make default — local LLM.** *Security impact:* transcripts/notes never leave the device for summarization. *Engineering tradeoff:* local models (via LM Studio/Ollama/Apple Foundation) are lower-capability than Claude Sonnet; summary quality on-device is the accepted cost of local-first. Apple Foundation Models are fully on-device and MDM-friendly. *Migration risk:* low — invert the default; the provider plumbing already supports local.

**REPLACE — administrator model approval.** *Security impact:* the target requires "administrator-approved models only." Today model choice is free (no allowlist, no approval workflow — `SECURITY_GAP_ANALYSIS` notes the absence). This must be built: a Rust-owned, MDM-provisionable policy that constrains which STT/LLM providers+models are selectable, and which (if any) cloud AI is permitted, for which workflow class. *Engineering tradeoff:* new subsystem (policy schema, enforcement in the Rust routing layer, MDM config surface); worth it because it's the mechanism that makes "cloud AI only for nonclinical" enforceable rather than aspirational. *Migration risk:* medium — must be enforced in Rust (not the renderer) to be trustworthy; needs a clear PHI-vs-nonclinical session tag that the policy keys on.

**Cloud AI (nonclinical only).** *Security impact:* permitted *only* for sessions explicitly tagged nonclinical, default-off, enforced in Rust, never for PHI-tagged content. *Engineering tradeoff:* requires a reliable session classification and a hard interlock so a misconfiguration can't route PHI to cloud. *Migration risk:* medium — the interlock is safety-critical; fail-closed (treat unknown as PHI/local-only).

### 4.7 Native macOS modules — **KEEP** (with scope review)

`crates/mac,tcc,intercept,apple-calendar,apple-todo,apple-note,detect`; `plugins/windows,permissions,local-llm,store2` (Keychain), `shortcut-macos`. *Security impact:* these are on-device OS integrations with no egress; they enable local-first on the exact target hardware. *Engineering tradeoff:* keep as-is; review `crates/detect`'s Accessibility scope (it can read other apps' windows/chat) to ensure it's necessary and consented. `crates/screen-core` already exposes no JS commands — keep it that way. *Migration risk:* low.

### 4.8 Authentication & identity — **REPLACE**

| Component | Disposition |
|---|---|
| Supabase auth + Google/GitHub OAuth via browser handoff (`plugins/auth`, `crates/supabase-auth`, `apps/web`) | **REPLACE** → Google OAuth per user, org IdP (G2/G10) |
| Tokens in URL query string (handoff) | **DELETE** → loopback/PKCE only (G2) |
| Entitlement/subscription gating (Stripe JWT claims, `packages/pricing`) | **DELETE** for internal build |
| Native Rust refresh client (dead code) | **DELETE** (G17) or repurpose |

**REPLACE — Google OAuth per user.** *Security impact:* aligns identity with the org IdP and Google Workspace as the record system; removes Supabase and server-side token custody from the PHI path. *Engineering tradeoff:* a new auth implementation (Google OAuth with PKCE, loopback redirect, tokens in Keychain, native-only), replacing the Supabase/browser-handoff flow. The existing deep-link/loopback plumbing (`plugins/deeplink2`) is reusable. Subscription/billing gating is deleted (internal team). *Migration risk:* medium — auth is load-bearing; must land with token-in-Keychain (4.3) and before any cloud feature is enabled. Fail-closed if OAuth is unavailable (app works offline/local regardless).

### 4.9 Calendar & integrations — **REPLACE / DELETE**

| Component | Disposition |
|---|---|
| Apple Calendar (EventKit, `crates/apple-calendar`) | **KEEP** (on-device) |
| Google/Outlook calendar via Nango server-side (`crates/api-nango`, `crates/calendar` cloud path) | **REPLACE** → direct Google Calendar under org OAuth on-device (G10) |
| Ticket integrations (GitHub/Linear via Nango) | **DELETE** for PHI build |
| Nango broker (`crates/nango`, `api-nango`) | **DELETE** (server-side token custody) (G10) |

**REPLACE — calendar via org Google OAuth.** *Security impact:* removes vendor-held OAuth tokens and stops calendar context transiting the vendor cloud; keeps meeting context under org control. *Engineering tradeoff:* implement Google Calendar API calls on-device using the same org OAuth token as auth (4.8), instead of proxying through `api.anarlog.so`. Apple Calendar stays as the local option. *Migration risk:* low-medium — scoped, well-understood API; the risk is ensuring the token never reaches the renderer.

### 4.10 Sync, sharing, Cloud API — **DELETE for PHI**

| Component | Disposition |
|---|---|
| CloudSync (SQLite Cloud, E2EE) | **DELETE** (G14) |
| Attachment backup sync (Supabase Storage, E2EE) | **DELETE** for PHI; org storage if ever needed |
| Share links / snapshots (plaintext to vendor) | **DELETE** (G5) |
| Cloud API & Connectors (plaintext server-readable copies) | **DELETE** (G5) |
| Durable record | **REPLACE** → **Google Workspace** (export notes/summaries to Google Docs/Drive under org OAuth) |

**DELETE — all vendor sync/share; REPLACE durable record with Google Workspace.** *Security impact:* removes every vendor-cloud PHI path (readable and E2EE alike, since the target forbids vendor cloud for PHI). *Engineering tradeoff:* loses turnkey cross-device sync and web sharing; the target explicitly makes Google Workspace the record system, so persistence/sharing happens by exporting to org-controlled Google Docs/Drive (a new, bounded integration using the org OAuth token). *Migration risk:* medium — the Workspace export is new work and must be Rust-owned (token native-only, export content assembled in Rust). For the initial single-device pilot, local-only with manual Workspace export is a safe first milestone.

### 4.11 Telemetry, crash reporting, updater — **DELETE / REFACTOR**

| Component | Disposition |
|---|---|
| PostHog analytics (`plugins/analytics`, `crates/analytics`) | **DELETE** (compile-time absent) (G6) |
| Sentry Rust + JS, session replay, minidumps (`plugins/tracing`, `error-reporting.ts`) | **DELETE** (G6) |
| `crates/observability`, `otel/` (API-side) | **KEEP** (not in desktop) / irrelevant to desktop |
| Updater feed `desktop2.hyprnote.com` (`plugins/updater2`) | **REFACTOR** → org-controlled, MDM-distributed feed (keep minisign) |

**DELETE — analytics + crash reporting.** *Security impact:* satisfies "no telemetry, no analytics"; removes three third-party egress paths that fire before sign-in, and the mandatory `POSTHOG_API_KEY` build coupling. *Engineering tradeoff:* loses product analytics and crash diagnostics; for an internal pilot, local logging (redacted, on-device) is the substitute. The `POSTHOG_API_KEY` `assert!` must be removed so release builds don't require the key (`plugins/analytics/src/lib.rs:56-65`). *Migration risk:* low — remove the plugins from the builder and the JS init; verify no code path hard-depends on the analytics handle.

**REFACTOR — updater to org control.** *Security impact:* removes the legacy `hyprnote.com` domain and passive fingerprinting; keeps the sound minisign verification. *Engineering tradeoff:* stand up an org-controlled update feed (or distribute via MDM and disable in-app updates entirely — simplest for managed Macs). *Migration risk:* low — repoint an endpoint; consider disabling the auto-check and letting MDM push updates.

### 4.12 Localhost servers & IPC extras

| Component | Disposition |
|---|---|
| `plugins/local-api` (loopback, authenticated) | **REFACTOR** → default-off, review PHI exposure; keep auth pattern |
| local-api webhooks (full transcript to arbitrary URL) | **DELETE** for PHI (G5) |
| `plugins/relay` (unauth full-IPC WS) | **REFACTOR** → dev-only, never in staging/release (G9) |
| `crates/local-stt-server` (unauth, CORS Any) | **DELETE**/`REFACTOR` (only if whisper.cpp re-enabled) (G9) |
| `plugins/{mcp,webhook,messenger,network}` (stubs/unregistered) | **DELETE** (G17) |
| `plugins/deeplink2` loopback callback | **KEEP** (single-use, TTL) — reuse for OAuth PKCE |

### 4.13 Dependencies, build, supply chain

| Component | Disposition |
|---|---|
| `sqlx 0.9.0-alpha.1`, `ort 2.0.0-rc.10` (pre-release) | **REFACTOR** → pin to stable (G13) |
| Triple `rustls` + `axum 0.6`/`hyper 0.14` | **REFACTOR** → consolidate (G13) |
| Git forks (`async-openai`, `whisper-rs`, `pyannote-rs`, `swift-rs`); `tauri-nspanel` branch | **REFACTOR** → pin/vendor by rev (G13) |
| Model integrity CRC32 / none | **REFACTOR** → mandatory SHA-256, org mirror (G7) |
| `sidecar2` symlink-launch fallback | **REFACTOR/DELETE** (G7) |
| `allow-unsigned-executable-memory` entitlement | **REFACTOR** → drop if possible; evaluate App Sandbox (G8) |
| Infisical/GitHub-Actions secret injection | **REFACTOR** → org secret management; remove PostHog/Sentry keys |
| `curl | sudo bash` installers (CI/dev) | **REFACTOR** → pinned, checksummed |

### 4.14 Dead code & identity hygiene — **DELETE / REFACTOR**

- **DELETE:** `go.mod`/`go.sum` (no Go); `crates/memory,segmentation,embedding,vad-ext(empty)`; orphaned `crates/api-bot,api-messenger,api-storage,api-claw,porkbun,recall,exedev`; `examples/plugins` + `packages/plugin-sdk` (dead third-party-JS loader); compiled-out `whisper*`/`local-stt-server`/`transcribe-whisper-local`/`pyannote-local` if STT stays on Soniqo/AppleSpeech; the `if false { local_llm().start_server() }` stub. *Security impact:* shrinks the auditable surface (G17). *Engineering tradeoff:* one-time pruning; must confirm no hidden feature use. *Migration risk:* low with a compile+test gate.
- **REFACTOR — identity:** settle bundle id, keychain service, updater feed, and deep-link schemes on a single org identity (G16). *Migration risk:* keychain service rename needs a one-time migration for any existing secrets (the code already remaps `com.hyprnote.*`→`com.anarlog.*`, a pattern to follow).

### 4.15 Embeddings / semantic memory (greenfield)

There is **no text-embedding/vector/RAG pipeline today** (`crates/memory` is a stub; `crates/embedding` is speaker-audio; Tantivy is BM25). *Disposition:* **REPLACE (build new) only if needed**, and if built: Rust-owned, on-device, using an administrator-approved local embedding model; embeddings encrypted at rest like all other PHI; **never** a cloud embedding API for PHI. *Security impact:* prevents a future feature from quietly reintroducing PHI egress. *Engineering tradeoff:* defer unless a semantic-search requirement is confirmed; Tantivy full-text (encrypted) may suffice for the pilot. *Migration risk:* n/a (new).

---

## 5. Phased implementation plan

Ordered so that **no PHI can be introduced until the device is safe for it**. The nonclinical pilot can begin after Phase 2; PHI only after Phase 4 is verified.

**Phase 0 — Fork, rebrand, prune, baseline.**
Fork upstream; settle org identity (4.14); DELETE dead code and vendor-cloud crates not needed for local operation; remove `POSTHOG_API_KEY` build requirement; establish synthetic audio/transcript fixtures (`MOCK_AUDIO=1`, no real recordings). *Exit:* builds and runs local-only with analytics/Sentry compiled out.

**Phase 1 — Sever PHI egress; invert defaults.**
DELETE PostHog + Sentry (4.11); DELETE CloudSync/share/Cloud API + `cloudsync.dylib` (4.3/4.10); REPLACE/DELETE cloud STT/LLM proxies for PHI and invert defaults to local (4.5/4.6); repoint/disable the updater (4.11). *Exit:* a clean network capture on launch and during a mock meeting shows **zero external egress** except (later) org Google endpoints.

**Phase 2 — Move the trust boundary.**
REFACTOR: add CSP, narrow asset/http scopes, per-window capabilities (4.1); remove renderer SQL in favor of typed Rust query commands; make secrets/tokens native-only; DELETE `plugins/js`/`hooks`; scope `fs2`/`opener2` (4.2). *Exit:* the renderer cannot read the DB, secrets, tokens, or raw audio directly; verified by tests that assert the removed commands are unreachable. **Nonclinical pilot can begin here.**

**Phase 3 — Encrypt at rest; real deletion.**
REFACTOR: SQLCipher (or field-sealing) for `app.db`; encrypt audio + search index; tokens to Keychain; purge + secure-delete + PHI-appropriate retention defaults (4.3). *Exit:* a stolen-disk test yields only ciphertext; deletion removes data from DB, index, and disk.

**Phase 4 — Identity, calendar, durable record on org control.**
REPLACE: Google OAuth per user (PKCE, loopback, Keychain, native-only) (4.8); direct Google Calendar under org OAuth (4.9); Google Workspace export for durable record (4.10). Build the **administrator model-approval policy** and the PHI-vs-nonclinical interlock, enforced in Rust (4.6). *Exit:* auth, calendar, and record system run under org Google/MDM; cloud AI is hard-gated to nonclinical. **PHI may be introduced only after this phase is verified and a formal §164.308(a)(1) risk analysis is complete.**

**Phase 5 — Supply-chain & hardening.**
REFACTOR: SHA-256 model integrity + org mirror; pin deps/forks; drop `allow-unsigned-executable-memory` if feasible / evaluate App Sandbox; enable release minify; remove localhost-server and relay risks (4.12/4.13). *Exit:* clean dependency audit; hardened entitlements; MDM-distributed signed builds.

## 6. Cross-cutting risks & how the plan handles them

- **Biggest risk — the trust-boundary refactor (Phase 2)** touches ~53 SQL files. *Mitigation:* keep the Drizzle schema as the shared type contract, generate typed accessors, migrate reads before writes, and gate each step behind the existing test suite; a temporary read-only `query_only`-enforced allowlist bridges the transition.
- **Feature loss** (sync, sharing, cloud AI quality) is intentional and consistent with the target. *Mitigation:* Google Workspace export replaces durable record; on-device models are sufficient for the managed-Mac pilot; nonclinical cloud AI remains available under policy.
- **Fail-closed everywhere.** Unknown session classification → treat as PHI (local-only). OAuth/Keychain unavailable → app runs local, no cloud. This ensures a misconfiguration degrades to *more* private, never less.
- **No real PHI during build.** All development uses synthetic fixtures; the mock audio provider already exists.

## 7. What is explicitly NOT decided here

- Choice between SQLCipher vs `e2ee` field-sealing (4.3) — a design spike in Phase 3.
- Whether to keep any in-app updater vs pure MDM distribution (4.11).
- Whether semantic/embedding search is in scope at all (4.15).
- The exact administrator-policy schema and PHI-classification UX (4.6) — needs product input.

These are flagged for a design decision at the start of their phase, not pre-committed.

---

## 8. Stop point

This completes the requested analysis: `UPSTREAM_ANALYSIS.md`, `CURRENT_ARCHITECTURE.md`, `DATA_FLOW_MAP.md`, `NETWORK_DEPENDENCY_MAP.md`, `SECURITY_GAP_ANALYSIS.md`, and this plan. Every component is classified KEEP / REFACTOR / REPLACE / DELETE, and every non-trivial decision states its security impact, engineering tradeoff, and migration risk.

**No implementation has been performed. Per the task, work stops here and awaits your approval before any code changes begin.**
