// js/pages/aiTools.js
// Powers three self-contained widgets embedded in the Take Action page:
// News Check (rule-based, runs entirely in-browser), Mentor Matching
// (rule-based lookup + mailto request), and Interest Clustering (demo preview).
// Nothing here calls any external API or stores any data.

/* ============ NEWS CHECK ============ */
(function newsCheck() {
  const btn = document.getElementById("nc-check-btn");
  if (!btn) return;

  const SIGNALS = [
    {
      test: t => /share (this|it|before)|before it.?s too late|breaking:|act now|don.?t wait/i.test(t),
      title: "Urgency / fear-based framing",
      desc: "Pressure to act or share immediately is a common tactic to stop readers from pausing to verify."
    },
    {
      test: t => /shocking|outrageous|unbelievable|you won.?t believe|terrifying|slams?\b/i.test(t),
      title: "Emotionally charged language",
      desc: "Words designed to trigger outrage or alarm rather than convey neutral information."
    },
    {
      test: t => {
        const words = t.split(/\s+/).filter(w => w.length >= 4);
        const caps = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
        return words.length > 0 && caps.length / words.length > 0.15;
      },
      title: "Excessive capitalization",
      desc: "A high share of ALL-CAPS words is often used for emphasis in place of evidence."
    },
    {
      test: t => /!!!|\?\?\?/.test(t),
      title: "Excessive punctuation",
      desc: "Repeated exclamation or question marks are a common sensationalism marker."
    },
    {
      test: t => /\balways\b|\bnever\b|\b100%\b|everyone knows|no one is talking about|guaranteed/i.test(t),
      title: "Absolute or extreme claims",
      desc: "Real data about complex issues is rarely this absolute."
    },
    {
      test: t => /experts say|studies show|sources say|reports suggest|many believe/i.test(t),
      title: "Vague, unnamed sourcing",
      desc: "\u201cExperts say\u201d or \u201cstudies show\u201d without naming who or which study can't be checked."
    },
    {
      test: t => t.length > 200 && !/https?:\/\//i.test(t) && !/according to/i.test(t),
      title: "No link or named source",
      desc: "A longer claim with no link and no attribution is harder to verify independently."
    }
  ];

  btn.addEventListener("click", () => {
    const text = document.getElementById("nc-input").value.trim();
    const errorEl = document.getElementById("nc-error");
    const resultEl = document.getElementById("nc-result");

    if (!text) {
      errorEl.textContent = "Paste some text first.";
      errorEl.hidden = false;
      resultEl.hidden = true;
      return;
    }
    errorEl.hidden = true;

    const hits = SIGNALS.filter(s => s.test(text));
    const level = hits.length === 0 ? "low" : hits.length <= 2 ? "medium" : "high";
    const levelLabel = { low: "Low — no common red flags found", medium: "Some red flags", high: "Multiple red flags" }[level];
    const levelColor = { low: "#3E8C56", medium: "#B08900", high: "#B4232F" }[level];

    const badge = document.getElementById("nc-badge");
    badge.textContent = levelLabel;
    badge.style.background = levelColor;

    const list = document.getElementById("nc-signals");
    list.innerHTML = "";
    if (hits.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No common misinformation patterns detected — this does not confirm the claim is true, only that no obvious red flags were found.";
      list.appendChild(li);
    } else {
      hits.forEach(h => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${h.title}</strong> — ${h.desc}`;
        list.appendChild(li);
      });
    }
    resultEl.hidden = false;
  });
})();

/* ============ MENTOR MATCHING ============ */
(function mentorMatching() {
  const pillsEl = document.getElementById("mm-pills");
  if (!pillsEl) return;

  const MENTORS = {
    nadja: {
      name: "Nadja", tag: "Education",
      bio: "A Switzerland-based mentor, widely connected, currently working on opening her own school — where she plans to teach in person. She brings direct experience in education infrastructure and a network built over her career."
    },
    cesar: {
      name: "César Montemayor", tag: "Business / Finance & Corporate Governance",
      bio: "Private investor, entrepreneur, and corporate board member with a high-level track record in Monterrey's financial and education sectors. 14 years at JP Morgan, founder and long-time chairman of InverCap AFORE, independent board member of Banco Santander México, and board member of Tecnológico de Monterrey, UDEM, Tecmilenio and Museo MARCO."
    }
  };
  const MATCH_MAP = {
    education: { id: "nadja", exact: true },
    business: { id: "cesar", exact: true },
    social_impact: { id: "cesar", exact: false },
    tech: { id: "cesar", exact: false }
  };
  const AREAS = [
    { key: "education", label: "Education" },
    { key: "tech", label: "Technology / Data" },
    { key: "business", label: "Business / Entrepreneurship" },
    { key: "social_impact", label: "Social impact / NGOs" }
  ];

  let selectedArea = null;
  let currentMatch = null;

  AREAS.forEach(a => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = a.label;
    b.addEventListener("click", () => {
      selectedArea = a.key;
      pillsEl.querySelectorAll("button").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
    });
    pillsEl.appendChild(b);
  });

  document.getElementById("mm-find-btn").addEventListener("click", () => {
    const errorEl = document.getElementById("mm-error");
    const name = document.getElementById("mm-name").value.trim();
    const email = document.getElementById("mm-email").value.trim();

    if (!selectedArea) {
      errorEl.textContent = "Select an area of interest above.";
      errorEl.hidden = false;
      return;
    }
    if (!name || !email) {
      errorEl.textContent = "Please fill in your name and email.";
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;

    const match = MATCH_MAP[selectedArea];
    const mentor = MENTORS[match.id];
    currentMatch = { name, email, areaLabel: AREAS.find(a => a.key === selectedArea).label, mentor, exact: match.exact };

    const noteEl = document.getElementById("mm-fallback-note");
    noteEl.innerHTML = "";
    if (!match.exact) {
      noteEl.innerHTML = `<div class="attention-gap"><p>We don't yet have a mentor specialized in "${currentMatch.areaLabel}", but ${mentor.name} is the closest fit and can guide you.</p></div>`;
    }

    document.getElementById("mm-mentor-name").textContent = mentor.name;
    document.getElementById("mm-mentor-tag").textContent = mentor.tag;
    document.getElementById("mm-mentor-bio").textContent = mentor.bio;
    document.getElementById("mm-result").hidden = false;
  });

  document.getElementById("mm-email-btn").addEventListener("click", () => {
    if (!currentMatch) return;
    const subject = encodeURIComponent(`Mentor introduction request: ${currentMatch.name}`);
    const body = encodeURIComponent(
      `Name: ${currentMatch.name}\nEmail: ${currentMatch.email}\nArea of interest: ${currentMatch.areaLabel}\nRequested mentor: ${currentMatch.mentor.name}\n\n(Sent from the Mind the Gap Take Action page)`
    );
    window.location.href = `mailto:hello@mindthegap.org?subject=${subject}&body=${body}`;
  });
})();

/* ============ INTEREST CLUSTERING ============ */
(function interestClustering() {
  const wrap = document.getElementById("ic-pills");
  if (!wrap) return;

  const TOPICS = ["Displacement & Refugees", "Education Access", "Poverty & Basic Needs", "Health Inequality", "Climate & Displacement", "Economic Inclusion"];
  const CLUSTERS = [
    { name: "Displacement & Protection", topics: ["Displacement & Refugees", "Health Inequality"], desc: "People following crises where displacement and health risks overlap most — closest to UNHCR-style protection work." },
    { name: "Education Access", topics: ["Education Access", "Economic Inclusion"], desc: "People focused on getting kids and young adults into classrooms and skill-building — closest to school and mentorship efforts." },
    { name: "Climate & Economic Justice", topics: ["Climate & Displacement", "Economic Inclusion", "Poverty & Basic Needs"], desc: "People tracking how climate shocks and poverty compound each other across regions." }
  ];

  let selected = new Set();

  function renderPills() {
    wrap.innerHTML = "";
    TOPICS.forEach(topic => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = topic;
      if (selected.has(topic)) b.classList.add("is-active");
      b.addEventListener("click", () => {
        if (selected.has(topic)) selected.delete(topic); else selected.add(topic);
        renderPills();
      });
      wrap.appendChild(b);
    });
  }
  renderPills();

  document.getElementById("ic-preview-btn").addEventListener("click", () => {
    const errorEl = document.getElementById("ic-error");
    const resultEl = document.getElementById("ic-result");
    if (selected.size === 0) {
      errorEl.textContent = "Select at least one topic above.";
      errorEl.hidden = false;
      resultEl.hidden = true;
      return;
    }
    errorEl.hidden = true;

    let best = null, bestScore = 0;
    CLUSTERS.forEach(c => {
      const score = c.topics.filter(t => selected.has(t)).length;
      if (score > bestScore) { bestScore = score; best = c; }
    });

    document.getElementById("ic-result-tag").textContent = "Preview only — not a real group";
    if (best) {
      document.getElementById("ic-result-title").textContent = best.name;
      document.getElementById("ic-result-desc").textContent = best.desc;
    } else {
      document.getElementById("ic-result-title").textContent = "No close-fit demo cluster yet";
      document.getElementById("ic-result-desc").textContent = "Your combination doesn't match one of the illustrative demo groups above — with a real user base, the model would find a natural group instead of forcing a fixed category.";
    }
    resultEl.hidden = false;
  });
})();
