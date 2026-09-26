// js/pages/mediaLiteracy.js
// Renders the multilingual (EN/ES/DE) Media Literacy content.
// No build step, no dependencies — matches the rest of the site.

const CONTENT = {
  en: {
    title: "Media Literacy",
    subtitle: "A quick guide to spotting misinformation about global inequality and humanitarian crises — before you believe it, or share it.",
    why: "Misinformation about inequality and crises isn't just \u201cwrong information\u201d \u2014 it can misdirect aid, cause donor fatigue, dehumanize real people, or fuel hate toward the communities the story claims to be about. Learning to spot the patterns is part of turning awareness into responsible action.",
    signalsHeading: "6 common warning signs",
    signals: [
      { title: "Emotionally manipulative language", desc: "Words designed to make you feel outrage or panic instead of understanding." },
      { title: "Missing or vague sources", desc: "\u201cExperts say\u201d or \u201cstudies show\u201d with no named source you can actually check." },
      { title: "Urgency or fear-based framing", desc: "\u201cShare before it's too late\u201d pressure is a tactic to stop you from pausing to verify." },
      { title: "Extreme or absolute claims", desc: "\u201cAlways\u201d, \u201cnever\u201d, \u201c100% proven\u201d \u2014 real data about complex issues is rarely that absolute." },
      { title: "Unverifiable statistics", desc: "A striking number with no link to the original dataset (NBS, World Bank, ReliefWeb, etc.)." },
      { title: "No author, date, or publication", desc: "Real reporting is traceable \u2014 to a person, an outlet, and a date." }
    ],
    checklistHeading: "Before you share, ask yourself",
    checklist: [
      "Who actually said this \u2014 can I find the original source, not just a repost?",
      "Does this claim show up on a source I trust, told in a calmer way?",
      "Is this trying to make me feel something before it tells me something?"
    ],
    sourcesHeading: "Trusted primary sources",
    sources: ["National statistics offices (NBS)", "ReliefWeb", "World Bank", "UNHCR", "Established news outlets"]
  },
  es: {
    title: "Alfabetización mediática",
    subtitle: "Una guía rápida para detectar desinformación sobre desigualdad global y crisis humanitarias — antes de creerla, o de compartirla.",
    why: "La desinformación sobre desigualdad y crisis no es solo \u201cinformación incorrecta\u201d \u2014 puede desviar ayuda, generar fatiga de donantes, deshumanizar a personas reales, o alimentar odio hacia las comunidades de las que supuestamente habla. Aprender a detectar los patrones es parte de convertir la conciencia en acción responsable.",
    signalsHeading: "6 señales de alerta comunes",
    signals: [
      { title: "Lenguaje emocionalmente manipulador", desc: "Palabras diseñadas para generar indignación o pánico en vez de comprensión." },
      { title: "Fuentes ausentes o vagas", desc: "\u201cExpertos dicen\u201d o \u201cestudios muestran\u201d sin una fuente concreta que puedas verificar." },
      { title: "Marco de urgencia o miedo", desc: "La presión de \u201ccomparte antes de que sea tarde\u201d es una táctica para que no te detengas a verificar." },
      { title: "Afirmaciones extremas o absolutas", desc: "\u201cSiempre\u201d, \u201cnunca\u201d, \u201c100% comprobado\u201d \u2014 los datos reales rara vez son tan absolutos." },
      { title: "Estadísticas no verificables", desc: "Una cifra impactante sin enlace al dataset original (NBS, World Bank, ReliefWeb, etc.)." },
      { title: "Sin autor, fecha o publicación", desc: "El periodismo real es rastreable \u2014 a una persona, un medio y una fecha." }
    ],
    checklistHeading: "Antes de compartir, pregúntate",
    checklist: [
      "¿Quién dijo esto realmente? ¿Puedo encontrar la fuente original, no solo un repost?",
      "¿Esta afirmación aparece en una fuente confiable, contada de forma más calmada?",
      "¿Esto busca hacerme sentir algo antes de decirme algo?"
    ],
    sourcesHeading: "Fuentes primarias confiables",
    sources: ["Institutos nacionales de estadística (NBS)", "ReliefWeb", "World Bank", "UNHCR", "Medios reconocidos"]
  },
  de: {
    title: "Medienkompetenz",
    subtitle: "Ein kurzer Leitfaden, um Desinformation über globale Ungleichheit und humanitäre Krisen zu erkennen — bevor du sie glaubst oder teilst.",
    why: "Desinformation über Ungleichheit und Krisen ist nicht nur \u201cfalsche Information\u201d \u2014 sie kann Hilfe fehlleiten, zu Spendenmüdigkeit führen, echte Menschen entmenschlichen oder Hass gegen die betroffenen Gemeinschaften schüren. Die Muster zu erkennen ist Teil davon, Bewusstsein in verantwortungsvolles Handeln zu verwandeln.",
    signalsHeading: "6 häufige Warnzeichen",
    signals: [
      { title: "Emotional manipulative Sprache", desc: "Wörter, die Empörung oder Panik statt Verständnis auslösen sollen." },
      { title: "Fehlende oder vage Quellen", desc: "\u201cExperten sagen\u201d oder \u201cStudien zeigen\u201d ohne eine konkrete, überprüfbare Quelle." },
      { title: "Dringlichkeits- oder Angstrahmen", desc: "Der Druck \u201cTeile, bevor es zu spät ist\u201d soll dich davon abhalten, zu prüfen." },
      { title: "Extreme oder absolute Behauptungen", desc: "\u201cImmer\u201d, \u201cnie\u201d, \u201c100% bewiesen\u201d \u2014 echte Daten sind selten so absolut." },
      { title: "Nicht überprüfbare Statistiken", desc: "Eine auffällige Zahl ohne Link zum ursprünglichen Datensatz (NBS, Weltbank, ReliefWeb usw.)." },
      { title: "Kein Autor, Datum oder Publikation", desc: "Echter Journalismus ist nachvollziehbar \u2014 zu einer Person, einem Medium und einem Datum." }
    ],
    checklistHeading: "Bevor du teilst, frag dich",
    checklist: [
      "Wer hat das wirklich gesagt \u2014 finde ich die Originalquelle, nicht nur einen Repost?",
      "Taucht diese Behauptung bei einer vertrauenswürdigen Quelle auf, ruhiger dargestellt?",
      "Will das eher ein Gefühl auslösen, bevor es mir etwas mitteilt?"
    ],
    sourcesHeading: "Vertrauenswürdige Primärquellen",
    sources: ["Nationale Statistikämter (NBS)", "ReliefWeb", "Weltbank", "UNHCR", "Anerkannte Nachrichtenmedien"]
  }
};

const LANGS = ["en", "es", "de"];
let currentLang = "en";

function render() {
  const c = CONTENT[currentLang];

  document.getElementById("pageTitle").textContent = c.title;
  document.getElementById("pageSubtitle").textContent = c.subtitle;
  document.getElementById("whyBox").textContent = c.why;
  document.getElementById("signalsHeading").textContent = c.signalsHeading;
  document.getElementById("checklistHeading").textContent = c.checklistHeading;
  document.getElementById("sourcesHeading").textContent = c.sourcesHeading;

  const grid = document.getElementById("signalsGrid");
  grid.innerHTML = "";
  c.signals.forEach((sig, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-body signal-card">
        <div class="signal-num">${i + 1}</div>
        <div>
          <h3>${sig.title}</h3>
          <p>${sig.desc}</p>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  const checklist = document.getElementById("checklistList");
  checklist.innerHTML = "";
  c.checklist.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-body">
        <div class="check-mark"></div>
        <p>${item}</p>
      </div>`;
    checklist.appendChild(card);
  });

  const sourcesRow = document.getElementById("sourcesRow");
  sourcesRow.innerHTML = "";
  c.sources.forEach(src => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = src;
    sourcesRow.appendChild(tag);
  });
}

function renderLangSwitch() {
  const wrap = document.getElementById("langSwitch");
  wrap.innerHTML = "";
  LANGS.forEach(code => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline" + (code === currentLang ? " is-active" : "");
    btn.textContent = code.toUpperCase();
    btn.addEventListener("click", () => {
      currentLang = code;
      renderLangSwitch();
      render();
    });
    wrap.appendChild(btn);
  });
}

renderLangSwitch();
render();
