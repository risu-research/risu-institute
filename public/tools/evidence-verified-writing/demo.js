(() => {
  "use strict";

  const evidence = [
    {
      id: "A",
      title: "Illustrative randomized trial A",
      population: "university students",
      horizon: "short-term",
      outcome: "writing score",
      relation: "support",
      excerpt: "The intervention group showed a higher post-course writing score than the control group.",
      note: "Supports a short-term positive effect in the stated population."
    },
    {
      id: "B",
      title: "Illustrative randomized trial B",
      population: "university students",
      horizon: "short-term",
      outcome: "writing score",
      relation: "support",
      excerpt: "Students receiving structured peer feedback improved more on the immediate writing assessment.",
      note: "Supports a short-term positive effect. No long-term follow-up is retained."
    },
    {
      id: "C",
      title: "Illustrative randomized trial C",
      population: "university students",
      horizon: "short-term",
      outcome: "writing score",
      relation: "contradiction",
      excerpt: "The between-group difference on the post-course writing score was not statistically distinguishable from zero.",
      note: "Conflicts with wording that claims a consistent positive effect across all reviewed trials."
    }
  ];

  const scenarios = {
    supported: {
      version: "v1",
      text: "Two of three reviewed randomized trials reported short-term improvements in writing scores among university students.",
      state: "verified",
      label: "VERIFIED",
      title: "Current wording is supported.",
      summary: "The wording matches the frozen evidence bundle: two trials report short-term gains and one does not.",
      action: "RETAIN CLAIM",
      human: "No mandatory human intervention for this illustrative state.",
      checks: [
        ["Population covered", "PASS", "pass"],
        ["Outcome covered", "PASS", "pass"],
        ["Time horizon covered", "PASS", "pass"],
        ["Quantifier matches evidence", "PASS", "pass"],
        ["Contradictory evidence represented", "PASS", "pass"]
      ],
      relations: {A:"SUPPORTS",B:"SUPPORTS",C:"REPRESENTED NULL"},
      trace: [
        ["v1", "Bound", "The sentence explicitly says two of three trials, matching the retained evidence set."],
        ["Evidence", "Complete", "All three retained trial summaries are represented in the synthesis."],
        ["Decision", "Retain", "The current claim can remain without changing its evidentiary scope."]
      ]
    },
    overstated: {
      version: "v2",
      text: "Structured peer feedback consistently improves short-term writing outcomes among university students.",
      state: "review",
      label: "REVIEW REQUIRED",
      title: "The revision overstates the retained evidence.",
      summary: "The citations are unchanged, but Study C conflicts with the word “consistently.” The prior evidence binding is stale for this stronger wording.",
      action: "HUMAN REVIEW",
      human: "Revise the wording, remove the unsupported generalization, or justify a different evidence set.",
      checks: [
        ["Population covered", "PASS", "pass"],
        ["Outcome covered", "PASS", "pass"],
        ["Time horizon covered", "PASS", "pass"],
        ["Universal consistency supported", "FAIL", "fail"],
        ["Contradictory evidence represented", "PASS", "pass"]
      ],
      relations: {A:"SUPPORTS",B:"SUPPORTS",C:"CONTRADICTS"},
      trace: [
        ["v1", "Previously bound", "The earlier quantified synthesis was supportable."],
        ["v2", "Meaning changed", "The new wording strengthens the claim from two-of-three to consistent improvement."],
        ["Decision", "Escalate", "The bibliography still looks complete, but the claim-evidence relationship no longer licenses automatic completion."]
      ]
    },
    unsupported: {
      version: "v3",
      text: "Structured peer feedback improves long-term writing outcomes among university students.",
      state: "blocked",
      label: "BLOCKED",
      title: "No retained evidence covers the new time horizon.",
      summary: "The current evidence bundle contains short-term outcomes only. A citation can remain attached while the new long-term claim has no supporting evidence.",
      action: "BLOCK FINALIZATION",
      human: "Search for long-term evidence or narrow the claim back to the observed short-term horizon.",
      checks: [
        ["Population covered", "PASS", "pass"],
        ["Outcome covered", "PASS", "pass"],
        ["Time horizon covered", "FAIL", "fail"],
        ["Supporting evidence retained", "FAIL", "fail"],
        ["Contradictory evidence represented", "PASS", "pass"]
      ],
      relations: {A:"OUT OF SCOPE",B:"OUT OF SCOPE",C:"OUT OF SCOPE"},
      trace: [
        ["v1", "Previously bound", "The original sentence concerned short-term outcomes."],
        ["v3", "Scope changed", "The revised sentence introduces a long-term horizon absent from the retained evidence."],
        ["Decision", "Block", "The workflow stops until evidence for the new horizon is found or the sentence is narrowed."]
      ]
    }
  };

  let currentKey = "supported";
  let boundText = scenarios.supported.text;

  const el = id => document.getElementById(id);

  async function shortHash(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("").slice(0,16);
  }

  async function renderEvidence(relations) {
    const grid = el("evidence-grid");
    grid.innerHTML = "";
    for (const src of evidence) {
      const digest = await shortHash(src.excerpt);
      const card = document.createElement("article");
      card.className = "evw-evidence-card";
      card.innerHTML = `
        <div class="source-id">SOURCE ${src.id} · ILLUSTRATIVE</div>
        <h3>${src.title}</h3>
        <p>“${src.excerpt}”</p>
        <span class="evw-evidence-relation">${relations[src.id]}</span>
        <div class="evw-evidence-meta">
          <div><span>Population</span><code>${src.population}</code></div>
          <div><span>Horizon</span><code>${src.horizon}</code></div>
          <div><span>Outcome</span><code>${src.outcome}</code></div>
          <div><span>Excerpt SHA-256</span><code>${digest}</code></div>
        </div>`;
      grid.appendChild(card);
    }
  }

  function renderChecks(checks) {
    el("check-list").innerHTML = checks.map(([name,value,cls]) =>
      `<div class="evw-check"><span>${name}</span><b class="${cls}">${value}</b></div>`
    ).join("");
  }

  function renderTrace(trace) {
    el("revision-trace").innerHTML = trace.map(([step,status,desc]) =>
      `<div class="evw-trace-step"><span>${step}</span><strong>${status}</strong><p>${desc}</p></div>`
    ).join("");
  }

  async function renderScenario(key, markBound = true) {
    currentKey = key;
    const s = scenarios[key];
    document.querySelectorAll(".evw-scenario").forEach(btn => btn.classList.toggle("active", btn.dataset.scenario === key));
    el("claim-text").value = s.text;
    el("claim-version").textContent = s.version;
    if (markBound) {
      boundText = s.text;
      el("bound-version").textContent = s.version;
      el("binding-state").textContent = "CURRENT";
    }
    el("verdict-status").dataset.state = s.state;
    el("verdict-status").querySelector(".evw-status-label").textContent = s.label;
    el("verdict-title").textContent = s.title;
    el("verdict-summary").textContent = s.summary;
    el("workflow-action").textContent = s.action;
    el("human-action").textContent = s.human;
    renderChecks(s.checks);
    renderTrace(s.trace);
    await renderEvidence(s.relations);
  }

  function classifyText(text) {
    const t = text.toLowerCase();
    if (t.includes("long-term") || t.includes("long term")) return "unsupported";
    if (t.includes("consistently") || t.includes("all reviewed") || t.includes("always")) return "overstated";
    if (t.includes("two of three") && t.includes("short-term")) return "supported";
    return null;
  }

  async function verifyCurrentText() {
    const text = el("claim-text").value.trim();
    const mapped = classifyText(text);
    const stale = text !== boundText;
    if (!mapped) {
      el("binding-state").textContent = stale ? "STALE" : "CURRENT";
      el("verdict-status").dataset.state = "review";
      el("verdict-status").querySelector(".evw-status-label").textContent = "REVIEW REQUIRED";
      el("verdict-title").textContent = "The edited wording needs a new semantic binding.";
      el("verdict-summary").textContent = "This deterministic prototype recognizes only the three frozen claim meanings used in the demonstration. Unrecognized edits fail closed for human review.";
      el("workflow-action").textContent = "HUMAN REVIEW";
      el("human-action").textContent = "Rebind the edited sentence to a structured claim before automatic completion.";
      renderChecks([
        ["Evidence identities retained","PASS","pass"],
        ["Claim wording unchanged", stale ? "FAIL" : "PASS", stale ? "fail" : "pass"],
        ["Structured meaning recognized","FAIL","fail"],
        ["Automatic finalization allowed","FAIL","fail"]
      ]);
      renderTrace([
        ["Edit","Unrecognized","The manuscript sentence changed outside the frozen demo meanings."],
        ["Binding",stale ? "Stale" : "Current","The evidence record cannot safely infer a new claim meaning from arbitrary text."],
        ["Decision","Escalate","The prototype refuses to guess."]
      ]);
      return;
    }
    await renderScenario(mapped, false);
    el("claim-text").value = text;
    el("binding-state").textContent = stale ? "STALE → RECHECKED" : "CURRENT";
  }

  async function buildReceipt() {
    const text = el("claim-text").value.trim();
    const key = classifyText(text) || "unrecognized";
    const s = scenarios[key] || null;
    const evidenceWithDigests = [];
    for (const src of evidence) evidenceWithDigests.push({...src, excerpt_sha256: await shortHash(src.excerpt)});
    const receipt = {
      schema: "risu-evidence-verified-writing-demo/0.1",
      exported_at: new Date().toISOString(),
      prototype_boundary: "Preloaded illustrative evidence; deterministic browser logic; no live search or model inference.",
      claim: {
        id: "claim-4.2",
        text,
        recognized_scenario: key,
        binding_state: el("binding-state").textContent,
        verdict: s ? s.label : "REVIEW REQUIRED",
        workflow_action: s ? s.action : "HUMAN REVIEW"
      },
      evidence: evidenceWithDigests
    };
    const blob = new Blob([JSON.stringify(receipt,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "evidence-verified-writing-audit-receipt.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  document.querySelectorAll(".evw-scenario").forEach(btn => btn.addEventListener("click", () => renderScenario(btn.dataset.scenario)));
  el("claim-text").addEventListener("input", () => {
    if (el("claim-text").value !== boundText) el("binding-state").textContent = "STALE";
  });
  el("verify-claim").addEventListener("click", verifyCurrentText);
  el("download-receipt").addEventListener("click", buildReceipt);

  renderScenario("supported");
})();