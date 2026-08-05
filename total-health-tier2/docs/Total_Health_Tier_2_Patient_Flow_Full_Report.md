# Total Health Tier 2 Secondary Consult

## V0 patient flow, operating model, and launch plan

**Version:** 0.9 planning draft  
**Prepared for:** Total Health product, clinical, operations, privacy and legal review  
**Prepared:** August 4, 2026  
**Canonical product label:** Tier 2 Secondary Consult  
**Primary owner for this blueprint:** Eric Dai  

> **Planning artifact—not medical or legal advice.** This document proposes a patient and operating flow. It does not approve clinical practice, state coverage, consent language, privacy/security controls, advertising claims, or the RNA-to-driver mechanism. Those items require the named licensed clinical, legal, privacy and security reviewers before launch.

## Executive recommendation

Launch a deliberately narrow, coordinator-led secondary-consult pilot for stable, non-emergent adults with an established cancer diagnosis and an existing treating clinician. The patient should see a calm six-phase experience: **Check fit → Authorize → We gather → Confirm readiness → Expert review → Discuss and act.** Underneath that experience, Total Health should run a ten-stage, auditable operating workflow with hard gates for eligibility, authorization, record completeness, clinical review, versioned report delivery and provider acknowledgement.

The product is not a portal full of documents. It is a managed service that turns fragmented records into one clinician-reviewed, source-traceable report for the patient and their care team, followed by a guided consultation and closed-loop provider handoff. This framing follows the team’s product thesis [I1–I3], the operating patterns of established virtual second-opinion programs [E3–E5], and evidence that high-quality oncology second opinions can confirm the current plan or result in clinically meaningful changes—often de-escalations—without implying that every case will change [E1–E2].

The V0 should begin with the harder **post-cancer-center** cohort identified by Scott: patients who have already received a formal opinion from a major center and need a differentiated synthesis, targeted testing questions and decision clarity. Designing for this cohort forces the product to show value beyond basic record summarization. The second cohort—patients who have not yet visited a major center—can reuse the same backbone with a broader record request and a stricter completeness review [I2].

Five decisions are critical:

1. **Total Health retrieves records after authorization.** Patient upload remains an optional accelerator, not the primary path. This lowers patient burden and matches leading programs [E3–E4].
2. **The review clock starts only when the case is clinically complete.** Every case has a visible missing-records list, data-cutoff timestamp and packet-lock event. This prevents false precision and protects turnaround promises [E3, E5].
3. **One PDF serves two audiences through layered design.** Pages 1–2 are a plain-language patient action summary; the remainder provides clinician detail, evidence, limitations and version history. This satisfies the team’s single-PDF constraint without forcing patients to read a specialist memo [I1–I2, E5].
4. **The RNA-to-driver reasoner is clinician-facing and gated.** Its output cannot be patient-direct or enter the report without named clinician review, visible provenance and independent review of the basis. FDA’s January 2026 CDS guidance makes this a regulatory-review item, especially where NGS patterns or their clinical implications are analyzed [E26].
5. **Marketing and PHI intake are technically separated.** The public landing page collects the minimum needed to check availability and does not use health-data retargeting. Detailed health information moves to an authenticated, approved workflow. HHS and FTC guidance make third-party trackers, advertising disclosures and breaches of consumer health information a material risk [E27–E30].

## Source hierarchy and a terminology conflict

This plan uses the following hierarchy when sources conflict:

1. The user’s assigned Notion task and the Google pre-read define the canonical product name and deliverable.
2. The Granola notes define today’s discussion, ownership and unresolved questions.
3. Official law/regulator guidance defines external constraints.
4. Established second-opinion programs define operating benchmarks, not requirements.
5. Peer-reviewed literature supports hypotheses and expectations, not promises.

Today’s Granola notes called the secondary-consult offer **“Tier 1A,”** while the Google Doc and Notion task call it **“Tier 2.”** This document uses **Tier 2 Secondary Consult** throughout. The team should resolve the portfolio taxonomy before patient-facing launch and avoid tier numbers in public copy until it does.

## Product contract

### What V0 is

- A self-pay, virtual secondary consult for an adult with an established cancer diagnosis and an existing treating clinician.
- A coordinator-led collection and organization of relevant records from patient-nominated sources.
- A structured, source-linked synthesis of the records available through a stated date.
- A named clinician’s review of the diagnosis, current plan, unresolved questions, missing information and reasonable testing or treatment considerations within the approved scope.
- One versioned PDF sent securely to the patient and nominated treating provider, plus a 30–60 minute consultation and a documented follow-up plan.
- A potential referral point for hereditary-cancer genetics when the patient’s history or results indicate that a genetics evaluation may be appropriate.

### What V0 is not

- Emergency, inpatient, hospice or crisis care.
- A replacement for the treating oncologist, a new longitudinal care relationship, or an order-entry service.
- An assurance that the diagnosis or treatment plan will change.
- Independent interpretation of raw radiology images or pathology slides in the standard V0.
- An automated recommendation delivered to a patient without clinician review.
- A guarantee that records will be obtained or that the report will arrive before a scheduled treatment.
- A destination for real patient data in the prototype site, Notion, ordinary email, personal drives or consumer AI tools.

### Intended V0 outcome

At the end of the flow, the patient can accurately state:

1. what the records currently show;
2. where Total Health agrees, differs or remains uncertain;
3. which questions and next steps to discuss with the treating team;
4. what information was missing or out of scope;
5. whether a hereditary-cancer genetics referral is worth discussing; and
6. who is responsible for each next action.

The treating team receives the same report, an urgency classification, a direct contact route and a documented request to acknowledge receipt when action is time-sensitive.

## Design principles

### 1. Reduce patient work before adding software

Cancer patients commonly face record fragmentation, treatment pressure and cognitive overload. Established virtual programs use coordinators or nurses to gather records after consent [E3–E4], while navigation evidence supports reduced barriers and faster movement through care [E8]. V0 should therefore optimize **patient minutes and uncertainty**, not number of portal features.

### 2. Earn trust with visible boundaries

Every patient-facing surface should state what the service can and cannot do, who reviewed the case, which records were used and when the record set was frozen. The report should use neutral language—“based on records available through…” and “discuss with your treating clinician”—rather than implying that another clinician failed.

### 3. Make completeness a clinical decision, not a checkbox count

The relevance of a missing item depends on the question. A missing molecular report is critical if the report proposes a biomarker-driven therapy but not necessarily if the patient only asks whether a surgical plan is consistent with an already documented stage. The coordinator can assemble the case, but a clinician owns the decision that the packet is sufficient for the requested scope.

### 4. Separate evidence, inference and recommendation

The internal model and final report should visibly distinguish:

- **Record fact:** directly stated in a source document.
- **Derived timeline fact:** normalized across documents, with source and date.
- **Clinical inference:** interpretation by the reviewer, with uncertainty.
- **Recommendation or consideration:** an action to discuss, including rationale, alternatives and urgency.

This structure supports Total Health’s public promise of decision lineage [I4] and the FDA criterion that an HCP be able to independently review the basis for CDS recommendations [E26].

### 5. Design for the patient and provider at the same time

One PDF can work only if it is layered. The patient needs a short action summary and plain language; the provider needs chronology, evidence, uncertainty, references and exact requested action. Sending different substantive reports would create reconciliation and liability problems.

### 6. Default to privacy minimization

Collect the smallest amount of health information needed at each stage. Keep public marketing and protected intake separate. Do not use third-party advertising pixels, session replay or product analytics on authenticated pages unless a formal legal/security review finds a permitted configuration and appropriate agreements [E27–E30].

### 7. Keep the treating team in the loop

NCI encourages involving the existing physician in a second opinion [E1]. The report should never tell a patient to change therapy independently. A provider-to-provider loop, urgent escalation policy and delivery confirmation are core product functions, not afterthoughts.

## The patient-facing journey

The patient sees six phases. The operating team executes ten stages underneath them.

### Phase 1 — Check whether the service fits

**Patient promise:** “In about three minutes, we’ll tell you whether this type of review is likely to fit your situation and what happens next.”

**Patient actions**

- Confirm age 18 or older.
- Confirm an established cancer diagnosis.
- Select current location/state and preferred language.
- Identify whether currently hospitalized, in hospice, experiencing an emergency, or facing treatment/procedure in the next ten business days.
- Choose current care situation: already visited a major cancer center; not yet visited one; unsure.
- Provide only minimum contact information needed for follow-up.

**System behavior**

- Immediately route emergencies to 911/local emergency care and direct clinical deterioration to the current oncology team.
- Exclude or manually review hospitalized, hospice and clinically unstable cases.
- Check whether a licensed reviewer and legally approved care model are available for the patient’s location.
- Flag time-sensitive treatment. Do not imply that the patient should delay treatment; accept only if the clinical team can meet a documented deadline.
- Explain self-pay status and exact price before a charge.

**Output:** eligible, manual clinical triage, waitlist/location unavailable, or not appropriate—with a reason and safe alternative.

**Rationale:** state rules vary and telehealth is generally treated as occurring where the patient is located [E31]. Large programs apply geographic and clinical exclusions [E3–E4]. Capturing location and urgency first prevents collecting a full cancer history for a service that cannot legally or safely proceed.

### Phase 2 — Authorize, set preferences and define the questions

**Patient promise:** “You choose what we may request, who may receive the final report and how you want information discussed.”

**Patient actions**

- Verify identity and contact channels.
- Review service consent, privacy notice, HIPAA authorization or patient-directed access request, telehealth consent where applicable, payment/cancellation terms and report disclosure.
- Name facilities and clinicians holding relevant records.
- Name the clinician who should receive the report.
- Optionally authorize a caregiver and define what that caregiver may do or receive.
- Select communication and language/accessibility preferences.
- Identify up to three questions and the decision/timeline behind each.
- Choose a report-release preference: receive at the clinician-led consultation; receive immediately before; or receive after the discussion, subject to urgent-safety rules.

**System behavior**

- Present consent documents separately, in plain language, with version, timestamp and downloadable copy.
- Do not use a generic “consent” checkbox as a substitute for a valid authorization.
- Generate a source-specific request plan. The legal workflow should support both a patient-directed access request and a HIPAA authorization, because the two mechanisms have different effects [E13–E15].
- Record revocation and expiration logic. Route specially protected records—including Part 2 SUD records and state-protected categories—to counsel-approved forms [E22].

**Output:** signed, versioned authorization package; patient preference profile; three prioritized questions; provider recipient; record-source list.

**Rationale:** focused questions improve the relevance of a second opinion [E3, E12]. AHRQ and NCI recommend preference-sensitive, plain-language communication and confirmation of understanding [E9–E11].

### Phase 3 — We gather and organize the records

**Patient promise:** “We do the chasing. You can upload records you already have, but it is not your job to build the chart.”

**Patient actions**

- Confirm facility and clinician details.
- Optionally upload records already in hand through the approved secure channel.
- Respond only to specific gaps or identity questions.

**Coordinator actions**

- Send a verified, specific request to each source with the correct patient document.
- Use the source’s supported route: patient portal, secure exchange, Direct, verified secure fax, mail or patient pickup.
- Log request, confirmation, follow-up and receipt.
- Reconcile page counts and patient identity; quarantine mismatched records.
- Classify each document by source, date, type and service episode; preserve the original.
- Maintain a patient-visible tracker that says what was requested, received, still missing and who owns the next move.

**Output:** indexed case workspace and live missing-record map.

**Rationale:** patient upload creates avoidable drop-off [I2]. Dana-Farber and Cleveland Clinic describe consent-based record collection as part of the service [E3–E4]. HHS allows appropriate treatment communication by fax, email or phone with reasonable safeguards, but Total Health’s entity status and permitted basis must be confirmed [E19].

### Phase 4 — Confirm that the case is ready

**Patient promise:** “Before expert review starts, we’ll show you what is present, what is missing and what date the report will cover.”

**Patient actions**

- Verify name, diagnosis, current treatment status, current medications/allergies, key dates and treating clinician.
- Review the missing-record list.
- Confirm that the top three questions are final.
- If important records are unavailable, choose among waiting, narrowing the question, proceeding with explicit limitations if the clinician approves, or cancelling under the stated policy.

**Clinical/operations actions**

- A coordinator completes the mechanical checklist.
- A clinician decides whether the record set is sufficient for the requested scope.
- Assign a **data cutoff** and **case packet version**; compute a manifest/hash.
- Freeze the packet when review begins. New material becomes an addendum request or a new case unless the reviewer explicitly reopens the packet.
- Set a report delivery target only after the packet is complete.

**Output:** clinical completeness approval, frozen case manifest, review start timestamp and delivery target.

**Rationale:** established programs do not begin expert review until materials are complete and may decline additions after the review starts [E3]. A formal case freeze prevents analysts and clinicians from reasoning over different versions.

### Phase 5 — Expert synthesis and clinical review

**Patient promise:** “Technology helps organize the evidence; a qualified clinician is responsible for the interpretation and final report.”

**Operating actions**

- Normalize the clinical timeline and reconcile duplicates.
- Extract source-linked facts, uncertainties and contradictions.
- Compare the current plan to approved evidence sources and current guidelines within scope.
- Run the optional RNA-to-driver mechanism only when eligibility, data quality and regulatory controls are met.
- Require a named clinician to independently review the underlying records and basis for every recommendation.
- Separate routine differences of opinion from time-sensitive safety findings.
- Draft the one-report deliverable; run clinical QA, editorial QA and required legal/scope checks.

**Output:** signed, versioned, source-traceable PDF and provider handoff classification.

**Rationale:** FDA distinguishes HCP-facing non-device CDS from software functions that analyze certain images, signals or genomic patterns, and requires independent review of the basis for non-device CDS [E26]. The report therefore cannot simply present a model’s conclusion.

### Phase 6 — Discuss, share and act

**Patient promise:** “You and your care team get one clear report, a guided conversation and a concrete next-step list.”

**Patient consultation**

- Confirm information preferences and whether a caregiver is present.
- Lead with the three most important findings in plain language.
- Answer the patient’s three questions.
- Explain what agrees with the current plan, what differs and what remains uncertain.
- Review actions by owner and urgency.
- Use teach-back: ask the patient to explain the plan in their own words.
- Remind the patient that the treating clinician directs care and that urgent symptoms require local care.

**Provider handoff**

- Deliver the same versioned PDF via the provider’s verified channel.
- Include a concise cover note: informational, routine discussion requested, or time-sensitive clinician response requested.
- For time-sensitive findings, a licensed clinician calls the treating team and documents attempts and acknowledgement.
- Track provider receipt and close the loop.

**Closeout**

- Send the patient a plain-language next-step recap within one business day.
- Apply the addendum policy to factual errors or newly received material.
- Offer hereditary-cancer genetics referral only when appropriate, with counseling and separate informed consent [E32–E33].
- Invite the patient to longitudinal services only after the immediate consultation is closed; do not blur a sales message into the clinical visit.

**Output:** completed consultation, provider delivery/acknowledgement record, action plan, addendum disposition and optional referral.

## The ten-stage operating workflow

| Stage | Accountable owner | Core inputs | Core output / handoff | Hard launch blocker |
|---|---|---|---|---|
| 0. Public inquiry | Eric / Product | Public copy, availability rules, privacy-safe form | Minimal lead and fit-check start | Claims, privacy policy, tracker/pixel policy |
| 1. Eligibility and urgency | Licensed triage owner | Age, diagnosis, location, acuity, treatment date | Eligible / manual review / redirect | State coverage and emergency policy |
| 2. Consent and identity | Eric + Dan | Identity, service/telehealth consent, authorization/access request, caregiver preference | Signed versioned package | Counsel-approved forms and e-sign audit |
| 3. Coordinator kickoff | Named patient coordinator | Questions, goals, provider/facility list, cohort | Case plan and record-source map | Coordinator SOP and escalation route |
| 4. Record retrieval | Mohit / Records Operations | Authorization package and data request | Indexed originals and missing-record map | Approved fax/exchange vendors and BAAs |
| 5. Completeness and case lock | Clinical reviewer accountable; coordinator responsible | Minimum-case checklist, patient verification | Clinical completeness approval and packet version | Minimum data policy and partial-review rule |
| 6. Structured synthesis | Farhan / Clinical Data | Frozen packet and evidence sources | Timeline, evidence table, contradiction log | Data model, provenance and human verification |
| 7. RNA mechanism reasoner | Farhan; clinician accountable | Eligible molecular/RNA inputs | Clinician-facing trace with uncertainty | FDA/regulatory boundary, validation, approved intended use |
| 8. Clinical review and PDF | Scott draft; Jake QA; Dan legal/scope | Evidence package, patient questions, report template | Signed one-PDF report and urgency class | Licensed reviewer, report/disclosure approval |
| 9. Consultation and provider handoff | Licensed consultant + Jake/Mohit flow | Final PDF, patient preferences, verified provider route | Teach-back, secure delivery and acknowledgement | State/licensure map, escalation and acknowledgement SOP |
| 10. Closeout and referral | Coordinator + genetics pathway owner | Action plan, feedback, hereditary indicators | Addendum/closure, genetics referral, retention action | Retention policy and genetics consent/counseling path |

Every case must have exactly one named patient coordinator and one named clinical reviewer. Shared responsibility without an accountable individual is a launch blocker.

## Two intake cohorts

### Cohort A — Already evaluated at a major cancer center

**Primary value question:** What can Total Health add after an expert opinion already exists?

**Required emphasis**

- The formal second-opinion/consult note and any tumor-board summary.
- Molecular profiling, biomarker reports and current radiology report impressions.
- The current treatment decision, alternatives considered and unanswered questions.
- Comparison across sources: where recommendations align, differ or depend on assumptions.
- Targeted testing gaps, mechanism questions and practical next steps.

**V0 design decision:** start here. It is the harder value proposition and forces differentiation through evidence organization, reasoning trace, testing recommendations and provider-ready actionability rather than “access to a specialist” alone [I2].

### Cohort B — No major cancer-center evaluation

**Primary value question:** Is the diagnostic and treatment foundation sufficiently complete, and what should the patient discuss before proceeding?

**Required emphasis**

- Broader collection from all diagnosing and treating facilities.
- Pathology and staging documentation, treatment history and current plan.
- Recent labs and a recent clinical assessment/physical exam.
- Identification of missing foundational workup before advanced mechanism analysis.
- A lower threshold to pause for missing records or redirect to an in-person comprehensive center.

The same report template works for both cohorts, but the completeness rules and coordinator work are different. Cohort should be a first-class case field.

## Eligibility and triage specification

### Include in V0

- Adult patient with a documented cancer diagnosis or a documented abnormality under active oncology evaluation, subject to counsel/clinical definition.
- Stable outpatient with an existing treating clinician who can receive and act on the report.
- Records are primarily held by U.S. providers and can be requested with the approved workflow.
- Patient can give informed consent or has a verified legal personal representative.
- A Total Health reviewer with the appropriate oncology scope and state authority is available.
- Patient accepts the report’s role and agrees not to make treatment changes without the treating clinician.

### Exclude or require medical-director review

- Medical emergency, acute deterioration, hospitalization, hospice crisis or no local clinical team.
- Treatment/procedure is imminent and the service cannot deliver before the decision without encouraging unsafe delay.
- The central question requires raw radiology interpretation, pathology slide review or physical examination that V0 does not provide.
- Records are too incomplete or internally inconsistent to support the requested scope.
- Pediatric case, pregnancy-related oncology complexities, international jurisdiction or another population outside approved coverage.
- Patient requests prescribing, orders, disability/legal causation, or a guarantee of treatment access.

### Safety language

Use a persistent but calm statement: “This service is not emergency care and does not monitor symptoms. If you have new or worsening symptoms, contact your treating team or emergency services. Do not delay time-sensitive treatment while waiting for this review unless your treating clinician advises you to.”

## Consent, authorization and disclosure package

Dan should review the following as a single system, because the report promise and data use must match the forms.

### Document set

1. **Service informed consent:** scope, remote-record review, no physical exam, treating-clinician primacy, alternatives, material risks/limits, patient responsibilities and complaint route.
2. **Telehealth consent:** only where the consultation is a telehealth encounter; state-specific disclosures as required.
3. **Patient-directed access request:** the patient directs each source to send specified records to Total Health. This may carry a mandatory disclosure right and fee limits under HIPAA, subject to exceptions and current court guidance [E14–E15].
4. **HIPAA authorization:** permits source providers to disclose defined PHI to Total Health, with required elements, expiration, revocation and required statements [E13–E15].
5. **Caregiver/representative permission:** role, scope, expiration and identity verification.
6. **Provider delivery authorization/preference:** name and verified destination of the report recipient; whether additional clinicians may receive it.
7. **Privacy notice and consumer-health-data disclosure:** what is collected before HIPAA/BA status is established, use of vendors, no sale/advertising use, retention and rights.
8. **Specially protected data language:** counsel-approved handling of Part 2 SUD records, psychotherapy notes and state-protected HIV, reproductive and genetic data where applicable [E22].
9. **Payment, cancellation and incomplete-record policy.**
10. **Report release and unexpected-finding policy:** timing preferences do not override urgent safety escalation.

### Consent UX requirements

- Separate documents and checkboxes by purpose; no bundled blanket approval.
- Plain-language summaries before legal text.
- Version, signer identity, timestamp, IP/device audit only if approved, expiration and revocation mechanism.
- Downloadable copies and a visible “what changes if I revoke?” explanation.
- Interpreter/accessibility support and teach-back for the material service boundaries.
- Prohibit prechecked boxes and dark patterns.
- Counsel-approved mapping from every collected data element and onward disclosure to a lawful basis.

### Why a dual records-request path

The patient-directed access request and HIPAA authorization are not synonyms. The former can require a covered entity to provide records to a named third party within HIPAA’s access framework; the latter permits a disclosure initiated by the third party and has different elements, timeliness and fee consequences [E14–E15]. A facility may operationally prefer one form. The MVP should generate both from the same patient selections and send the appropriate source-specific package after Dan confirms the strategy.

## Patient information and record specification

### Patient-provided structured information

- Legal name, aliases/maiden name, date of birth, address and identity-verification fields.
- Current location/state at consultation; preferred language, interpreter and accessibility needs.
- Emergency contact and optional caregiver/representative authority.
- Cancer type, known diagnosis, date, stage if known and current status.
- Current oncologist, surgeon, radiation oncologist, PCP and major consulting centers.
- Facilities/labs/imaging centers holding records and approximate date ranges.
- Current treatment or planned treatment and relevant decision date.
- Current medications, supplements, allergies and recent changes.
- Three priority questions; goals, values and tradeoffs that matter.
- Family history and prior germline testing at the minimum needed for an appropriate genetics referral screen.

### Requested clinical record types

- Pathology reports, amendments and synoptic reports.
- Imaging reports and impressions; raw images are out of standard V0 scope.
- Oncology clinic notes, H&P, progress notes and formal second-opinion notes.
- Tumor-board summaries where available.
- Operative reports and procedure notes.
- Systemic therapy orders/summary, regimen, dates, dose changes, response and documented toxicity.
- Radiation consultation, plan summary and completion record.
- Relevant laboratory results and trends; current CBC/CMP and tumor markers where clinically applicable.
- Molecular/biomarker reports: tumor NGS report, variants, MSI/MMR, TMB, HRD, PD-L1/IHC and other disease-specific biomarkers.
- Germline genetic test report and counseling note if previously completed.
- Discharge summaries when relevant, but never as the only source for a complex case.
- Current medication/allergy list, comorbidities, performance status and recent physical-exam assessment.
- Current treatment plan, referrals and clinical-trial discussions.

MD Anderson’s intake categories support this breadth [E6], while the team explicitly identified recent labs and a head-to-toe physical assessment as required inputs [I2].

### Record metadata stored for every document

- Case ID; source organization and source clinician.
- Document type, authored date, service date range and received timestamp.
- Original filename retained in the secure system; privacy-safe normalized display name.
- Page count and checksum.
- Request batch and authorization version.
- Patient identity match status and reviewer.
- OCR status and human-verification status.
- Superseded/amended relationship.

### Out of scope for standard V0

- Raw DICOM imaging and independent image interpretation.
- Pathology slides/blocks and independent pathology diagnosis.
- Raw sequencer signals or unvalidated research files.
- Continuous monitoring data.
- Provider portal credential sharing by the patient.

If a question cannot be answered without an out-of-scope artifact, the case pauses or converts to a separately scoped clinical service.

## Completeness gate and case lock

### Minimum viable case

All cases require:

- identity match;
- documented diagnosis and disease site;
- current stage/status or an explicit statement that it is unresolved;
- pathology report where tissue diagnosis exists;
- most recent relevant imaging report;
- most recent oncology note and current treatment/plan;
- treatment history to date;
- current medications/allergies;
- recent clinically relevant labs and recent clinical assessment;
- molecular/biomarker reports when the requested answer depends on them;
- patient’s three questions and decision timeline; and
- verified treating-provider recipient.

### Gate outcomes

- **Complete:** sufficient for all approved questions; packet locks.
- **Complete with explicit limitation:** a missing item does not prevent a bounded answer; clinician documents why.
- **Narrow scope:** patient chooses a smaller answerable question.
- **Hold:** material source is still obtainable; continue retrieval.
- **Unable to review safely:** refund/cancellation policy applies; provide a clear explanation and alternative.

### Case-lock rules

- Report displays data cutoff, packet version and document count.
- No silent additions after clinical review starts.
- A factual correction before sign-off reopens the case and increments the packet version.
- New records after sign-off result in an addendum only if the clinical reviewer judges that they do not require a full re-review; otherwise create a new review.
- Every addendum states what changed, why and whether recommendations changed.

## Analysis and clinical-review model

### Structured synthesis pipeline

1. Preserve and checksum originals.
2. Classify documents and extract structured metadata.
3. Build a source-linked timeline.
4. Normalize diagnoses, therapies, tests and dates without overwriting source language.
5. Identify contradictions, missing dependencies and stale information.
6. Build an evidence table for each patient question.
7. Draft a neutral comparison to the current plan.
8. Run optional mechanism reasoning only for eligible data.
9. Clinician independently reviews source records, evidence, uncertainty and draft.
10. Produce the report and run clinical/editorial/legal-scope QA.

### Evidence object

Every material finding should carry:

- statement;
- type: source fact, normalized fact, inference or recommendation;
- source document, author/facility, date and page/section;
- confidence and uncertainty reason;
- clinical relevance to a patient question;
- evidence/guideline citation where applicable;
- reviewer and review timestamp.

### RNA-to-driver mechanism reasoner controls

- Define the intended use in one sentence before development.
- Keep output clinician-facing.
- Use only approved inputs with documented provenance and quality.
- Show intermediate reasoning, sources, uncertainty and alternative mechanisms.
- Prevent single-output directives; frame ranked considerations with the basis.
- Require independent review of underlying reports and source evidence.
- Log model/version, knowledge cutoff, inputs and reviewer disposition.
- Prohibit direct insertion into a patient report without clinician acceptance.
- Validate against a curated set before use and monitor override/error patterns.
- Obtain Dan’s regulatory assessment. FDA’s current guidance specifically notes that software analyzing NGS patterns or their clinical implications may remain a device function [E26].

## One PDF for patient and provider

### Layered report architecture

**Pages 1–2: patient action summary**

1. Title, case ID, patient identity, reviewer, version and data cutoff.
2. “How to use this report” and emergency/scope boundary.
3. Three answers in plain language.
4. What aligns with the current plan.
5. What to discuss or clarify.
6. Next actions with owner and timing.
7. Missing records/limitations that materially affect interpretation.

**Clinical detail**

8. Patient goals, values and exact questions.
9. Concise medical timeline.
10. Diagnosis, stage/status and evidence.
11. Treatment history and current plan.
12. Testing and biomarker inventory.
13. Findings and reasoning trace: evidence → interpretation → uncertainty → recommendation.
14. Personalized testing considerations, each labeled “recommended,” “consider,” “not currently indicated,” or “insufficient information,” with why.
15. Treatment/clinical-trial discussion points within approved scope.
16. Hereditary-risk screen and referral rationale, clearly separating tumor from germline testing.
17. Provider action/request block and urgency class.
18. Records reviewed, missing records, methods, references, reviewer attestation and version history.

### Required report language

- “This opinion is based on records available through [date] and does not include a physical examination.”
- “Your treating clinician remains responsible for diagnosis, orders and treatment decisions.”
- “Do not start, stop or change treatment based only on this report.”
- “Recommendations may change as new records, test results or evidence become available.”
- “This service is not emergency care.”

The MSK sample report uses the same core concepts: named expert, patient history, question-and-answer structure, recommendations, remote-review limitation and treating-physician primacy [E5].

### Tone and liability controls

- Describe discrepancies without blame: “The available records support two reasonable interpretations…”
- Never write “missed,” “failed” or “should have known” unless counsel approves a fact-specific need.
- Distinguish confirmation from no value. Reassurance that the current plan is reasonable is an explicit outcome [E1–E2].
- Quantify only with source and context; avoid unsupported individualized prognosis.
- Date guidelines and evidence searches because oncology information changes quickly.

### QA sequence

1. Scott drafts the content/template.
2. Jake performs clinical QA and “sniff test.”
3. Dan reviews scope, disclosure, liability and legal consistency.
4. The case’s named clinician signs the individual report.
5. Operations verifies identity, recipient, version and secure delivery.

Template approval does not replace case-specific clinician sign-off.

## Consultation and provider-to-provider flow

### Patient consultation agenda (45–60 minutes)

| Time | Activity | Why |
|---|---|---|
| 0–5 min | Verify identity, location, consent, preferred level of detail and caregiver presence | Licensure, privacy and preference check |
| 5–12 min | State the three headline conclusions | Reduce cognitive load; orient to the decision |
| 12–30 min | Answer the three patient questions using the report | Keep the session relevant and bounded |
| 30–40 min | Explain agreements, differences, uncertainty and missing information | Prevent false certainty or blame |
| 40–50 min | Review next actions, owners and timing | Convert information into an executable plan |
| 50–55 min | Teach-back | Confirm that the explanation was clear [E9–E11] |
| 55–60 min | Confirm provider handoff, follow-up and urgent-care boundaries | Close the loop and reinforce safety |

The consultant documents the patient’s teach-back, unresolved questions and agreed next steps. A patient-facing recap is sent within one business day and becomes part of the case record.

### Provider channel selection

At intake, capture the provider’s practice type and preferred route. Do not assume that one channel works for all practices.

- **Small practice:** verified secure fax may be the operational reality. Use a cover sheet, validated destination, page reconciliation and delivery confirmation.
- **Large system:** Direct secure messaging, EMR referral/inbox, provider portal or approved distribution list may be preferred.
- **Known relationship:** named clinician-to-clinician call for time-sensitive issues.
- **Never:** ordinary email attachment, unverified fax number, patient-supplied shared login, or a public link.

### Handoff package

- Same final PDF version received by the patient.
- Cover note with case ID, patient identity, data cutoff, reviewer, callback route and urgency.
- One-sentence requested action: “For information,” “Please discuss at the next appointment,” or “Time-sensitive clinician response requested by [date/time].”
- Clear statement of whether Total Health is available for a provider clarification call.

### Closed-loop acknowledgement

- Routine report: confirm technical delivery; ask for acknowledgement within three business days when follow-up is requested.
- Time-sensitive finding: licensed clinician calls the treating team; acknowledgement target within one business day or sooner under the clinical escalation policy.
- Failed delivery: verify destination, use secondary approved route, notify the patient without exposing PHI, and escalate internally.
- Two unsuccessful urgent contact attempts: use the approved alternate clinician/on-call escalation path and document all attempts.

The exact urgency categories and contact intervals require clinical and legal approval. “Urgent” must not be an informal product label.

## Hereditary-cancer referral channel

The secondary-consult product can create a clinically grounded referral path into hereditary-cancer services, but it should not treat genetics as a generic upsell.

### Referral trigger

Flag for clinician/genetics review when the record shows one or more of:

- known pathogenic/likely pathogenic germline result;
- tumor result that may indicate a germline finding;
- cancer type, age at diagnosis, multiple primaries or family pattern that meets the approved criteria;
- incomplete prior DTC or limited-variant testing;
- clinician concern documented in the source record; or
- an affected family member for whom testing could clarify risk in the family.

### Referral experience

1. Explain the difference between tumor and inherited testing.
2. State why a genetics evaluation may be relevant; do not imply that the patient has a hereditary syndrome.
3. Offer a genetics counseling appointment or qualified clinician review.
4. Use a separate testing consent that covers benefits, limits, possible results, family implications and privacy.
5. When appropriate, begin with the affected person; NCI notes that this often provides the most informative path [E32].
6. After a clinically confirmed result, offer a family communication/cascade-testing pathway with the patient’s permission.

### Advertising boundary

Do not claim that the secondary consult “finds hereditary cancer” or that DTC testing rules out inherited risk. FDA notes that DTC tests may cover only selected variants and should not substitute for clinical evaluation [E33].

## PHI architecture for V0

### Recommended separation of systems

**Zone A — Public marketing**

- Static/public website and fit checker.
- Minimum contact and general availability fields only.
- No detailed medical free text, document upload or authenticated status.
- No health-data retargeting. Avoid third-party pixels/session replay and document any first-party analytics.

**Zone B — Authenticated intake**

- Identity verification, consent, patient questions, provider/facility list and secure upload.
- BAA-capable vendors where required; encryption in transit/at rest, unique user identities and MFA.
- Role-based access and audit logs.

**Zone C — Case workspace**

- Originals, manifest, normalized data and provenance.
- Case ID in filenames and task trackers; no PHI in Notion, Slack, GitHub issues or ordinary email.
- Least-privilege care-team access, access reviews and export controls.

**Zone D — Clinical analysis**

- Approved models/tools only, under the required contracts and configurations.
- No PHI copied into unapproved consumer AI tools.
- Model/version and access logging; human verification of extracted facts.

**Zone E — Delivery and archive**

- Authenticated portal, Direct/approved fax or verified provider channel.
- Versioned artifact, delivery log and acknowledgement.
- Retention, legal hold, patient access, amendment, export and deletion processes.

### Interim Google Workspace decision

The Granola notes proposed a Drive folder per patient while a fuller system is built [I2]. Google Drive can be part of a HIPAA program only under the applicable BAA and compliant configuration; no product is inherently “HIPAA certified” [E16, E23–E24]. If counsel/security approve Drive as an interim V0 workspace, require all of the following:

- Total Health domain with accepted Google Workspace BAA; never a personal account.
- Shared Drive, not an employee’s My Drive.
- Unique case-ID folder; no diagnosis or full name in folder/file titles when avoidable.
- Named-user access, least privilege, MFA and prompt deprovisioning.
- External sharing disabled by default; no “anyone with link.”
- Audit logs, DLP/configuration monitoring and periodic access review.
- Approved local-device controls, download policy and backups.
- Documented retention, deletion, legal hold and patient export.
- Approved ingestion route from secure fax/scan; no email forwarding.
- Security risk analysis that covers every system that creates, receives, maintains or transmits ePHI [E17–E18].

If any condition is missing, Drive is a launch blocker, not a temporary exception.

### Fax and paper SOP

- Use a dedicated, BAA-capable digital fax service or approved physical workflow.
- Verify fax number from an authoritative source or live call; do not rely on an old contact sheet.
- Use minimum-necessary, source-specific requests and a privacy cover sheet.
- Reconcile expected and received pages; investigate partial/misdirected transmissions.
- Scan paper into the correct case, conduct a second-person identity check, and place originals in a locked bin.
- Destroy paper through an approved method/vendor so PHI is unreadable and unreconstructable; document the schedule [E20].

### Baseline security controls

- Security/privacy officials and a written risk analysis.
- BAAs and subcontractor inventory.
- Unique accounts, MFA, role-based access and automatic deprovisioning.
- Encryption in transit and at rest with managed keys.
- Audit logs and regular activity review.
- Endpoint management, screen-lock, patching, malware protection and remote wipe.
- Incident detection, response, breach assessment and notification playbooks.
- Backup, recovery testing and business continuity.
- Data inventory, retention schedule, disposal and legal hold.
- Training, sanctions and annual tabletop exercises.
- Secure development, test-data de-identification and change control.

HHS requires appropriate administrative, physical and technical safeguards and an ongoing, enterprise-wide risk analysis [E17]; NIST SP 800-66 Rev. 2 provides a practical mapping [E18].

## Exception playbooks

### Emergency or acute deterioration

- Stop the product flow.
- Direct the patient to 911/local emergency services or the treating team using approved language.
- Do not provide an automated clinical assessment.
- Document the redirect without creating a false monitoring duty.

### Treatment begins before review

- Ask whether the question remains relevant.
- Do not advise delay.
- Clinician decides: continue bounded review, reprioritize, or cancel.
- Update current treatment status and packet version.

### Records not received

- Show request status and follow-up dates.
- Use patient-directed access request, portal export or patient pickup as approved alternatives.
- At a defined decision point, offer wait, narrow scope, proceed with clinician-approved limitation or cancel.
- Never silently write “records complete.”

### Record belongs to another patient

- Quarantine immediately; prevent analysis.
- Notify privacy/security lead and follow incident playbook.
- Correct the source request and document containment.

### New material after case lock

- Coordinator triages; clinician decides whether to reopen.
- Increment packet/report version and disclose the new data cutoff.
- If signed report is affected, issue an addendum or replacement and notify all recipients.

### Unsupported or conflicting AI output

- Do not expose to patient/provider.
- Flag for clinician/data review, record reason, and add to quality set.
- No recommendation survives without source trace and clinician acceptance.

### Time-sensitive finding

- Licensed reviewer assigns urgency using approved criteria.
- Direct clinician-to-clinician contact and documented acknowledgement.
- Patient receives a clear, non-alarmist explanation consistent with the provider handoff.
- If provider cannot be reached, follow the preapproved alternate/escalation path.

### Patient does not want provider delivery

- Explain why provider coordination is part of the product and the treating clinician directs care.
- Determine whether the service can proceed under the approved scope and state law.
- Do not improvise; route to clinical/legal review.

## Service levels and patient communications

### Proposed pilot service levels

- Fit check response: immediate automated outcome or one business day for manual review.
- Coordinator contact: one business day after eligibility.
- Record requests sent: one business day after complete authorization/source information.
- Retrieval status update: at least every two business days while material items are outstanding.
- Target record-collection window: up to 14 calendar days for typical cases; disclose that HIPAA allows up to 30 days for an access request and some facilities take longer [E14].
- Report target: seven to ten business days after clinical completeness and packet lock.
- Consultation: within three business days after sign-off, subject to patient/reviewer availability.
- Patient recap: one business day after consultation.
- Routine provider delivery confirmation: same business day as authorized release.

These are proposed targets, not public guarantees, until measured in the first 3–5 cases. Dana-Farber and Cleveland Clinic benchmarks support a two-to-four-week total journey depending on record collection and expert review [E3–E4].

### Status language

Use patient-centered milestones:

- We received your authorization.
- We requested records from 3 of 3 locations.
- We received 2 of 3 record sets.
- We are reviewing whether the case is complete.
- Your case is ready for expert review; delivery target is [date].
- Your report passed clinical review.
- Your consultation is scheduled.
- Your report was sent to Dr. [name] through [secure route].

Avoid ambiguous labels such as “processing,” “AI analysis” or “almost done.”

## Pilot metrics and quality dashboard

### Funnel and experience

- Landing-page visit → fit check → eligible → consent → records complete → report → consultation.
- Drop-off by step, cohort, device, language and accessibility need.
- Patient minutes spent in intake and number of coordinator contacts.
- Clarity/understanding score and teach-back completion.
- Patient confidence and satisfaction without implying clinical benefit.

### Operations

- Days from authorization to first request.
- Days to first/complete record receipt by source type.
- Number of sources, pages and coordinator touches per case.
- Missing-record and partial-review rates.
- Days from packet lock to clinician sign-off and consultation.
- Secure-delivery success and provider acknowledgement.

### Clinical and report quality

- Facts corrected by clinician per case.
- Unsupported citation/finding rate.
- AI recommendation acceptance, modification and rejection rate.
- Report QA defects by severity.
- Cases with confirmed plan, changed discussion point or insufficient information—without marketing these pilot observations as outcomes.
- Addenda and causes.
- Time-sensitive findings and acknowledgement performance.

### Privacy and compliance

- Authorization completeness and versioning.
- PHI found in unapproved systems.
- Misrouted records, wrong-patient events and failed identity checks.
- Access-log review findings, vendor/BAA exceptions and incidents.
- Tracking technology and data-disclosure audits.

### Unit economics

- Coordinator hours, clinician hours and total cost per case.
- Cost by cohort and source count.
- Price/collection, refund and cancellation rate.
- Gross margin and capacity by reviewer specialty.

### Pilot go/no-go guardrails

For the first 3–5 cases, treat these as hard gates:

- 100% valid authorization/access-request package before record retrieval.
- 100% named coordinator, clinical reviewer, case version and data cutoff.
- 100% source trace for material findings and clinician acceptance of final recommendations.
- 100% secure patient/provider delivery logging; time-sensitive cases require documented acknowledgement.
- Zero known PHI use in unapproved systems and zero unresolved wrong-patient events.
- Zero reports released outside approved clinical/geographic scope.

Treat turnaround, patient effort, clarity and economics as learning metrics first. Set aggressive public SLAs only after actual pilot distributions are known.

## V0 product specification

### Public landing page

**Goal:** explain the service and start a privacy-minimal fit check.

**Sections**

1. Hero: “A clearer view of your cancer records.”
2. Subhead: “A specialist-reviewed secondary consultation that organizes your records, answers your top questions, and gives you and your care team one clear report.”
3. Trust strip: coordinator-led retrieval; clinician-reviewed; one shared report.
4. What it is / is not.
5. Six-step patient journey.
6. Report preview with patient summary and clinician detail layers.
7. Eligibility and safety boundaries.
8. Timeline and price disclosure when approved.
9. Privacy promise and no-emergency statement.
10. FAQ and “Check fit” CTA.

**Claims guardrails**

- Say “may confirm or identify discussion points,” not “will find what others missed.”
- Do not quote outcome-change percentages as Total Health performance.
- Do not imply hospital affiliations beyond exact approved relationships.
- Do not imply a viewer has cancer or use sensitive-personal-attribute ad phrasing.
- Substantiate every objective health/service claim before publication [E29].

### Protected intake and case dashboard

- Stepper with save/resume.
- Consent document center and audit trail.
- Facility/provider directory and source-specific request generator.
- Three-question builder with examples.
- Record tracker and missing-item explanation.
- Patient verification of timeline, medications/allergies and current plan.
- Packet-lock confirmation.
- Status timeline with exact owner and next action.
- Report viewer/download, consultation scheduling and provider delivery status.
- Accessibility: keyboard, screen-reader labels, contrast, 200% zoom, language/interpreter flags.

### Prototype boundary

The delivered prototype is demonstrative only. It must display: **“Prototype—do not enter real patient information. Nothing is transmitted or saved.”** It can use sample data and local interaction but cannot act as an intake system.

## Acquisition and ad concept

### Safe campaign hypothesis

The strongest initial angle is **clarity from fragmented records**, not fear, diagnosis change or treatment discovery.

**Primary audience:** adults or caregivers actively comparing options after a cancer diagnosis, with an established treating team and multiple record sources. Platform targeting and creative must avoid inferring or disclosing sensitive health status.

**Core message:** “One specialist-reviewed report for you and your care team.”

**Supporting proof:** coordinator-led record gathering; source-traceable synthesis; treating-clinician coordination. Do not claim outcomes before Total Health has substantiation.

**CTA:** “See how the review works” or “Check whether it fits.”

### Three creative angles

1. **Scattered → structured.** Visual of fragmented record pages resolving into a single clean report. Copy: “When records are scattered, clarity matters.”
2. **Three questions. One review.** Visual of three patient questions connected to an evidence graph. Copy: “Bring the questions that matter most.”
3. **Same report, shared conversation.** Patient and clinician each viewing the same document. Copy: “One report for you and your care team.”

### Prohibited creative patterns

- “Do you have cancer?” or copy that asserts a viewer’s diagnosis.
- “Your doctor missed something.”
- Guaranteed changed treatment, better outcomes, cure, survival or access to a specific therapy.
- Urgency/scarcity that pressures a medical decision.
- Before/after outcomes or unverified testimonials.
- Retargeting based on cancer-page/intake behavior or uploading lead health data to ad platforms.

## Launch dependency map

### Blockers before the first real patient

**Clinical**

- Approved scope, eligibility/exclusion and urgency rules.
- Licensed, insured clinician reviewer and consultation model for each state.
- Raw imaging/pathology and physical-exam boundary.
- Minimum-case and partial-review policy.
- Clinical evidence sources and update cadence.
- RNA reasoner intended use, validation and regulatory assessment.

**Legal/privacy**

- Entity/clinical relationship and HIPAA/BA role analysis.
- Service, telehealth, authorization/access, caregiver and report-release documents.
- State-specific consent/licensure analysis.
- Part 2 and other specially protected data.
- BAAs, privacy notice, consumer-health-data/HBNR analysis and incident plan.
- Payment/refund and malpractice coverage.

**Operations**

- Named coordinator, records SOP and provider route verification.
- Approved fax/scan/disposal workflow.
- Case ID, manifest, version and addendum process.
- Provider urgency/acknowledgement workflow.
- Service recovery and complaint handling.

**Technology/security**

- Approved PHI architecture, risk analysis and vendor inventory.
- Authenticated intake, MFA, RBAC, logs, encryption, backups and retention.
- No PHI in prototype, Notion, Slack, GitHub or ordinary email.
- Secure patient/provider delivery and audit evidence.
- Tracking/pixel review.

**Content**

- One-PDF template: Scott → Jake → Dan.
- Plain-language patient copy and teach-back script.
- Landing-page claim substantiation and approval.
- Price/timeline wording and FAQ.

## Recommended 30-day execution plan

### Week 1 — Lock scope and artifacts

- Eric circulates this flow and resolves tier naming.
- Scott drafts the layered PDF skeleton using a post-cancer-center sample case.
- Farhan produces required/optional data dictionary and reasoner intended-use statement.
- Eric and Dan create the consent/records-release matrix.
- Mohit and Jake map provider channels, acknowledgement and urgency paths.
- Security confirms or rejects the interim Google Workspace architecture.

**Exit:** approved product contract, draft report, data list, consent matrix, provider-flow diagram and system decision.

### Week 2 — Build and tabletop

- Configure no-PHI prototype and case tracker.
- Draft coordinator scripts, facility request templates and missing-record communications.
- Run two tabletop cases: post-center and no-center.
- Simulate wrong-patient fax, missing pathology, imminent treatment and urgent finding.
- Revise SLA, escalation and addendum policy.

**Exit:** end-to-end tabletop passes without an unowned handoff.

### Week 3 — Dry run with synthetic/de-identified cases

- Execute retrieval simulation, packet lock, synthesis, reasoner gating, report drafting, QA, patient consultation and provider handoff.
- Measure coordinator/clinician time and defect rates.
- Conduct privacy/security review and restore/incident test.
- Finalize patient and provider communications.

**Exit:** signed launch checklist and zero critical defects.

### Week 4 — First 1–2 controlled patients

- Enroll only cases matching the narrowest approved criteria.
- Daily cross-functional case huddle without copying PHI into collaboration tools.
- Same-day review of every defect, delay or ambiguity.
- Do not expand acquisition until both cases close safely.

**Exit:** case retrospective, revised SOPs and decision on next 3 patients.

## Rationale register

| Decision | Choice | Rationale / evidence | Risk if wrong | Validation |
|---|---|---|---|---|
| Canonical name | Tier 2 Secondary Consult | Notion/Google are assignment sources [I1, I3] | Team/customer confusion | Resolve portfolio taxonomy |
| First cohort | Post-cancer-center | Harder case forces differentiation [I2] | Product may feel duplicative | 3–5 interviews/tabletops |
| Records | Coordinator-led; upload optional | Internal drop-off concern and benchmark programs [I2, E3–E4] | High operational cost | Time/touch metrics |
| Questions | Up to three | Established benchmark and cognitive focus [E3, E12] | Complex cases need more | Add overflow parking lot |
| Completeness | Clinician-owned hard gate | Prevents unsupported review [E3, E5] | Delays and cancellations | Measure missing-item causes |
| Packet lock | Freeze at review start | Version consistency and auditability | New critical data arrives | Reopen/addendum SOP |
| Raw imaging | Out of standard V0 | Team scope and regulatory/ops complexity [I2, E26] | Missed value in image-dependent cases | Separate service later |
| Report count | One PDF, layered | Team requirement and shared decision artifact [I1–I2] | Too dense for patient | Usability test pages 1–2 |
| Report release | Preference-sensitive around consultation | Reduces uncontextualized distress [E11] | Delay in access or action | Counsel/clinical review |
| Treating clinician | Remains decision-maker | Remote-review boundary and coordination [E1, E5] | Patient acts independently | Repeat in consent/report/visit |
| Provider delivery | Verified secure route + closed loop | Care cannot depend on patient forwarding [I2] | Provider overload/no ack | Pilot acknowledgement rates |
| RNA reasoner | Clinician-facing gated output | FDA CDS boundary [E26] | Device/regulatory and safety risk | Intended-use review/validation |
| Google Drive | Conditional interim only | BAA + configuration + risk analysis [E16, E23–E24] | Data exposure/noncompliance | Security approval and audit |
| Public intake | Minimal, separate from PHI portal | HHS/FTC tracking risks [E27–E30] | Lower lead qualification | Test conversion vs minimization |
| Genetics referral | Clinically triggered, separate consent | NCI/FDA limitations [E32–E33] | Fear or inappropriate upsell | Genetics QA/referral yield |
| SLA start | At clinical completeness | Records are the variable path [E3] | Customer perceives delay | Publish two clocks clearly |

## Open decisions for named owners

### Eric + Dan

- Is Total Health acting as a covered provider, business associate, independent provider/service or another role in each flow?
- Which records-request mechanism is primary by facility and state?
- Which special data categories require separate language?
- May the service proceed without provider delivery?
- What report-release timing and urgent-finding policy are approved?

### Scott + Jake + Dan

- Exact scope statements and approved recommendation verbs.
- Patient-summary length and clinician-detail order.
- How disagreement with prior plans is worded.
- Case-specific signature/attestation and version history.

### Mohit + Jake

- Verified provider-channel directory and small/large practice variants.
- Acknowledgement definition and escalation ownership.
- Office-manager interviews and fax/EMR friction findings.

### Farhan + clinical/regulatory review

- Required/optional data fields by cancer type and question.
- RNA reasoner intended use, input/output and prohibited use.
- Independent-basis display and validation set.

### Security/IT + Dan

- Approved system of record and BAA inventory.
- Access, audit, retention, incident and backup controls.
- Decision on Google Workspace interim architecture.
- Tracking/analytics allowed on public versus authenticated surfaces.

## Improved master prompt for continued agentic work

The original request combines research, medical product design, operations, legal/privacy review, UX, advertising and publishing. The following prompt reduces ambiguity and creates an explicit quality loop:

> You are the product-and-operations lead for Total Health’s V0 **Tier 2 Secondary Consult** for adults with cancer. Use the August 4, 2026 Total Health Google pre-read, TH Product Sync Granola notes and assigned Notion task as primary product sources. Treat Notion/Google naming as canonical when Granola’s tier numbering conflicts. Benchmark established oncology second-opinion programs, primary peer-reviewed evidence and current official U.S. regulator guidance. Clearly separate internal decisions, external requirements, benchmarks, hypotheses and items requiring licensed legal/clinical approval.
>
> Produce: (1) a complete patient and operating-flow plan; (2) a two-page executive brief; (3) a polished, no-PHI landing-page and interactive patient-flow prototype in Total Health’s visual language; (4) privacy-safe, policy-conscious static ad concepts and Goose Ads outputs; (5) a source catalog, decision/rationale register, launch checklist and test plan; and (6) a private GitHub repository under dontdai with an auditable implementation.
>
> The patient experience must be understandable in six phases. The operating workflow must show owner, input, output/handoff, system of record, SLA, exception and launch blocker for every stage. Include two cohorts (already visited a major cancer center versus not), coordinator-led record retrieval, consent/access-request strategy, record specification, completeness gate, packet lock/versioning, clinician-gated RNA reasoner, one layered patient/provider PDF, consultation with teach-back, closed-loop provider delivery, hereditary-cancer referral, PHI architecture and pilot metrics.
>
> Do not make medical-outcome promises, imply prior clinicians failed, expose a model recommendation directly to a patient, collect real PHI in the prototype, use health-data retargeting, or treat a vendor/BAA as sufficient for HIPAA compliance. Mark every legal, licensure, regulatory and clinical-policy conclusion that needs Dan or a licensed reviewer. Keep the treating clinician responsible for care.
>
> Use an iterative quality loop: source inventory → contradiction log → patient journey → operating swimlane → failure-mode review → legal/privacy/regulatory audit → report/UX/ad consistency audit → accessibility and plain-language audit → prototype functional/visual test → final gap list. Continue until there are no unowned handoffs, no unsupported public claims and no critical launch blocker presented as complete.

## Research limitations

- This is a national V0 architecture, not a 50-state legal survey. State medical, telehealth, privacy, genetic-testing and consent rules require counsel review.
- FDA guidance is nonbinding and intended-use analysis is fact-specific. The RNA reasoner needs a dedicated regulatory assessment.
- HIPAA applicability depends on Total Health’s exact entity and relationship; FTC/state consumer-health rules may apply even where HIPAA does not.
- Second-opinion evidence is heterogeneous and often single-center/retrospective. The 2023 MSK study supports the value hypothesis but not a Total Health outcome claim [E2].
- Competitor timelines and pricing are benchmarks, not service promises.
- The prototype is intentionally no-PHI and is not a production technical architecture.

## Source notes

The complete, linked source catalog accompanies this report. Key internal sources are the Total Health Google pre-read [I1], August 4 Granola notes [I2], Notion assignment [I3] and public site [I4]. Key external references include NCI [E1, E11–E12, E32], the 2023 Cancer Medicine second-opinion study [E2], Dana-Farber/AccessHope [E3], Cleveland Clinic [E4], MSK’s sample report [E5], MD Anderson’s intake categories [E6], AHRQ [E9–E10], HHS/ONC/NIST privacy and security guidance [E13–E25], FDA’s 2026 CDS guidance [E26], HHS/FTC digital-health guidance [E27–E30], HHS telehealth licensure [E31] and FDA DTC testing guidance [E33].
