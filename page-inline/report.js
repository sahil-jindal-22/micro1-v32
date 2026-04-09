document.getElementById("report-root").innerHTML =
  '<div class="">\n      <!-- 10. EXAMPLE TRAJECTORIES -->\n      <div class="">\n        <p style="margin-bottom: 1rem">\n          Select a run to view the full agent trajectory, tool calls, and\n          criteria results.\n        </p>\n        <div class="traj-controls">\n          <div class="task-select">\n            <select id="traj-select" onchange="showTrajectory()">\n              <option value="0">[HIGH] Task 16 — GPT-5.4 — reward 0.893</option>\n              <option value="1">\n                [HIGH] Task 16 — Gemini 3.1 Pro — reward 0.857\n              </option>\n              <option value="2">\n                [HIGH] Task 33 — Claude Opus 4.6 — reward 0.643\n              </option>\n              <option value="3">\n                [MID] Task 36 — Gemini 3.1 Pro — reward 0.398\n              </option>\n              <option value="4">\n                [MID] Task 6 — Claude Opus 4.6 — reward 0.390\n              </option>\n              <option value="5">[MID] Task 28 — GPT-5.4 — reward 0.385</option>\n              <option value="6">\n                [LOW] Task 34 — Claude Opus 4.6 — reward 0.096\n              </option>\n              <option value="7">\n                [LOW] Task 34 — Gemini 3.1 Pro — reward 0.096\n              </option>\n              <option value="8">[LOW] Task 38 — GPT-5.4 — reward 0.086</option>\n            </select>\n          </div>\n        </div>\n        <div class="traj-tabs">\n          <button\n            class="traj-tab active"\n            id="tab-prompt"\n            onclick="setTrajTab(\'prompt\')"\n          >\n            Prompt\n          </button>\n          <button\n            class="traj-tab"\n            id="tab-trajectory"\n            onclick="setTrajTab(\'trajectory\')"\n          >\n            Trajectory\n          </button>\n          <button\n            class="traj-tab"\n            id="tab-results"\n            onclick="setTrajTab(\'results\')"\n          >\n            Results\n          </button>\n        </div>\n        <div class="traj-layout">\n          <div class="traj-col active" id="traj-col-prompt">\n            <div class="traj-prompt" id="prompt-viewer"></div>\n          </div>\n          <div class="traj-col" id="traj-col-trajectory">\n            <div class="traj-viewer" id="traj-viewer"></div>\n          </div>\n          <div class="traj-col" id="traj-col-results">\n            <div id="criteria-viewer"></div>\n          </div>\n        </div>\n      </div>\n    </div>';

let prompts = [];
let exampleRuns = [];
const DEFAULT_PROMPT_HIGHLIGHT_TOKENS = [];
var OPUS = "#818CF8",
  GPT = "#34D399",
  GEMINI = "#FB923C";
var models = ["Claude Opus 4.6", "GPT-5.4", "Gemini 3.1 Pro"];
var colors = [OPUS, GPT, GEMINI];
var tid = 0;
var textStore = {};
var textStoreId = 0;
var isReportLoading = false;

function buildLoaderHtml(label) {
  return (
    '<div class="report-loader-wrap">' +
    '<div class="report-loader" aria-hidden="true"></div>' +
    '<div class="report-loader-text">' +
    esc(label || "Loading report data...") +
    "</div>" +
    "</div>"
  );
}

function setLoadingState(isLoading) {
  isReportLoading = !!isLoading;
  var selectEl = document.getElementById("traj-select");
  if (selectEl) {
    selectEl.disabled = isReportLoading;
    selectEl.setAttribute("aria-busy", isReportLoading ? "true" : "false");
  }

  if (!isReportLoading) return;
  var loader = buildLoaderHtml("Loading report data...");
  var promptEl = document.getElementById("prompt-viewer");
  var trajEl = document.getElementById("traj-viewer");
  var criteriaEl = document.getElementById("criteria-viewer");
  if (promptEl) promptEl.innerHTML = loader;
  if (trajEl) trajEl.innerHTML = loader;
  if (criteriaEl) criteriaEl.innerHTML = loader;
}

function esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stashText(s) {
  var key = "txt" + textStoreId++;
  textStore[key] = String(s == null ? "" : s);
  return key;
}

function togglePreText(preId, textKey, btnEl) {
  var e = document.getElementById(preId);
  if (!e) return;
  if (e.dataset.full) {
    e.textContent = e.dataset.short || "";
    delete e.dataset.full;
    btnEl.textContent = "Show more";
    return;
  }
  e.dataset.short = e.textContent;
  e.textContent = textStore[textKey] || "";
  e.dataset.full = "1";
  btnEl.textContent = "Show less";
}

function toggle(id) {
  var el = document.getElementById(id);
  el.classList.toggle("open");
  var parent = el.parentElement;
  var hdr = parent.querySelector('[data-toggle="' + id + '"]');
  if (hdr) hdr.classList.toggle("open");
}

function setTrajTab(tab) {
  var tabs = {
    prompt: document.getElementById("tab-prompt"),
    trajectory: document.getElementById("tab-trajectory"),
    results: document.getElementById("tab-results"),
  };
  var cols = {
    prompt: document.getElementById("traj-col-prompt"),
    trajectory: document.getElementById("traj-col-trajectory"),
    results: document.getElementById("traj-col-results"),
  };

  Object.keys(tabs).forEach(function (k) {
    if (tabs[k]) tabs[k].classList.toggle("active", k === tab);
    if (cols[k]) cols[k].classList.toggle("active", k === tab);
  });
}

function getPromptForTask(taskId) {
  for (var i = 0; i < prompts.length; i++) {
    var p = prompts[i];
    if (p && p.task_id === taskId) {
      return {
        prompt: p.prompt || "",
        highlight_tokens: p.highlight_tokens || DEFAULT_PROMPT_HIGHLIGHT_TOKENS,
      };
    }
  }
  return {
    prompt: "",
    highlight_tokens: DEFAULT_PROMPT_HIGHLIGHT_TOKENS,
  };
}

function addPromptMarkers(text, highlightTokens) {
  var out = String(text || "");
  var tokens = Array.isArray(highlightTokens) ? highlightTokens : [];
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (!token) continue;
    if (out.indexOf(token) !== -1) {
      out = out.split(token).join("[H]" + token + "[/H]");
    }
  }
  return out;
}

function renderPromptLine(line) {
  var raw = String(line || "");
  if (!raw.trim()) return "";
  var out = "";
  var re = /\[H\]([\s\S]*?)\[\/H\]/g;
  var last = 0;
  var m;
  while ((m = re.exec(raw)) !== null) {
    out += esc(raw.slice(last, m.index));
    out += '<span class="prompt-heading">' + esc(m[1]) + "</span>";
    last = re.lastIndex;
  }
  out += esc(raw.slice(last));
  return out;
}

function renderPromptText(text) {
  var lines = String(text || "").split("\n");
  return lines
    .map(function (line) {
      return renderPromptLine(line);
    })
    .join("<br>");
}

function getThinking(content) {
  if (!content || typeof content === "string" || !Array.isArray(content))
    return "";
  return content
    .filter(function (b) {
      return b.type === "thinking" && b.thinking;
    })
    .map(function (b) {
      return b.thinking;
    })
    .join("\n\n");
}

function getText(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .filter(function (b) {
        return b.type === "text" && b.text;
      })
      .map(function (b) {
        return b.text;
      })
      .join("\n");
  return String(content);
}

function parseArgs(tc) {
  if (!tc || !tc.function) return {};
  var raw = tc.function.arguments;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { _raw: raw };
    }
  }
  return raw || {};
}

function groupTrajectory(traj) {
  var groups = [];
  var i = 0;
  while (i < traj.length) {
    var msg = traj[i];
    var role = msg.role || "unknown";
    var toolCalls = msg.tool_calls || msg.tools || [];

    if (role === "assistant" && toolCalls.length > 0) {
      var thinking = getThinking(msg.content);
      var text = getText(msg.content);

      var consumed = 0;
      while (
        i + 1 + consumed < traj.length &&
        consumed < toolCalls.length &&
        traj[i + 1 + consumed].role === "tool"
      )
        consumed++;

      for (var t = 0; t < toolCalls.length; t++) {
        var tc = toolCalls[t];
        var name = tc.function ? tc.function.name : "tool";
        var args = parseArgs(tc);
        var output = t < consumed ? getText(traj[i + 1 + t].content) : "";

        if (name === "submit_answer") {
          var answer = args.answer || "";
          if (typeof answer === "string" && answer.charAt(0) === "{") {
            try {
              var inner = JSON.parse(answer);
              if (inner.answer) answer = inner.answer;
            } catch (e) {}
          }
          groups.push({
            kind: "submit",
            answer: answer,
            thinking: t === 0 ? thinking : "",
            text: t === 0 ? text : "",
          });
        } else if (name === "bash") {
          groups.push({
            kind: "bash",
            command: args.command || "",
            output: output,
            thinking: t === 0 ? thinking : "",
            text: t === 0 ? text : "",
          });
        } else {
          groups.push({
            kind: "tool",
            name: name,
            args: JSON.stringify(args, null, 2),
            output: output,
            thinking: t === 0 ? thinking : "",
            text: t === 0 ? text : "",
          });
        }
      }
      i += 1 + consumed;
    } else if (role === "system" || role === "user") {
      groups.push({ kind: role, content: getText(msg.content) });
      i++;
    } else {
      groups.push({
        kind: "other",
        role: role,
        content: getText(msg.content),
      });
      i++;
    }
  }
  return groups;
}

function renderThinking(text) {
  if (!text) return "";
  var id = "tb" + tid++;
  return (
    '<div class="thinking-block">' +
    '<div class="thinking-block-header" data-toggle="' +
    id +
    '" onclick="toggle(\'' +
    id +
    "')\">" +
    '<span class="think-icon">&#x25CF;</span>' +
    '<span class="think-label">Thinking</span>' +
    '<span class="think-chars">' +
    text.length.toLocaleString() +
    " chars</span>" +
    '<span class="chevron">&#8250;</span>' +
    "</div>" +
    '<div class="thinking-block-body" id="' +
    id +
    '">' +
    "<pre>" +
    esc(text) +
    "</pre>" +
    "</div></div>"
  );
}

function renderCollapsibleText(text, style) {
  if (!text || !text.trim()) return "";
  var lines = text.trim().split("\n");
  if (lines.length <= 6)
    return (
      '<div class="assistant-text" ' +
      (style || "") +
      ">" +
      esc(text.trim()) +
      "</div>"
    );
  var id = "ct" + tid++;
  return (
    '<div class="assistant-text collapsed" id="' +
    id +
    '" ' +
    (style || "") +
    ">" +
    esc(text.trim()) +
    "</div>" +
    '<div class="show-more-btn" onclick="var e=document.getElementById(\'' +
    id +
    "');e.classList.toggle('collapsed');this.textContent=e.classList.contains('collapsed')?'Show more':'Show less';\">Show more</div>"
  );
}

function renderBash(group) {
  var h = "";
  if (group.thinking) h += renderThinking(group.thinking);
  if (group.text && group.text.trim()) h += renderCollapsibleText(group.text);

  var cmd = group.command;
  var out = group.output;
  var hasOut = out && out.trim().length > 0;
  var cmdId = "cmd" + tid++;
  var outId = "out" + tid++;

  var cmdLines = cmd.split("\n");
  var longCmd = cmdLines.length > 4;
  var displayCmd = longCmd ? cmdLines.slice(0, 4).join("\n") : cmd;
  var fullCmdKey = stashText(cmd);

  h += '<div class="tool-block">';
  h +=
    '<div class="tool-block-header" ' +
    (hasOut
      ? 'data-toggle="' + outId + '" onclick="toggle(\'' + outId + "')\""
      : "") +
    ">";
  h += '<span class="tool-name">bash</span>';
  h += hasOut
    ? '<span class="chevron" style="margin-left:auto;">&#8250;</span>'
    : "";
  h += "</div>";

  h +=
    '<div style="padding:0.5rem 0.75rem;border-top:1px solid rgba(255,255,255,0.06);">';
  if (longCmd) {
    h +=
      "<pre style=\"font-family:'Roboto Mono','Courier New',monospace;font-size:13px;color:rgba(255,255,255,0.9);opacity:0.6;white-space:pre-wrap;word-break:break-all;\" id=\"" +
      cmdId +
      '">' +
      esc(displayCmd) +
      "</pre>";
    h +=
      '<div class="show-more-btn" onclick="var e=document.getElementById(\'' +
      cmdId +
      "');togglePreText('" +
      cmdId +
      "', '" +
      fullCmdKey +
      "', this);\">Show more</div>";
  } else {
    h +=
      "<pre style=\"font-family:'Roboto Mono','Courier New',monospace;font-size:13px;color:rgba(255,255,255,0.9);opacity:0.6;white-space:pre-wrap;word-break:break-all;\">" +
      esc(cmd) +
      "</pre>";
  }
  h += "</div>";

  if (hasOut) {
    var outLines = out.split("\n");
    var longOut = outLines.length > 8;
    var displayOut = longOut ? outLines.slice(0, 8).join("\n") : out;
    var outInner = "oi" + tid++;
    var fullOutKey = stashText(out);

    h += '<div class="tool-block-body" id="' + outId + '">';
    if (longOut) {
      h +=
        '<pre id="' +
        outInner +
        "\" style=\"font-family:'Roboto Mono','Courier New',monospace;font-size:13px;color:rgba(255,255,255,0.9);opacity:0.6;\">" +
        esc(displayOut) +
        "</pre>";
      h +=
        '<div class="show-more-btn" onclick="var e=document.getElementById(\'' +
        outInner +
        "');togglePreText('" +
        outInner +
        "', '" +
        fullOutKey +
        "', this);\">Show more</div>";
    } else {
      h +=
        "<pre style=\"font-family:'Roboto Mono','Courier New',monospace;font-size:13px;color:rgba(255,255,255,0.9);opacity:0.6;\">" +
        esc(out) +
        "</pre>";
    }
    h += "</div>";
  }

  h += "</div>";
  return h;
}

function renderSubmit(group) {
  var h = "";
  if (group.thinking) h += renderThinking(group.thinking);
  if (group.text && group.text.trim()) h += renderCollapsibleText(group.text);

  var id = "sa" + tid++;
  h += '<div class="submit-block">';
  h +=
    '<div class="submit-block-header" data-toggle="' +
    id +
    '" onclick="toggle(\'' +
    id +
    "')\">";
  h += '<span class="check-icon">&#x2713;</span>';
  h += '<span class="submit-label">Final Answer</span>';
  h +=
    '<span class="chevron" style="margin-left:auto;color:#4ADE80;">&#8250;</span>';
  h += "</div>";
  h += '<div class="submit-block-body" id="' + id + '">';
  h += "<pre>" + esc(group.answer) + "</pre>";
  h += "</div></div>";
  return h;
}

function renderGenericTool(group) {
  var h = "";
  if (group.thinking) h += renderThinking(group.thinking);
  if (group.text && group.text.trim()) h += renderCollapsibleText(group.text);

  var id = "gt" + tid++;
  h += '<div class="tool-block">';
  h +=
    '<div class="tool-block-header" data-toggle="' +
    id +
    '" onclick="toggle(\'' +
    id +
    "')\">";
  h += '<span class="tool-name">' + esc(group.name) + "</span>";
  h += '<span class="chevron">&#8250;</span>';
  h += "</div>";
  h += '<div class="tool-block-body" id="' + id + '">';
  h += "<pre>" + esc(group.args) + "</pre>";
  if (group.output && group.output.trim()) {
    h +=
      '<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.08);"><pre style="color:#9CA3AF;">' +
      esc(group.output) +
      "</pre></div>";
  }
  h += "</div></div>";
  return h;
}

function showTrajectory() {
  if (isReportLoading) return;
  tid = 0;
  var idx = document.getElementById("traj-select").value;
  var run = exampleRuns[idx];
  if (!run) {
    var emptyHtml =
      '<p style="color:#9CA3AF;">No run data available. Please check report-data.json.</p>';
    document.getElementById("prompt-viewer").innerHTML = emptyHtml;
    document.getElementById("traj-viewer").innerHTML = emptyHtml;
    document.getElementById("criteria-viewer").innerHTML = emptyHtml;
    return;
  }

  var promptEntry = getPromptForTask(run.task_id);
  var promptText = promptEntry.prompt;
  var promptMarked = addPromptMarkers(promptText, promptEntry.highlight_tokens);
  var promptHtml =
    '<div class="prompt-shell"><div class="prompt-card"><div class="prompt-pre">' +
    renderPromptText(promptMarked || "Prompt not available for this task.") +
    "</div></div></div>";
  document.getElementById("prompt-viewer").innerHTML = promptHtml;

  var groups = groupTrajectory(run.trajectory);
  var stepHtml = "";
  var stepNum = 0;

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];
    if (g.kind === "bash" || g.kind === "submit" || g.kind === "tool") {
      stepNum++;
      stepHtml += '<div class="traj-step">';
      stepHtml += '<div class="traj-step-header">';
      stepHtml += '<div class="traj-step-dot assistant"></div>';
      stepHtml += '<span class="traj-step-label">Agent</span>';
      stepHtml += '<span class="traj-step-num">Step ' + stepNum + "</span>";
      stepHtml += "</div>";

      if (g.kind === "bash") stepHtml += renderBash(g);
      else if (g.kind === "submit") stepHtml += renderSubmit(g);
      else stepHtml += renderGenericTool(g);

      stepHtml += "</div>";
    } else if (g.kind === "system") {
      stepHtml += '<div class="traj-step">';
      stepHtml +=
        '<div class="traj-step-header"><div class="traj-step-dot system"></div><span class="traj-step-label">System</span></div>';
      stepHtml += renderCollapsibleText(g.content, 'style="color:#9CA3AF;"');
      stepHtml += "</div>";
    }
  }

  document.getElementById("traj-viewer").innerHTML = stepHtml;

  if (run.criteria && run.criteria.length > 0) {
    var passed = run.criteria.filter(function (c) {
      return c.verdict === "PASS";
    }).length;
    var ch =
      '<div class="results-card"><div class="criteria-header">' +
      passed +
      "/" +
      run.criteria.length +
      " criteria passed (reward: " +
      "<strong>" +
      run.reward.toFixed(3) +
      "</strong>)</div>";
    ch +=
      '<div class="results-head"><div class="results-grid"><div class="results-cell">Criterion</div><div class="results-cell">Wt</div><div class="results-cell">Verdict</div><div class="results-cell">Judge Reasoning</div></div></div>';
    for (var ci = 0; ci < run.criteria.length; ci++) {
      var c = run.criteria[ci];
      var verdictClass = c.verdict === "PASS" ? "pass" : "fail";
      var verdictLabel = c.verdict === "PASS" ? "Passed" : "Failed";
      var reason = c.judge_reasoning ? esc(c.judge_reasoning) : "";
      ch +=
        '<div class="results-row"><div class="results-grid"><div class="results-cell" data-label="Criterion">' +
        esc(c.criteria_text || "") +
        '</div><div class="results-cell" data-label="Wt">' +
        c.weight +
        '</div><div class="results-cell" data-label="Verdict"><span class="verdict-pill ' +
        verdictClass +
        '">' +
        verdictLabel +
        '</span></div><div class="results-cell reason" data-label="Judge Reasoning">' +
        reason +
        "</div></div></div>";
    }
    ch += "</div>";
    document.getElementById("criteria-viewer").innerHTML = ch;
  } else {
    document.getElementById("criteria-viewer").innerHTML =
      '<p style="color:#6B7280;">No criteria data available.</p>';
  }
}

async function loadReportData() {
  setLoadingState(true);
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/sahil-jindal-22/micro1-v32@v32.4.80/page-inline/report-data.json",
      { cache: "no-store" },
    );
    const raw = await res.text();
    await new Promise(function (resolve) {
      requestAnimationFrame(resolve);
    });
    const data = JSON.parse(raw);
    prompts = Array.isArray(data.prompts) ? data.prompts : [];
    exampleRuns = Array.isArray(data.exampleRuns) ? data.exampleRuns : [];
    setLoadingState(false);
    showTrajectory();
  } catch (err) {
    setLoadingState(false);
    const el = document.getElementById("report-root");
    if (el)
      el.innerHTML =
        '<div style="padding:16px;color:#f87171;font-family:Outfit,sans-serif;">Failed to load report data.</div>';
    console.error(err);
  }
}

loadReportData();
