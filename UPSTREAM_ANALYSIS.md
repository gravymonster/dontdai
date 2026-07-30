# UPSTREAM_ANALYSIS.md

**Project:** Anarlog — an open-source, local-first AI meeting notetaker (a "Granola, rearranged").
**Upstream repository:** `github.com/fastrepl/anarlog` (MIT-licensed).
**Analysis commit:** `08aad83` ("Scope Infisical access for Pro intelligence"), the tip of `main` as of 2026-07-30.
**Lineage:** started as **Hyprnote**, briefly rebranded **char**, now maintained as **Anarlog** while the fastrepl team's commercial product continues as **char**. The repository still carries all three eras in bundle identifiers, keychain service names, updater domains, and deep-link schemes.
**Analysis status:** repository analysis only. **No code was modified.** All findings below are read-only observations against a fresh clone.

> This document is the entry point for a six-part analysis. It states what the upstream is, how it was analyzed, and what the headline conclusions are. The companion documents drill in:
> - `CURRENT_ARCHITECTURE.md` — the as-is technical architecture.
> - `DATA_FLOW_MAP.md` — how PHI-class data moves through the system.
> - `NETWORK_DEPENDENCY_MAP.md` — every external endpoint the desktop can reach.
> - `SECURITY_GAP_ANALYSIS.md` — gaps measured against a HIPAA-first bar.
> - `REFACTOR_PLAN.md` — the KEEP / REFACTOR / REPLACE / DELETE plan to reach the target architecture.

---

## 1. Why we are analyzing this

The goal is to transform Anarlog into an **enterprise-grade, HIPAA-first, local-first meeting-intelligence application** for an internal pilot on company-managed, MDM-enforced Apple Silicon Macs, with a **nonclinical pilot first**. The target architecture is:

- **Tauri + Rust core**, **React UI**, native macOS modules where required.
- **Rust owns every sensitive operation.** Audio, transcripts, summaries, embeddings, and OAuth tokens must never be directly reachable from React.
- **Local-first processing**, **no vendor cloud dependency for PHI**, **Google Workspace as the durable record system**, **Google OAuth per user**, and **Google Cloud only for organization-managed services** (voice directory, policy infrastructure).
- **AI is local-first**, restricted to **administrator-approved models**; cloud AI is permitted **only for explicitly nonclinical workflows**.
- **No external upload, no telemetry, no analytics, no new cloud dependencies, no real PHI, no real recordings** during development.

Anarlog is a strong *starting point* because its core promise ("your data, your device", on-device transcription, bring-your-own-LLM, SQLite-as-canonical-store, MIT license) aligns with local-first goals. But the **shipped default configuration and much of the surrounding machinery are cloud-coupled**, and the **desktop trust boundary is placed at the OS rather than at the Rust/React IPC seam** — the opposite of the target. That mismatch is the substance of this analysis.

## 2. How the analysis was done

The working repository for this task (`gravymonster/dontdai`) contained only a placeholder README and a `CNAME`. The subject of the analysis is the public upstream, which was cloned read-only into a scratch directory and examined by six parallel domain investigations, each producing file-and-line-cited findings:

1. Repository architecture & Tauri desktop framework
2. Audio capture pipeline
3. Transcription & AI/LLM pipeline
4. Storage architecture (data at rest)
5. Network dependencies, cloud services, authentication
6. Third-party dependencies & security posture

Every claim in the companion documents is traceable to a path and line in the upstream tree at commit `08aad83`. Citations use the upstream-relative path (e.g. `plugins/db/src/commands.rs:82`).

## 3. What Anarlog actually is (as-built)

- A **Tauri 2.10 desktop application** (`apps/desktop`) with a **React 19 + TanStack** frontend and a large **Rust workspace**: **175 crates**, **~50 in-house Tauri plugins**, 17 shared JS packages, plus separate `apps/{api,web,stripe,mobile,watch,cli}`.
- The canonical datastore is a **local SQLite database** (`app.db`) accessed through `sqlx`, with a **vendored closed-source SQLite Cloud CRDT extension** (`cloudsync.dylib`) for optional cross-device sync.
- **On-device transcription** exists and works (Soniqo/Parakeet CoreML and Apple SpeechAnalyzer on Apple Silicon), and **local LLM** is supported via LM Studio, Ollama, and Apple Foundation Models.
- **Optional, but default-on-when-signed-in, cloud features**: a vendor STT proxy (`api.anarlog.so/stt`), a vendor LLM proxy (`api.anarlog.so/llm`, an OpenRouter passthrough to Claude Sonnet), E2EE CloudSync, attachment backup, share links, and an opt-in "Cloud API & Connectors" feature that uploads server-readable copies of meeting content.
- Authentication is **Supabase-backed**, with **Google and GitHub OAuth** performed in the system browser and handed back to the desktop via a custom URL scheme.
- **Product analytics (PostHog) and crash reporting (Sentry, including 10%-sampled session replay) are compiled into official release builds and enabled by default.**

## 4. The five findings that shape everything downstream

These are the load-bearing conclusions. Each is expanded, with citations, in the companion documents.

### 4.1 The shipped default is cloud, not local
The README claims "transcription runs on-device, so audio never leaves your machine." In practice, onboarding **auto-starts a Pro trial**, and the trial/billing path calls `configurePaidSettings()`, which silently sets STT to `anarlog/cloud` and LLM to `anarlog/Auto` (`apps/desktop/src/shared/config/configure-paid-settings.ts:11-19`, invoked from `apps/desktop/src/onboarding/account/trial.tsx:73,84` and `apps/desktop/src/auth/billing.tsx:243`). In that state, **raw meeting audio streams to `wss://api.anarlog.so/stt/listen`** (relayed to Deepgram/Soniox/etc. on Anarlog's keys) and **full transcripts + notes stream to `api.anarlog.so/llm`** (OpenRouter → Claude Sonnet). Local is a deliberate, multi-step opt-in, not the default. **For a HIPAA-first build this default must be inverted and the cloud AI paths must be gated to nonclinical workflows only.**

### 4.2 Nothing is encrypted at rest
`app.db` (all transcripts, notes, summaries, contacts, calendar events), the recorded `audio.mp3`/`audio.wav`, the Tantivy full-text search index (a second plaintext copy of note + transcript text), and — on macOS specifically — the Supabase **auth tokens in `auth.json`** are all **plaintext on disk** (`apps/desktop/src-tauri/src/db.rs:5-19`; `crates/db-core/src/lib.rs`; `plugins/tantivy/src/schema.rs:29-35`; `crates/supabase-auth/src/client/store.rs:84-93`). The only cryptography (`crates/e2ee`) protects the *cloud replica*, not the local disk. macOS is the primary target platform and the one that falls through to plaintext token storage (Windows uses DPAPI, Linux uses Secret Service). **A stolen or imaged laptop without FileVault exposes the entire corpus — a direct HIPAA §164.312(a)(2)(iv) gap.**

### 4.3 The trust boundary is at the OS, not the IPC
The React webview is treated as fully trusted. A single Tauri capability applies to every window (`"windows": ["*"]`), and it grants the renderer **arbitrary SQL over the whole database** (`plugin:db|execute` with `AssertSqlSafe` and no validation), **read access to provider API keys and Supabase tokens**, **an unscoped `write_text_file`**, an **unscoped app/URL opener**, a **QuickJS `eval` endpoint**, an **arbitrary-process hooks runner**, and **unrestricted outbound HTTP** (`https://**`) — all with **no Content-Security-Policy** and an asset-protocol scope of `**/*` (`apps/desktop/src-tauri/capabilities/default.json`; `apps/desktop/src-tauri/tauri.conf.json`). This is the exact inverse of the target ("Rust owns all sensitive operations; sensitive data never reachable from React"). Reaching the target is the single largest piece of engineering in the refactor.

### 4.4 The vendor cloud is broad, and some of it defeats the privacy story
Beyond the AI proxies, the desktop talks to `api.anarlog.so` for CloudSync token exchange, attachment backup, share snapshots, calendar (Google/Outlook proxied through **Nango**, with third-party OAuth tokens held **server-side**), tickets, web search, and subscription/billing. **Share snapshots and the opt-in Cloud API upload plaintext, server-readable meeting content** even though CloudSync itself is E2EE — an asymmetry users are unlikely to infer. Several network connections **auto-start on launch** before any user action (Sentry, PostHog, updater, Supabase refresh). **For PHI, none of these vendor paths may carry clinical content; Google Workspace must become the durable record system instead.**

### 4.5 Large dead-code and closed-binary surface
The repo carries substantial unreachable machinery — `whisper.cpp` local STT compiled out behind an unset feature, orphaned crates (`memory`, `segmentation`, `embedding`, `api-bot`, `api-messenger`, `api-storage`, `api-claw`, `porkbun`, `plugins/webhook`, `plugins/network`), a `go.mod` with zero Go files, and dead plugin-loader examples that once injected third-party JS into the main renderer. It also ships a **closed-source `cloudsync.dylib`** loaded as a SQLite extension into the process that holds all user data, and downloads models verified only by **CRC32** (or not at all). For an auditable HIPAA build, this surface must be pruned and the closed binary removed.

## 5. Provenance, licensing, and supply-chain notes

- **License:** MIT (`LICENSE`), maintained by fastrepl. Forking, self-hosting, and commercial reuse are permitted — this is what makes the transformation viable.
- **Naming drift:** bundle IDs are still `com.hyprnote.*`; keychain service is mid-rename to `com.anarlog.*`; the updater endpoint is `desktop2.hyprnote.com`; deep-link schemes include `hypr`, `char`, and `anarlog`. A rebranded internal build must settle this consistently.
- **Git dependencies:** several crates come from individual-maintainer forks (`fastrepl/async-openai`, `codeberg.org/tazz4843/whisper-rs`, `thewh1teagle/pyannote-rs`, `yujonglee/swift-rs`), and `tauri-nspanel` tracks a mutable branch. Each is an independent trust anchor to pin and vendor.
- **Pre-release deps in production:** `sqlx 0.9.0-alpha.1` and `ort 2.0.0-rc.10` ship in the desktop app; three concurrent `rustls` majors plus `axum 0.6`/`hyper 0.14` are still linked.
- **Build-time secrets:** `POSTHOG_API_KEY` is a **mandatory** compile-time input for release builds (`assert!(starts_with("phc_"))`), `SENTRY_DSN` is baked in, and Supabase/Stripe/signing keys are injected via GitHub Actions + Infisical. The latest upstream commit narrows an Infisical CI token to least-privilege — a sign the upstream is actively tightening, but the desktop analytics/crash dependency remains compiled-in.

## 6. Bottom line

Anarlog gives us a **capable, MIT-licensed, local-capable foundation** with a working on-device audio→STT→LLM pipeline, a clean SQLite canonical model, and real native macOS integration. It is **not, as shipped, a HIPAA-first application**: its defaults are cloud, its disk is unencrypted, its renderer is over-privileged, and its network surface is wide and partly re-identifying.

The transformation is therefore **feasible but substantial**. It is primarily *subtractive and boundary-tightening* rather than a rewrite: invert the defaults to local-only, encrypt everything at rest, move the trust boundary to the Rust/React IPC seam, sever the PHI cloud paths, adopt Google Workspace as the durable record, and prune the dead and closed-binary surface. The phased plan and per-component KEEP / REFACTOR / REPLACE / DELETE decisions — each with security impact, engineering tradeoff, and migration risk — are in `REFACTOR_PLAN.md`.

**No implementation has been performed. This is analysis only; await approval before any code changes.**
