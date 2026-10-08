// Application State
const state = {
  activeTab: "knowledge", // 'knowledge' | 'decisions' | 'cheatsheet' | 'simulator'
  activeModuleId: GCP_MODULES[0].id,
  completedModules: JSON.parse(localStorage.getItem("gcp_pde_completed_modules") || "[]"),
  searchQuery: "",

  // Exam Simulator State
  examMode: "tutor", // 'tutor' (instant feedback) | 'timed' (full simulation)
  currentQuestionIdx: 0,
  userAnswers: {}, // { questionIndex: selectedOptionIndex }
  revealedQuestions: {}, // { questionIndex: true }
  flaggedQuestions: {}, // { questionIndex: true }
  examSubmitted: false,
  remainingSeconds: 40 * 60, // 40 minutes for 20 questions (mirrors 2h / 50-60q pace)
  timerInterval: null,
  domainFilter: "ALL"
};

function saveCompletedModules() {
  localStorage.setItem("gcp_pde_completed_modules", JSON.stringify(state.completedModules));
}

function toggleModuleComplete(moduleId) {
  const idx = state.completedModules.indexOf(moduleId);
  if (idx === -1) {
    state.completedModules.push(moduleId);
  } else {
    state.completedModules.splice(idx, 1);
  }
  saveCompletedModules();
  renderApp();
}

// Lightweight Markdown-to-HTML formatter for tables, lists, bold, inline code
function formatMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Table detection
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Skip separator row |---|---|
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }

      if (!inTable) {
        html += '<table class="study-table"><thead><tr>';
        cells.forEach((c) => {
          html += `<th>${formatInline(c)}</th>`;
        });
        html += "</tr></thead><tbody>";
        inTable = true;
        tableHeaderDone = true;
      } else {
        html += "<tr>";
        cells.forEach((c) => {
          html += `<td>${formatInline(c)}</td>`;
        });
        html += "</tr>";
      }
      continue;
    } else if (inTable) {
      html += "</tbody></table>";
      inTable = false;
      tableHeaderDone = false;
    }

    // Headings
    if (line.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h4>${formatInline(line.slice(4))}</h4>`;
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const content = line.trim().slice(2);
      html += `<li>${formatInline(content)}</li>`;
    } else if (/^\d+\.\s/.test(line.trim())) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${formatInline(line.trim())}</li>`;
    } else if (line.trim() === "") {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p style="margin-bottom:0.65rem;">${formatInline(line)}</p>`;
    }
  }

  if (inList) html += "</ul>";
  if (inTable) html += "</tbody></table>";
  return html;
}

function formatInline(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

// Switch Tabs
function switchTab(tabName) {
  state.activeTab = tabName;
  if (tabName === "simulator" && state.examMode === "timed" && !state.examSubmitted && !state.timerInterval) {
    startExamTimer();
  }
  renderApp();
}

function startExamTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.remainingSeconds > 0 && !state.examSubmitted && state.examMode === "timed") {
      state.remainingSeconds--;
      const timerEl = document.getElementById("exam-timer-display");
      if (timerEl) {
        timerEl.textContent = formatTime(state.remainingSeconds);
      }
    } else if (state.remainingSeconds <= 0 && !state.examSubmitted) {
      submitExam();
    }
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Render Knowledge Hub
function renderKnowledgeTab() {
  const activeMod = GCP_MODULES.find((m) => m.id === state.activeModuleId) || GCP_MODULES[0];
  const isDone = state.completedModules.includes(activeMod.id);

  const sidebarHtml = GCP_MODULES.map((mod) => {
    const done = state.completedModules.includes(mod.id);
    return `
      <button class="module-card-btn ${mod.id === activeMod.id ? "active" : ""}" onclick="selectModule('${mod.id}')">
        <div class="domain-tag">
          <span>${mod.badge}</span>
          ${done ? '<span class="check-done">✓ Mastered</span>' : ""}
        </div>
        <h4>${mod.title}</h4>
        <p>${mod.summary}</p>
      </button>
    `;
  }).join("");

  const sectionsHtml = activeMod.deepDive
    .filter((sec) => {
      if (!state.searchQuery.trim()) return true;
      const q = state.searchQuery.toLowerCase();
      return sec.heading.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q);
    })
    .map(
      (sec) => `
      <div class="section-block">
        <h3>${sec.heading}</h3>
        <div class="markdown-body">${formatMarkdown(sec.content)}</div>
      </div>
    `
    )
    .join("");

  const tipsHtml = activeMod.proTips
    .map((t) => `<li>${formatInline(t)}</li>`)
    .join("");

  return `
    <div class="toolbar">
      <input
        type="text"
        class="search-input"
        placeholder="Filter deep-dive concepts inside current module (e.g., 'Hotspotting', 'Watermark', 'DLP', 'TRANSFORM')..."
        value="${state.searchQuery}"
        oninput="handleSearch(this.value)"
      />
    </div>

    <div class="module-grid">
      <div class="module-sidebar">
        ${sidebarHtml}
      </div>

      <div class="module-detail">
        <div class="detail-header">
          <div>
            <span class="badge-weight">${activeMod.domain} • ${activeMod.badge}</span>
            <h2 style="font-size:1.6rem; margin-top:0.5rem;">${activeMod.title}</h2>
            <p style="color:var(--text-muted); margin-top:0.25rem;">${activeMod.summary}</p>
          </div>
          <button class="btn ${isDone ? "btn-success" : "btn-primary"}" onclick="toggleModuleComplete('${activeMod.id}')">
            ${isDone ? "✓ Marked as Mastered" : "Mark Module as Mastered"}
          </button>
        </div>

        <div class="pro-tips-box">
          <h4>⚡ Exam Trap Alerts & Golden Rules</h4>
          <ul>${tipsHtml}</ul>
        </div>

        ${sectionsHtml || '<p style="color:var(--text-muted);">No sections matched your filter. Clear the search box to see all sections.</p>'}

        <div style="margin-top:1.75rem;">
          <h3 style="margin-bottom:0.75rem; font-size:1.1rem; color:#93c5fd;">Production Reference Pattern / Code Blueprint</h3>
          <pre class="code-block"><code>${escapeHtml(activeMod.codeExample)}</code></pre>
        </div>
      </div>
    </div>
  `;
}

// Render Architecture Decision Trees
function renderDecisionsTab() {
  return DECISION_TREES.map(
    (tree) => `
    <div class="tree-section">
      <span class="badge-weight">${tree.category}</span>
      <h2 style="margin-top:0.4rem; font-size:1.45rem;">${tree.scenario}</h2>
      <div class="tree-grid">
        ${tree.nodes
          .map(
            (n) => `
          <div class="tree-card">
            <div>
              <div class="tree-if"><strong>IF REQUIREMENT IS:</strong><br/>${formatInline(n.condition)}</div>
              <div class="tree-then">➔ ${n.choice}</div>
            </div>
            <div class="tree-why">${formatInline(n.reason)}</div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `
  ).join("");
}

// Render Quick Cheat Sheets
function renderCheatSheetTab() {
  return `
    <div style="margin-bottom:1.5rem;">
      <h2>Last-Minute Exam Cram & High-Yield Formulas</h2>
      <p style="color:var(--text-muted);">Review these high-frequency exam patterns right before taking the simulation or sitting for the real Google Cloud exam.</p>
    </div>
    <div class="tree-grid">
      ${CHEAT_CARDS.map(
        (card) => `
        <div class="section-block" style="margin-bottom:0;">
          <h3>${card.title}</h3>
          <ul style="padding-left:1.25rem;">
            ${card.items.map((item) => `<li style="margin-bottom:0.55rem;">${formatInline(item)}</li>`).join("")}
          </ul>
        </div>
      `
      ).join("")}
    </div>
  `;
}

// Render Exam Simulator
function renderSimulatorTab() {
  const totalQ = EXAM_QUESTIONS.length;
  const qIndex = state.currentQuestionIdx;
  const q = EXAM_QUESTIONS[qIndex];
  const selectedOpt = state.userAnswers[qIndex];
  const isRevealed =
    state.examSubmitted || (state.examMode === "tutor" && state.revealedQuestions[qIndex]);

  // Calculate current score
  let answeredCount = Object.keys(state.userAnswers).length;
  let correctCount = 0;
  EXAM_QUESTIONS.forEach((ques, idx) => {
    if (state.userAnswers[idx] === ques.correctIndex) {
      correctCount++;
    }
  });

  // Results summary if submitted
  let resultsBannerHtml = "";
  if (state.examSubmitted) {
    const pct = Math.round((correctCount / totalQ) * 100);
    const passed = pct >= 75;

    // Breakdown by domain
    const domainStats = {};
    EXAM_QUESTIONS.forEach((ques, idx) => {
      if (!domainStats[ques.domain]) {
        domainStats[ques.domain] = { total: 0, correct: 0 };
      }
      domainStats[ques.domain].total++;
      if (state.userAnswers[idx] === ques.correctIndex) {
        domainStats[ques.domain].correct++;
      }
    });

    const domainBarsHtml = Object.entries(domainStats)
      .map(([dom, st]) => {
        const dpct = Math.round((st.correct / st.total) * 100);
        return `
        <div class="domain-bar-row">
          <div class="domain-bar-label">
            <span>${dom}</span>
            <strong>${st.correct}/${st.total} (${dpct}%)</strong>
          </div>
          <div class="domain-bar-track">
            <div class="domain-bar-fill" style="width:${dpct}%; background:${dpct >= 75 ? "var(--gcp-green)" : "var(--gcp-yellow)"}"></div>
          </div>
        </div>
      `;
      })
      .join("");

    resultsBannerHtml = `
      <div class="results-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
          <div>
            <span class="badge-weight" style="background:${passed ? "rgba(52,168,83,0.2)" : "rgba(234,67,53,0.2)"}; color:${passed ? "#4ade80" : "#fca5a5"}">
              ${passed ? "PASSING READINESS (≥75%)" : "NEEDS REVIEW (<75%)"}
            </span>
            <h2 style="font-size:1.75rem; margin-top:0.5rem;">Final Score: ${correctCount} / ${totalQ} (${pct}%)</h2>
            <p style="color:var(--text-muted);">Click any question number on the right panel to inspect detailed explanations and why each distractor was wrong.</p>
          </div>
          <button class="btn btn-primary" onclick="resetExam()">Retake Exam Simulation</button>
        </div>
        <h4 style="margin-bottom:0.85rem; color:#93c5fd;">Performance Breakdown by Official Exam Domain</h4>
        ${domainBarsHtml}
      </div>
    `;
  }

  // Options rendering
  const optionsHtml = q.options
    .map((optText, optIdx) => {
      let cls = "option-btn";
      if (selectedOpt === optIdx) cls += " selected";
      if (isRevealed) {
        if (optIdx === q.correctIndex) cls += " correct";
        else if (selectedOpt === optIdx) cls += " wrong";
      }
      return `
      <button
        class="${cls}"
        onclick="selectAnswer(${qIndex}, ${optIdx})"
        ${state.examSubmitted ? "disabled" : ""}
      >
        ${formatInline(optText)}
      </button>
    `;
    })
    .join("");

  // Explanation rendering
  let explanationHtml = "";
  if (isRevealed) {
    const isCorrect = selectedOpt === q.correctIndex;
    const wrongDetails = Object.entries(q.wrongReasons || {})
      .map(
        ([idx, reason]) =>
          `<div style="margin-bottom:0.4rem;">• <strong>Option ${String.fromCharCode(65 + Number(idx))}:</strong> ${formatInline(reason)}</div>`
      )
      .join("");

    explanationHtml = `
      <div class="explanation-panel ${isCorrect ? "" : "wrong-banner"}">
        <h4 style="color:${isCorrect ? "#4ade80" : "#fca5a5"}">
          ${isCorrect ? "✓ Correct Answer!" : `✗ Incorrect — Correct Answer is Option ${String.fromCharCode(65 + q.correctIndex)}`}
        </h4>
        <p>${formatInline(q.explanation)}</p>
        <div class="wrong-breakdown">
          <strong style="color:#e2e8f0; display:block; margin-bottom:0.4rem;">Why other options are distractors:</strong>
          ${wrongDetails}
        </div>
      </div>
    `;
  }

  // Navigator Grid
  const navDotsHtml = EXAM_QUESTIONS.map((ques, idx) => {
    let cls = "q-dot-btn";
    if (idx === qIndex) cls += " current";
    const ans = state.userAnswers[idx];
    const rev = state.examSubmitted || (state.examMode === "tutor" && state.revealedQuestions[idx]);
    if (rev && ans !== undefined) {
      cls += ans === ques.correctIndex ? " correct-dot" : " wrong-dot";
    } else if (ans !== undefined) {
      cls += " answered";
    }
    if (state.flaggedQuestions[idx]) cls += " flagged";
    return `<button class="${cls}" onclick="goToQuestion(${idx})">${idx + 1}</button>`;
  }).join("");

  return `
    ${resultsBannerHtml}

    <div class="exam-header-bar">
      <div class="mode-switch">
        <button class="btn ${state.examMode === "tutor" ? "btn-primary" : ""}" onclick="setExamMode('tutor')">
          🎓 Study / Tutor Mode (Instant Explanations)
        </button>
        <button class="btn ${state.examMode === "timed" ? "btn-primary" : ""}" onclick="setExamMode('timed')">
          ⏱️ Timed Exam Mode (No Hints Until Submit)
        </button>
      </div>

      <div style="display:flex; align-items:center; gap:1rem;">
        ${
          state.examMode === "timed"
            ? `<div class="timer-badge" id="exam-timer-display">${formatTime(state.remainingSeconds)}</div>`
            : `<span style="color:var(--text-muted); font-size:0.9rem;">Answered: <strong>${answeredCount}/${totalQ}</strong></span>`
        }
        ${
          !state.examSubmitted
            ? `<button class="btn btn-success" onclick="submitExam()">Finish & Grade Exam</button>`
            : `<button class="btn" onclick="resetExam()">Reset Exam</button>`
        }
      </div>
    </div>

    <div class="exam-layout">
      <div class="question-card">
        <div class="q-meta">
          <div>
            <span class="q-domain-pill">${q.domain}</span>
            <span style="margin-left:0.5rem; font-size:0.82rem; color:var(--text-muted);">Topic: <strong>${q.topic}</strong></span>
          </div>
          <span class="q-diff-pill ${q.difficulty}">${q.difficulty}</span>
        </div>

        <h3 style="margin-bottom:0.75rem; color:#e2e8f0;">Question ${qIndex + 1} of ${totalQ}</h3>
        <div class="q-text">${formatInline(q.question)}</div>

        <div class="options-list">
          ${optionsHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; gap:0.65rem;">
            <button class="btn" onclick="prevQuestion()" ${qIndex === 0 ? "disabled" : ""}>← Previous</button>
            <button class="btn" onclick="toggleFlag(${qIndex})">
              ${state.flaggedQuestions[qIndex] ? "🚩 Unflag Question" : "🏳️ Flag for Review"}
            </button>
            ${
              state.examMode === "tutor" && !state.examSubmitted
                ? `<button class="btn btn-primary" onclick="revealCurrentAnswer(${qIndex})">
                    ${state.revealedQuestions[qIndex] ? "Hide Explanation" : "Check Answer & Explanation"}
                  </button>`
                : ""
            }
          </div>
          <button class="btn btn-primary" onclick="nextQuestion()" ${qIndex === totalQ - 1 ? "disabled" : ""}>
            Next Question →
          </button>
        </div>

        ${explanationHtml}
      </div>

      <div class="q-navigator">
        <h4 style="font-size:0.95rem;">Question Navigator</h4>
        <p style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">
          Green = Correct • Red = Missed • Dashed = Flagged
        </p>
        <div class="q-nav-grid">
          ${navDotsHtml}
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:0.75rem; border-top:1px solid var(--border-color); padding-top:0.75rem;">
          <div>Completed: <strong>${answeredCount} / ${totalQ}</strong></div>
          <div>Flagged for review: <strong>${Object.keys(state.flaggedQuestions).filter((k) => state.flaggedQuestions[k]).length}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// Event Handlers
function selectModule(id) {
  state.activeModuleId = id;
  renderApp();
}

function handleSearch(val) {
  state.searchQuery = val;
  renderApp();
}

function selectAnswer(qIdx, optIdx) {
  if (state.examSubmitted) return;
  state.userAnswers[qIdx] = optIdx;
  if (state.examMode === "tutor") {
    state.revealedQuestions[qIdx] = true;
  }
  renderApp();
}

function revealCurrentAnswer(qIdx) {
  state.revealedQuestions[qIdx] = !state.revealedQuestions[qIdx];
  renderApp();
}

function toggleFlag(qIdx) {
  state.flaggedQuestions[qIdx] = !state.flaggedQuestions[qIdx];
  renderApp();
}

function goToQuestion(idx) {
  state.currentQuestionIdx = idx;
  renderApp();
}

function prevQuestion() {
  if (state.currentQuestionIdx > 0) {
    state.currentQuestionIdx--;
    renderApp();
  }
}

function nextQuestion() {
  if (state.currentQuestionIdx < EXAM_QUESTIONS.length - 1) {
    state.currentQuestionIdx++;
    renderApp();
  }
}

function setExamMode(mode) {
  state.examMode = mode;
  if (mode === "timed") {
    startExamTimer();
  } else {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  renderApp();
}

function submitExam() {
  state.examSubmitted = true;
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderApp();
}

function resetExam() {
  state.userAnswers = {};
  state.revealedQuestions = {};
  state.flaggedQuestions = {};
  state.examSubmitted = false;
  state.currentQuestionIdx = 0;
  state.remainingSeconds = 40 * 60;
  if (state.examMode === "timed") {
    startExamTimer();
  }
  renderApp();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderApp() {
  // Update nav active states
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.activeTab);
  });

  // Update Hero Stats
  const masteredEl = document.getElementById("stat-mastered");
  if (masteredEl) {
    masteredEl.textContent = `${state.completedModules.length}/${GCP_MODULES.length}`;
  }
  const answeredEl = document.getElementById("stat-answered");
  if (answeredEl) {
    answeredEl.textContent = `${Object.keys(state.userAnswers).length}/${EXAM_QUESTIONS.length}`;
  }

  const root = document.getElementById("app-content");
  if (state.activeTab === "knowledge") {
    root.innerHTML = renderKnowledgeTab();
  } else if (state.activeTab === "decisions") {
    root.innerHTML = renderDecisionsTab();
  } else if (state.activeTab === "cheatsheet") {
    root.innerHTML = renderCheatSheetTab();
  } else if (state.activeTab === "simulator") {
    root.innerHTML = renderSimulatorTab();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  renderApp();
});
