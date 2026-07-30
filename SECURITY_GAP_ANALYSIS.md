# SECURITY_GAP_ANALYSIS.md

Gaps between upstream **Anarlog** (commit `08aad83`) and a HIPAA-first, local-first target. Read-only analysis; paths are upstream-relative.

**Scope of "HIPAA-first" here:** the pilot is **nonclinical first**, on **company-managed, MDM-enforced Apple Silicon Macs**, for a **small internal team**, with **no real PHI and no real recordings** during development. So these gaps are not blockers to *building*; they are the checklist that must be closed **before any PHI touches the system**. Each gap cites the relevant HIPAA Security Rule safeguard (45 CFR §164.3xx) as an anchor, not a compliance opinion — a formal risk analysis (§164.308(a)(1)) is a separate deliverable.

Severity reflects impact **in a PHI deployment**. Findings are ranked; the top tier are the ones that would make a PHI pilot unsafe as-is.

---

## How to read this

Each finding has: what it is, where it lives (cited), why it matters for PHI, the HIPAA anchor, and the disposition that `REFACTOR_PLAN.md` assigns. "Blast radius" findings (over-privileged renderer, no CSP) are defense-in-depth: no end-to-end exploit was demonstrated, but they remove the containment a regulated build needs.

---

## Tier 1 — Must close before any PHI (Critical)

### G1. PHI is unencrypted at rest
**What:** `app.db` (all transcripts, notes, summaries, contacts, calendar), `audio.mp3`/`.wav`, and the Tantivy `search_index/` (a second plaintext copy of note+transcript text) are **plaintext on disk**. No SQLCipher, no libsql encryption, no `PRAGMA key` anywhere (`crates/db-core/src/lib.rs`; `apps/desktop/src-tauri/src/db.rs:5-19`; `plugins/tantivy/src/schema.rs:29-35`; proof-by-construction: `crates/db-cli/src/runtime.rs:32` opens the same DB with no key). The only crypto (`crates/e2ee`) protects the cloud replica, and its plaintext source rows sit in the same file.
**Why it matters:** a lost/stolen/imaged laptop without (or before) FileVault exposes the entire corpus. Tombstone-only deletion (G4) means even "deleted" meetings remain.
**HIPAA anchor:** §164.312(a)(2)(iv) encryption/decryption; §164.312(c) integrity; §164.310(d) device/media controls.
**Disposition:** REFACTOR the DB open path to SQLCipher (or extend `crates/e2ee` field-sealing to the local DB) under an OS-keychain-wrapped key held only by Rust; encrypt or exclude the search index; encrypt audio at rest. MDM FileVault enforcement is a necessary compensating control but not sufficient on its own.

### G2. macOS session tokens are plaintext on disk
**What:** on macOS — the primary target — the Supabase access **and** refresh tokens are written to `~/Library/Application Support/<bundle>/auth.json` in cleartext (`plugins/auth/src/lib.rs:52-67` falls through to `crates/supabase-auth/src/client/store.rs:84-93`). Windows uses DPAPI and shreds its plaintext copy; Linux uses Secret Service; **macOS Keychain is not used for the session.**
**Why it matters:** any process running as the user (or offline disk access) lifts a long-lived refresh token → full account + cloud data access. Tokens also traverse a **URL query string** during sign-in handoff (`apps/web/src/lib/desktop-auth-handoff.ts:17-21`).
**HIPAA anchor:** §164.312(a)(2)(iv); §164.312(d) authentication; §164.308(a)(5)(ii)(D) password/credential management.
**Disposition:** REFACTOR to store the session in the macOS Keychain (native-only scope), never on disk in plaintext; move the auth model to Google OAuth per user under org IdP; eliminate tokens-in-URL.

### G3. The renderer is fully trusted — arbitrary SQL, secrets, filesystem, HTTP, process spawn
**What:** one capability, `"windows": ["*"]`, grants the React webview: **arbitrary SQL** over the whole DB (`plugin:db|execute` with `AssertSqlSafe`, no validation — `plugins/db/src/commands.rs:82-123`, `crates/db-execute/src/query.rs:22,49`); **read of provider API keys** (`store2` fences only `e2ee:`) and **Supabase tokens** (`auth` plugin); an **unscoped `write_text_file`** that bypasses vault containment (`plugins/fs2/src/commands.rs:27-32`); an **unscoped app/URL opener** (`plugins/opener2`); a **QuickJS `eval`** endpoint (`plugins/js`); an **arbitrary-process hooks runner** (`plugins/hooks`); **unrestricted outbound HTTP** (`https://**` with `unsafe-headers`); and **`get_env`** outside the ACL entirely.
**Why it matters:** this is the exact inverse of the target ("Rust owns all sensitive operations; PHI never reachable from React"). Any script execution in the renderer — XSS via rendered shared-note/meeting content, a malicious markdown import, or a single compromised npm dependency — inherits all of it: read every transcript, lift keys/tokens, write persistence files, spawn processes, exfiltrate over HTTP.
**HIPAA anchor:** §164.312(a)(1) access control; §164.312(b) audit controls; §164.308(a)(4) information-access management.
**Disposition:** REFACTOR the trust boundary to the IPC seam. Remove `db:execute`/`execute_proxy` from the renderer in favor of a narrow, typed, parameterized query API owned by Rust; move secrets/tokens fully native (renderer never receives them); scope or remove `fs2`/`opener2`/`js`/`hooks`; per-window capabilities. This is the largest single work item.

### G4. No CSP; asset protocol scoped to all files
**What:** **no `csp` key exists anywhere in the repo** and no `<meta>` CSP in `index.html`, so Tauri injects none; `assetProtocol.scope` is `["**/*"]`, so `convertFileSrc()` reads any file on disk (`apps/desktop/src-tauri/tauri.conf.json:14-24`).
**Why it matters:** removes the one containment that would blunt G3 — injected script has no connect/script restrictions and can read arbitrary local files (including `app.db`, `auth.json`) and exfiltrate them over the unrestricted HTTP grant.
**HIPAA anchor:** §164.312(a)(1); §164.312(e)(1) transmission security.
**Disposition:** REFACTOR — add a strict `security.csp`, narrow `assetProtocol` to `$APPDATA/**` (and prefer streaming attachments through a Rust command over `asset://`), replace `https://**` with an explicit host allowlist.

### G5. Default configuration sends PHI to the cloud
**What:** onboarding auto-starts a Pro trial, and `configurePaidSettings()` silently sets STT to `anarlog/cloud` and LLM to `anarlog/Auto` (`apps/desktop/src/shared/config/configure-paid-settings.ts:11-19`; `apps/desktop/src/onboarding/account/trial.tsx:73,84`; also on any upgrade `apps/desktop/src/auth/billing.tsx:243`). In that state raw audio streams to `wss://api.anarlog.so/stt/listen` and full transcripts+notes to `api.anarlog.so/llm` → OpenRouter → Claude.
**Why it matters:** PHI leaves the device **by default**, and merely upgrading a previously-local user reroutes their audio and notes off-device with no distinct consent. Directly violates "local-first, no vendor cloud dependency for PHI."
**HIPAA anchor:** §164.502 minimum necessary / disclosure; §164.308(b) business-associate requirements; §164.312(e)(1).
**Disposition:** REFACTOR to local-only defaults; REPLACE the vendor AI proxies for PHI; gate any cloud AI to explicitly nonclinical, administrator-approved workflows, default-off, never applied to PHI-tagged sessions.

### G6. Telemetry and crash reporting are compiled-in and default-on
**What:** PostHog (product analytics) is a **mandatory compile-time dependency in release** (`assert!` on `POSTHOG_API_KEY`, `plugins/analytics/src/lib.rs:56-65`) and default-enabled; `identify()` sends **email + user id + plan + OS** (`apps/desktop/src/auth/context.tsx:133-162`). Sentry (Rust + JS) is default-on with `traces_sample_rate:1.0`, **minidump upload**, and **10% Session Replay**, with **no user-facing opt-out** (`apps/desktop/src-tauri/src/lib.rs:83-125`; `apps/desktop/src/error-reporting.ts:124-152`).
**Why it matters:** the target says "no telemetry, no analytics." Even with redaction, a stable machine fingerprint links analytics/errors/server logs, and replay uploads recordings of the app UI to a third party. Each would require a BAA the target explicitly forbids taking on.
**HIPAA anchor:** §164.308(b)(1) business associates; §164.502; §164.312(b).
**Disposition:** DELETE both analytics and Sentry from the desktop build (compile-time absent), including replay and minidump upload.

## Tier 2 — Close before pilot hardening (High)

### G7. Model & sidecar integrity is weak
**What:** local models are verified by **CRC32** (`crates/file/src/lib.rs:523-538`) or not at all (Soniqo/AppleSpeech return `None`), downloaded from `hyprnote.s3.us-east-1.amazonaws.com` over TLS only; no SHA-256, no signature. The `sidecar2` symlink-launch fallback (`plugins/sidecar2/src/ext.rs:90-135`) executes any file next to the resolved binary matching `<name>-`.
**Why it matters:** a CDN/S3 compromise or TLS-terminating proxy could ship a malicious model loaded through `unsafe` FFI. (By contrast the app updater is properly minisign-signed.)
**HIPAA anchor:** §164.312(c)(1) integrity; §164.308(a)(5)(ii)(B) malware protection.
**Disposition:** REFACTOR to SHA-256 (mandatory, not `Option`), org-mirrored or MDM-distributed models, and remove the symlink-launch fallback.

### G8. `allow-unsigned-executable-memory` entitlement
**What:** `Entitlements.plist` sets `com.apple.security.cs.allow-unsigned-executable-memory` (plus `allow-jit`), disabling W^X hardening process-wide, in a process holding microphone/calendar/contacts access. No `app-sandbox` key.
**HIPAA anchor:** §164.308(a)(5)(ii)(B); §164.312(a)(1).
**Disposition:** REFACTOR — drop `allow-unsigned-executable-memory` if MLX/GGML can run under `allow-jit` alone; evaluate App Sandbox for the target build.

### G9. Unauthenticated localhost servers with wildcard CORS
**What:** `crates/local-stt-server` and `plugins/local-stt`'s internal server bind `127.0.0.1:0` with **no auth** and `CORS Any` (`crates/local-stt-server/src/axum_server.rs:28-29,80-86`); the dev **relay** (`127.0.0.1:1423`, no auth, full IPC bridge) is compiled into **staging** via `--features devtools` (`.github/workflows/desktop_cd.yaml:176-178`).
**Why it matters:** any local process or browser page can push audio to the STT endpoint, or (relay) invoke any Tauri command — including DB reads — against a staging install. (The STT server is currently behind the disabled `whisper-cpp` feature; `plugins/local-api` is the good pattern — it *does* authenticate.)
**HIPAA anchor:** §164.312(a)(1); §164.312(e)(1).
**Disposition:** REFACTOR — never ship the relay outside pure dev; add auth + origin checks to any retained localhost server; keep binds loopback-only.

### G10. Third-party OAuth tokens held server-side; calendar transits vendor cloud
**What:** Nango holds Google/Outlook/GitHub/Linear tokens server-side; Google/Outlook calendar reads transit `api.anarlog.so` + `api.nango.dev` (`crates/calendar/src/fetch.rs:45-88`). Apple Calendar (EventKit) is the only on-device path.
**Why it matters:** calendar event titles/attendees are meeting context (potential PHI), and the vendor holds standing OAuth access outside org control — incompatible with "Google OAuth per user" under the org.
**HIPAA anchor:** §164.308(b); §164.312(d); §164.502.
**Disposition:** REPLACE with org-controlled Google OAuth (Workspace) held on-device or in org infrastructure; prefer Apple Calendar locally where sufficient.

### G11. Renderer-readable provider API keys; plaintext webhook secrets
**What:** provider API keys (`ai-provider-api-keys` scope) are readable by the webview and passed as plaintext `api_key` into capture params (`plugins/store2` fences only `e2ee:`; `plugins/transcription/src/api.rs:29`). `webhook_endpoints.secret` is stored raw in the DB (`…20260728090000_local_api.sql:29`).
**HIPAA anchor:** §164.312(a)(2)(iv); §164.312(d).
**Disposition:** REFACTOR — keys stay native; Rust attaches them to outbound requests so the renderer never sees them; hash/seal webhook secrets.

### G12. No data purge / retention enforcement
**What:** deletion is tombstone-only (`deleted_at`); **no purge/vacuum** of domain rows (`apps/desktop/src/session/queries.ts:986-1010`); audio retention defaults to **`forever`**; the search index and WAL/freelist retain content after "delete."
**Why it matters:** PHI persists indefinitely and beyond user-visible deletion — a retention/disposal gap.
**HIPAA anchor:** §164.310(d)(2)(i) media disposal; §164.316(b)(2) retention; §164.312(a)(2)(iv).
**Disposition:** REFACTOR — real purge with secure-delete, retention policy defaults appropriate to PHI, index reconciliation on delete.

## Tier 3 — Hardening & hygiene (Medium)

### G13. Supply-chain surface
Pre-release deps in production (`sqlx 0.9.0-alpha.1`, `ort 2.0.0-rc.10`), three concurrent `rustls` majors + `axum 0.6`/`hyper 0.14` linked, six individual-maintainer git forks, `tauri-nspanel` on a mutable branch, and `curl | sudo bash` installers in CI/dev setup. **HIPAA anchor:** §164.308(a)(1) risk management. **Disposition:** REFACTOR — pin/vendor forks, remove pre-release drivers, consolidate TLS stacks, pin installers.

### G14. Closed-source `cloudsync.dylib` in the trusted process
A prebuilt closed binary is loaded as a SQLite extension into the process holding all user data (`crates/cloudsync/src/bundle.rs`). **HIPAA anchor:** §164.308(a)(1); §164.312(c). **Disposition:** DELETE for the PHI build (CloudSync-to-vendor is out of scope); if any local CRDT is ever needed, source must be auditable.

### G15. Unminified release bundles & pervasive panics
`build.minify:false` in release ships readable source; `.unwrap()`/`.expect()` number in the thousands across crates/plugins, including on startup/network paths (DoS/crash-loop risk, not memory safety). **HIPAA anchor:** §164.312(b); availability. **Disposition:** REFACTOR — enable release minify; convert startup/network panics to handled errors.

### G16. Naming/identity drift
Bundle IDs `com.hyprnote.*`, keychain `com.anarlog.*`, updater `desktop2.hyprnote.com`, deep-link schemes `hypr`/`char`/`anarlog`. **Disposition:** REFACTOR — settle on a single org identity across bundle id, keychain service, updater feed, and schemes (also reduces keychain-migration ambiguity).

### G17. Large dead-code surface
`whisper.cpp` STT compiled out, orphaned crates (`memory`, `segmentation`, `embedding`, `api-bot`, `api-messenger`, `api-storage`, `api-claw`, `porkbun`, `plugins/webhook`, `plugins/network`), `go.mod` with zero Go, dead plugin-loader examples. **HIPAA anchor:** §164.308(a)(1) (reduces auditable surface). **Disposition:** DELETE — prune to shrink the review surface for the regulated build.

### G18. Input-derived rendering (defense-in-depth, currently OK)
No `dangerouslySetInnerHTML`/`eval`/`innerHTML=` in the frontend; ProseMirror builds DOM structurally; link handling restricts to `http/https` with a `javascript:` regression test; `streamdown` renders model output without `rehype-raw`; `chrome-native-host` is well-hardened. Askama/minijinja templates render text (not HTML) and have `autoescape` unset — low-severity today, a latent risk if HTML templates fed by transcripts are ever added. **Disposition:** KEEP with a guardrail — enforce autoescape before any HTML templating of untrusted content; keep the link allowlist.

## Summary — top 10 for a PHI deployment

| # | Gap | Sev | Disposition |
|---|---|---|---|
| 1 | PHI unencrypted at rest (DB, audio, index) — G1 | Critical | REFACTOR (SQLCipher + at-rest encryption) |
| 2 | macOS tokens plaintext on disk / in URL — G2 | Critical | REFACTOR (Keychain + Google OAuth) |
| 3 | Fully-trusted renderer (SQL/secrets/fs/http/proc) — G3 | Critical | REFACTOR (move boundary to IPC) |
| 4 | No CSP; asset scope `**/*` — G4 | Critical | REFACTOR (CSP + narrow scopes) |
| 5 | Cloud-by-default sends PHI off-device — G5 | Critical | REFACTOR defaults + REPLACE proxies |
| 6 | Compiled-in telemetry/crash/replay — G6 | Critical | DELETE from build |
| 7 | Weak model/sidecar integrity (CRC32) — G7 | High | REFACTOR (SHA-256, org mirror) |
| 8 | `allow-unsigned-executable-memory` — G8 | High | REFACTOR (drop / sandbox) |
| 9 | Unauth localhost servers + staging relay — G9 | High | REFACTOR / never-ship-relay |
| 10 | Server-side OAuth custody; calendar via cloud — G10 | High | REPLACE (org Google OAuth) |

Everything here maps to a component decision in `REFACTOR_PLAN.md`, where each carries its security impact, engineering tradeoff, and migration risk. **No changes have been made; this is analysis pending approval.**
