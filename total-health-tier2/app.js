(() => {
  "use strict";

  const form = document.querySelector("#flow-form");
  if (!form) return;

  const steps = Array.from(document.querySelectorAll(".flow-step"));
  const progress = Array.from(document.querySelectorAll("[data-progress]"));
  const nextButton = document.querySelector("#next-step");
  const backButton = document.querySelector("#back-step");
  const actions = document.querySelector("#flow-actions");
  const counter = document.querySelector("#step-counter");
  const validationMessage = document.querySelector("#validation-message");
  const questionInputs = Array.from(document.querySelectorAll('input[name="questions"]'));
  const sourceInputs = Array.from(document.querySelectorAll('input[name="sources"]'));
  const restartButton = document.querySelector("#restart-flow");
  let currentStep = 1;

  const radioValue = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "";
  const checkedValues = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);

  const showMessage = (message) => {
    validationMessage.textContent = message;
    if (message) validationMessage.focus?.();
  };

  const validateStep = () => {
    showMessage("");
    if (currentStep === 1) {
      if (!radioValue("adult") || !radioValue("setting") || !radioValue("diagnosis") || !form.elements.state.value) {
        showMessage("Choose one sample answer for each fit question.");
        return false;
      }
    }
    if (currentStep === 2 && (!radioValue("cohort") || !radioValue("timing"))) {
      showMessage("Choose a sample care context and decision timeline.");
      return false;
    }
    if (currentStep === 3 && checkedValues("questions").length === 0) {
      showMessage("Choose at least one sample question.");
      return false;
    }
    if (currentStep === 4 && checkedValues("sources").length === 0) {
      showMessage("Choose at least one generic sample record source.");
      return false;
    }
    if (currentStep === 5) {
      const required = ["service", "records"];
      const selected = checkedValues("permissions");
      if (!required.every((item) => selected.includes(item))) {
        showMessage("Select the two required sample permission controls.");
        return false;
      }
    }
    return true;
  };

  const updateProgress = () => {
    steps.forEach((step) => step.classList.toggle("active", Number(step.dataset.step) === currentStep));
    progress.forEach((item) => {
      const index = Number(item.dataset.progress);
      item.classList.toggle("active", index === currentStep);
      item.classList.toggle("complete", index < currentStep);
      item.setAttribute("aria-current", index === currentStep ? "step" : "false");
    });
    counter.textContent = `STEP ${currentStep} OF 6`;
    backButton.disabled = currentStep === 1;
    nextButton.textContent = currentStep === 5 ? "Build sample pathway" : "Continue";
    actions.hidden = currentStep === 6;
    showMessage("");
    document.querySelector("#flow-main").scrollIntoView({ behavior: "smooth", block: "start" });
    steps[currentStep - 1].querySelector("h1")?.focus?.({ preventScroll: true });
  };

  const recordPlan = () => {
    const cohort = radioValue("cohort");
    const selected = checkedValues("sources");
    const list = [
      "Pathology report and amendments",
      "Most recent imaging report",
      "Current oncology note and treatment plan",
      "Treatment history, medications, allergies, and recent labs",
      "Relevant molecular or biomarker reports"
    ];
    if (cohort === "post-center") list.unshift("Formal major-center opinion and tumor-board summary, where available");
    if (cohort === "no-center") list.unshift("Broader diagnostic and staging record from every treating facility");
    if (selected.includes("hospital")) list.push("Operative and procedure notes");
    if (selected.includes("molecular")) list.push("Original tumor and/or germline laboratory report—not a portal summary");
    if (selected.includes("imaging")) list.push("Radiology report impressions; raw image review remains outside standard V0");
    const target = document.querySelector("#records-list");
    target.innerHTML = "";
    list.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  };

  const summarize = () => {
    const adult = radioValue("adult");
    const setting = radioValue("setting");
    const diagnosis = radioValue("diagnosis");
    const state = form.elements.state.value;
    const cohort = radioValue("cohort");
    const timing = radioValue("timing");
    const questions = checkedValues("questions");
    const sources = checkedValues("sources");
    const result = document.querySelector("#fit-result");
    const title = result.querySelector("h2");
    const note = result.querySelector("p:last-child");

    result.classList.remove("manual", "stop");
    if (adult === "no" || diagnosis === "no" || setting === "hospital" || setting === "urgent") {
      result.classList.add("stop");
      title.textContent = "Not appropriate for the standard V0";
      note.textContent = setting === "urgent"
        ? "New or worsening symptoms need the treating team or emergency care—not a record-review workflow."
        : "This sample needs a different clinical pathway or manual review before any records are requested.";
    } else if (timing === "soon" || state === "other" || cohort === "unsure") {
      result.classList.add("manual");
      title.textContent = "Manual clinical and availability review";
      note.textContent = "A coordinator would confirm licensure, reviewer availability, scope, and the treatment deadline before accepting the case.";
    } else {
      title.textContent = "Standard pilot pathway";
      note.textContent = "A coordinator and clinical reviewer would confirm final eligibility before any records are requested.";
    }

    const cohortTitle = cohort === "post-center" ? "Post-cancer-center" : cohort === "no-center" ? "No major-center opinion" : "Coordinator clarification";
    const cohortNote = cohort === "post-center"
      ? "Focus on the formal opinion, molecular/testing gaps, and what changes the next decision."
      : cohort === "no-center"
        ? "Build a broader diagnostic, staging, treatment, laboratory, and recent-assessment record."
        : "Clarify which consultations occurred before setting the request list.";
    document.querySelector("#summary-cohort").textContent = cohortTitle;
    document.querySelector("#summary-cohort-note").textContent = cohortNote;
    document.querySelector("#summary-questions").textContent = `${questions.length} selected`;
    document.querySelector("#summary-sources").textContent = `${sources.length} sample source${sources.length === 1 ? "" : "s"}`;
  };

  nextButton.addEventListener("click", () => {
    if (!validateStep()) return;
    if (currentStep === 4) recordPlan();
    if (currentStep === 5) summarize();
    currentStep = Math.min(6, currentStep + 1);
    updateProgress();
  });

  backButton.addEventListener("click", () => {
    currentStep = Math.max(1, currentStep - 1);
    updateProgress();
  });

  questionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const selected = checkedValues("questions");
      if (selected.length > 3) {
        input.checked = false;
        showMessage("Choose no more than three sample questions.");
      } else {
        showMessage("");
      }
      const count = checkedValues("questions").length;
      document.querySelector("#question-count").textContent = String(count);
      document.querySelector(".selection-note").classList.toggle("limit", count === 3);
    });
  });

  sourceInputs.forEach((input) => input.addEventListener("change", recordPlan));
  form.querySelectorAll('input[name="cohort"]').forEach((input) => input.addEventListener("change", recordPlan));

  restartButton.addEventListener("click", () => {
    form.reset();
    currentStep = 1;
    document.querySelector("#question-count").textContent = "0";
    document.querySelector(".selection-note").classList.remove("limit");
    recordPlan();
    updateProgress();
  });

  updateProgress();
})();
