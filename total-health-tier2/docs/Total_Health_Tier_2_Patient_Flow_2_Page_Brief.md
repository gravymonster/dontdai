# Tier 2 Secondary Consult — V0 patient flow

**Executive brief | August 4, 2026 | Owner: Eric Dai**

> Planning artifact—not medical or legal advice. Clinical scope, state availability, consent language, PHI systems, public claims and the RNA reasoner require licensed review before launch.

## Recommendation

Launch a narrow, coordinator-led pilot for stable adults with an established cancer diagnosis, an existing treating clinician and records primarily held by U.S. providers. Start with the harder **post-cancer-center** cohort: patients who already have a formal second opinion and need differentiated synthesis, targeted testing questions and a provider-ready decision artifact.

The patient sees six simple phases; Total Health runs a ten-stage audited workflow underneath. The service retrieves records after authorization, starts the clinical clock only when the case is complete, produces one layered PDF for patient and provider, guides a 30–60 minute consultation and closes the loop with the treating team.

Today’s Granola notes call this offer “Tier 1A,” while the Google pre-read and Notion assignment call it “Tier 2.” Use **Tier 2 Secondary Consult** internally for this project and avoid tier numbers publicly until the taxonomy is resolved.

## The six-phase patient experience

1. **Check fit.** Confirm adult status, diagnosis, current state/location, outpatient stability, treatment timing and clinician availability. Emergencies, inpatient/hospice cases and questions requiring a physical exam or raw-image interpretation exit or receive manual review.
2. **Authorize and focus.** Verify identity; complete service/telehealth consent, patient-directed records request and/or HIPAA authorization; name a report recipient and optional caregiver; set language/release preferences; prioritize up to three questions.
3. **We gather.** A named coordinator requests records through verified secure routes. Patient upload is optional. A visible tracker shows requested, received, missing and next owner.
4. **Confirm readiness.** Patient verifies the timeline, current plan, medications/allergies and missing items. A clinician—not a checklist—decides that the packet is sufficient. The case receives a data cutoff and packet version, then locks.
5. **Expert review.** Technology organizes source-linked evidence; a named clinician independently reviews the records, basis, uncertainty and recommendations. The optional RNA-to-driver reasoner is clinician-facing and cannot enter the report without acceptance.
6. **Discuss and act.** Patient and nominated provider receive the same versioned PDF through secure channels. A consultation answers the three questions, uses teach-back and assigns next actions. Time-sensitive findings receive clinician-to-clinician escalation and acknowledgement.

## What the patient gets

One PDF with two layers:

- **Pages 1–2:** how to use the report, three plain-language answers, what aligns, what to discuss, action/owner/timing and material limitations.
- **Clinical detail:** goals/questions, timeline, diagnosis/stage, treatment history, testing inventory, evidence → interpretation → uncertainty → recommendation, hereditary-risk screen, records reviewed/missing, references, reviewer attestation and version history.

Required boundary: the review uses records available through a stated date, includes no physical exam, does not replace the treating clinician, is not emergency care and must not be used alone to start/stop/change treatment.

## Operating ownership

| Workstream | Accountable lead | Deliverable |
|---|---|---|
| Patient flow + record authorization | Eric, with Dan legal/privacy | V0 flow, consent/access matrix, patient copy |
| Patient/provider PDF | Scott → Jake QA → Dan legal/scope | Layered template and release language |
| Data inventory + RNA reasoner | Farhan; clinical reviewer accountable | Required/optional data list, intended use and traceable output |
| Records aggregation/operations | Mohit / named coordinator | Source map, record tracker, completeness manifest |
| Provider-to-provider flow | Mohit + Jake | Verified routes, urgency and acknowledgement SOP |
| PHI architecture | Security/IT + Dan | Approved system, BAAs, access/audit/retention/incident controls |

Every case has one named coordinator and one named clinical reviewer. No shared, unowned handoffs.

## Hard gates and rationale

- **Coordinator-led retrieval:** lowers patient burden and matches Dana-Farber/AccessHope and Cleveland Clinic patterns.
- **Clinical completeness gate + packet lock:** prevents different reviewers from using different records and makes turnaround honest.
- **No raw imaging/pathology in standard V0:** contains scope, logistics and regulatory risk; report impressions remain usable.
- **Clinician-gated reasoner:** FDA’s January 2026 CDS guidance makes NGS-pattern interpretation and independent-basis review a material regulatory issue.
- **One layered PDF:** meets the team requirement while serving different literacy/detail needs; modeled on the scope clarity of MSK’s sample remote opinion.
- **Treating-team primacy:** avoids patient self-direction and follows NCI/second-opinion practice.
- **Marketing/PHI separation:** no detailed medical data or health-data retargeting on the public site; authenticated intake begins after a deliberate transition.
- **Google Drive only conditionally:** a Workspace BAA is necessary but not sufficient. Interim use requires Shared Drive, named access, MFA, no link sharing, audit/DLP, retention, approved ingestion and documented risk analysis.

## Pilot service levels and success gates

- One business day: manual eligibility/coordinator contact.
- One business day after complete authorization: record requests sent.
- Every two business days: retrieval status update.
- Typical record target: up to 14 calendar days; some providers may take longer.
- Report target: 7–10 business days after clinical completeness/packet lock.
- Consultation: within three business days after sign-off.

Hard gates for the first 3–5 cases: 100% valid authorization before retrieval; 100% named owner/reviewer/version/data cutoff; 100% source trace and clinician acceptance for material findings; 100% secure delivery logging; documented acknowledgement for time-sensitive cases; zero unresolved wrong-patient events, PHI in unapproved tools, or reports outside approved geographic/clinical scope.

## Four-week launch path

**Week 1 — lock scope:** resolve naming; Scott drafts post-center PDF; Farhan ships data dictionary/intended use; Eric + Dan complete consent matrix; Mohit + Jake map provider flow; Security decides PHI workspace.

**Week 2 — tabletop:** run post-center and no-center cases plus wrong-patient fax, missing pathology, imminent treatment and urgent finding. Revise SOPs until no handoff is unowned.

**Week 3 — synthetic dry run:** execute intake → retrieval → packet lock → synthesis → gated reasoner → report QA → consultation → provider acknowledgement. Test restore/incident response and measure staff time.

**Week 4 — controlled launch:** enroll 1–2 narrow-fit patients, review each case daily without copying PHI into collaboration tools, close both safely and update the SOP before expanding.

## Immediate decisions needed

1. Dan: entity/HIPAA role, state/licensure path, authorization/access strategy, special-data language, report release and urgent-finding policy.
2. Jake/medical lead: clinical completeness, partial review and urgency definitions.
3. Security: production system and whether interim Google Workspace passes risk/configuration review.
4. Farhan + regulatory: RNA reasoner intended use and FDA path.
5. Team: exact price, refund policy, public timeline and whether provider delivery is mandatory.

**Evidence base:** Total Health Google pre-read, August 4 Granola sync and Notion task; NCI/AHRQ; Dana-Farber/AccessHope, Cleveland Clinic, MSK and MD Anderson benchmarks; HHS/ONC/NIST privacy/security guidance; FDA 2026 CDS guidance; FTC health claims, tracking and Health Breach Notification guidance; and Lipitz-Snyderman et al. (Cancer Medicine, 2023). Full report contains the linked source catalog and decision rationale.
