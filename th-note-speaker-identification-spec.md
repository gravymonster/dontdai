# TH Note — Speaker Identification Spec (updated 2026-08-01)

This revision replaces the previous conservative speaker-labeling policy ("never
infer identity from the invite list") with Granola-style attendee-based
identification: TH Note identifies speakers using the meeting's calendar
attendees and enriches the transcript, notes, and summaries with each speaker's
correct full name.

This is the sanitized, public-safe copy of the continuation prompt's primary
objective. Machine-specific paths, document links, and meeting details live in
the full prompt delivered privately.

## Target behavior

1. **Attendee roster as the identity source.**
   - The calendar event's attendee list, plus the signed-in user, is the
     canonical roster of candidate speaker identities for the meeting.
   - Each identity carries the attendee's full display name, backed by the
     stable attendee ID, and same-name attendees remain disambiguated by email.

2. **Resolve every speaker label to a correct full name whenever possible.**
   - "Me" (microphone track) resolves to the signed-in user's full name from
     their Google account / calendar identity. The transcript UI may show
     "Full Name (me)"; exports and summaries use the full name.
   - Live Meet/Zoom active-speaker display names are matched to the attendee
     roster using normalized fuzzy matching — case, diacritics, nicknames and
     short forms (Sam/Samuel), initials, "Last, First" ordering, and email
     local-parts — and rendered as the attendee's canonical full name. A
     display name that matches no attendee (dial-in, uninvited guest) keeps the
     platform display name as-is.
   - Anonymous diarized speakers ("Speaker 1", "Speaker 2") are resolved
     against the remaining unclaimed attendees using transcript context:
     self-introductions, direct address followed by a voice change, roster
     elimination in small meetings, and voice-centroid continuity across
     encrypted recording checkpoints.
   - **Confidence gate:** apply a name only above a clear confidence threshold.
     Below the threshold, keep the generic label. Never fabricate a name that
     is not on the roster or in platform evidence, and never assign the same
     attendee to two simultaneous distinct voices.
   - Shared-device and overlapping speech remain unattributed (generic label) —
     Granola documents the same limitation; do not guess.

3. **Enrich notes and summaries with correct full names.**
   - Summaries, action items, and enhanced notes refer to people by canonical
     full names wherever a speaker mapping exists — no "Them" or "Speaker 2" in
     generated prose when the identity is known.
   - Where identity is genuinely unknown, prose uses "a participant" or the
     generic label. Do not guess.
   - Calendar attendance alone still never proves task ownership. Ownership and
     commitments in summaries must be grounded in what the mapped speaker
     actually said.

4. **Corrections remain supreme.**
   - Manual per-meeting speaker corrections override every automatic signal,
     propagate through transcript, notes, and exports, and can be reset.
   - Automatically inferred names are visibly marked as inferred and are
     one-click correctable through the existing speaker menu; the attendee
     roster is the primary choice set, with free-text entry preserved.
   - Corrections continue to mark derived notes stale. Updating notes stays
     explicit and can update the linked export document.

5. **Retroactive enrichment of existing meetings.**
   - Supersedes the previous "no retroactive inference" rule. Existing meetings
     may be re-resolved against their attendee roster using stored diarization,
     recorded platform-name events, and transcript context, under the same
     confidence gate.
   - Implemented as an explicit, reversible per-meeting refresh (plus an opt-in
     bulk migration). It never overwrites or discards prior manual corrections,
     and it marks affected notes stale rather than silently rewriting exported
     documents.

6. **Privacy and safety constraints (unchanged).**
   - Never retain raw Accessibility trees or interface text.
   - Encrypted storage, recording checkpoints, and concurrent-edit/staleness
     protections stay intact.
   - Reproduce Granola's observable behavior only; do not copy proprietary
     source code or bypass usage/rate limits.

## Updated behavioral principle

The calendar attendee roster is the source of speaker identities, and live
Meet/Zoom platform names are the strongest evidence for binding a voice to a
roster identity. Contextual inference may bind remaining voices to remaining
attendees only above the confidence threshold, with the inference visibly
marked and trivially correctable. Below the threshold — or for voices with no
plausible roster match — labels stay generic. Manual corrections always win.
Being invited to a meeting makes someone a candidate identity, not a confirmed
voice: enrich aggressively, but never present a guess as a certainty.

## Verification requirements

Add tests covering at least:
- Display-name → attendee matching: nicknames, initials, diacritics,
  "Last, First", duplicate names disambiguated by email, uninvited guest keeps
  raw display name.
- "Me" resolves to the signed-in user's full name in transcript, summary, and
  export.
- Contextual inference respects the confidence gate (below threshold stays
  "Speaker N"; no roster name → no label).
- Retroactive refresh: idempotent, reversible, never clobbers manual
  corrections, marks notes stale.
- Summaries use full names for mapped speakers and neutral wording for unmapped
  ones; attendance alone never yields task ownership.
- Export updates the same document ID and named range with upgraded labels — no
  duplicate documents.

Then rerun the whole suite: `swift test -Xswiftc -warnings-as-errors` and the
acceptance script must pass after every material change.

## Granola behavioral references

- https://docs.granola.ai/help-center/taking-notes/speaker-attribution
- https://docs.granola.ai/help-center/taking-notes/speaker-attribution-google-meet
- https://docs.granola.ai/help-center/taking-notes/speaker-attribution-zoom
- https://docs.granola.ai/help-center/taking-notes/transcription
- https://docs.granola.ai/help-center/taking-notes/ai-enhanced-notes
