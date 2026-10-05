export const EVIDENCE = [
  {
    id: "A",
    title: "Illustrative randomized trial A",
    population: "university students",
    horizon: "short-term",
    outcome: "writing score",
    direction: "positive",
    excerpt: "The intervention group showed a higher post-course writing score than the control group."
  },
  {
    id: "B",
    title: "Illustrative randomized trial B",
    population: "university students",
    horizon: "short-term",
    outcome: "writing score",
    direction: "positive",
    excerpt: "Students receiving structured peer feedback improved more on the immediate writing assessment."
  },
  {
    id: "C",
    title: "Illustrative randomized trial C",
    population: "university students",
    horizon: "short-term",
    outcome: "writing score",
    direction: "null",
    excerpt: "The between-group difference on the post-course writing score was not statistically distinguishable from zero."
  }
];

export const SCENARIOS = {
  supported: {
    version: "v1",
    text: "Two of three reviewed randomized trials reported short-term improvements in writing scores among university students.",
    semantics: {
      population: "university students",
      horizon: "short-term",
      outcome: "writing score",
      quantifier: { kind: "exact-count", supports: 2, total: 3 }
    }
  },
  overstated: {
    version: "v2",
    text: "All three reviewed randomized trials reported short-term improvements in writing scores among university students.",
    semantics: {
      population: "university students",
      horizon: "short-term",
      outcome: "writing score",
      quantifier: { kind: "all", total: 3 }
    }
  },
  unsupported: {
    version: "v3",
    text: "Two of three reviewed randomized trials reported long-term improvements in writing scores among university students.",
    semantics: {
      population: "university students",
      horizon: "long-term",
      outcome: "writing score",
      quantifier: { kind: "exact-count", supports: 2, total: 3 }
    }
  }
};

export function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonicalJson(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function semanticScopeMatch(source, semantics) {
  return source.population === semantics.population &&
    source.horizon === semantics.horizon &&
    source.outcome === semantics.outcome;
}
