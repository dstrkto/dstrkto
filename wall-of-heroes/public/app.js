const CHANNELS = ["Phone", "Chat", "Email", "Social", "SMS", "Video"];
const REACTIONS = [
  { key: "flag", emoji: "🏁", label: "Checkered flag" },
  { key: "fire", emoji: "🔥", label: "On fire" },
  { key: "trophy", emoji: "🏆", label: "Trophy" },
];
const LIVERIES = [
  ["#ff2e4d", "#ffd23f"], ["#2de2e6", "#9d5cff"], ["#ff8a1f", "#12131a"],
  ["#3dff8b", "#2de2e6"], ["#9d5cff", "#ff2e4d"], ["#ffd23f", "#ff8a1f"],
  ["#ff4fd8", "#2de2e6"], ["#4f8bff", "#ffd23f"],
];

const state = {
  shoutouts: [],
  filters: { agent: "", team: "", channel: "", search: "" },
  period: 7,
  passcode: "",
  myReactions: {},
};

// ---------- small helpers ----------
const $ = (sel) => document.querySelector(sel);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function storageGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}
function sessionGet(key) {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
}
function sessionSet(key, value) {
  try { value ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key); } catch { /* ignore */ }
}

function hash(str) {
  let x = 0;
  for (const ch of str.toLowerCase()) x = (x * 31 + ch.codePointAt(0)) >>> 0;
  return x;
}
const carNumber = (name) => (hash(name) % 98) + 2;
const livery = (name) => LIVERIES[hash(name) % LIVERIES.length];
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

function withinDays(iso, days) {
  return !days || Date.now() - new Date(iso).getTime() <= days * 86400000;
}
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const cheers = (s) => Object.values(s.reactions || {}).reduce((a, b) => a + b, 0);
const uniqueSorted = (arr) =>
  [...new Map(arr.filter(Boolean).map((v) => [v.toLowerCase(), v])).values()].sort((a, b) => a.localeCompare(b));

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (state.passcode) headers["x-leader-passcode"] = state.passcode;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

// ---------- confetti ----------
function burst(count = 40) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $("#confetti");
  const colors = ["#ff2e4d", "#ffd23f", "#2de2e6", "#3dff8b", "#ffffff", "#000000", "#9d5cff"];
  for (let i = 0; i < count; i++) {
    const piece = h("i", {
      style: `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};` +
        `--dx:${(Math.random() - 0.5) * 200}px;--rot:${Math.random() * 720}deg;` +
        `animation-delay:${Math.random() * 0.3}s`,
    });
    box.append(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

// ---------- start lights ----------
function startLights() {
  const wrap = $("#startLights");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || sessionGet("woh-started")) {
    wrap.remove();
    return;
  }
  const bulbs = wrap.querySelectorAll("span");
  bulbs.forEach((b, i) => setTimeout(() => b.classList.add("on"), 250 + i * 250));
  setTimeout(() => {
    bulbs.forEach((b) => b.classList.remove("on"));
    wrap.classList.add("go");
    setTimeout(() => wrap.remove(), 500);
    sessionSet("woh-started", "1");
  }, 250 + bulbs.length * 250 + 400);
  wrap.addEventListener("click", () => wrap.remove());
}

// ---------- rendering ----------
function filtered() {
  const { agent, team, channel, search } = state.filters;
  const q = search.trim().toLowerCase();
  return state.shoutouts.filter((s) =>
    (!agent || sameName(s.agent, agent)) &&
    (!team || sameName(s.team || "", team)) &&
    (!channel || s.channel === channel) &&
    (!q || [s.agent, s.team, s.verbatim, s.customer, s.leader, s.note].join(" ").toLowerCase().includes(q))
  );
}

function plate(name) {
  const [c1] = livery(name);
  return h("div", { class: "plate", style: `--livery:${c1}` }, carNumber(name));
}

function card(s) {
  const [c1, c2] = livery(s.agent);
  const mine = state.myReactions[s.id] || [];
  return h("article", { class: "card", style: `--livery:${c1};--livery-2:${c2}` },
    h("div", { class: "card-head" },
      plate(s.agent),
      h("div", { class: "driver" },
        h("button", { class: "name", title: "See this driver's call-outs", onclick: () => setAgent(s.agent) }, s.agent),
        h("div", { class: "sub" },
          s.team && h("span", { class: "chip" }, s.team),
          h("span", { class: "chip channel" }, s.channel),
        ),
      ),
    ),
    h("blockquote", {}, s.verbatim),
    s.customer && h("p", { class: "customer" }, "— ", s.customer),
    s.note && h("p", { class: "note" }, "📣 ", s.note),
    h("div", { class: "card-foot" },
      h("span", { class: "from" }, `Flagged by ${s.leader} · ${timeAgo(s.createdAt)}`),
      h("div", { class: "reactions" },
        REACTIONS.map((r) =>
          h("button", {
            class: `react${mine.includes(r.key) ? " mine" : ""}`,
            title: r.label,
            "aria-label": `${r.label}: ${s.reactions?.[r.key] || 0}`,
            "aria-pressed": String(mine.includes(r.key)),
            onclick: (e) => react(s, r.key, e.currentTarget),
          }, `${r.emoji} ${s.reactions?.[r.key] || 0}`)
        ),
      ),
      state.passcode && h("button", { class: "del", onclick: (e) => remove(s, e.currentTarget) }, "Delete"),
    ),
  );
}

function renderStats() {
  const all = state.shoutouts;
  $("#statTotal").textContent = all.length;
  $("#statDrivers").textContent = uniqueSorted(all.map((s) => s.agent)).length;
  $("#statWeek").textContent = all.filter((s) => withinDays(s.createdAt, 7)).length;
  $("#statCheers").textContent = all.reduce((n, s) => n + cheers(s), 0);
}

function fillSelect(sel, values, allLabel) {
  const current = sel.value;
  sel.replaceChildren(h("option", { value: "" }, allLabel), ...values.map((v) => h("option", { value: v }, v)));
  sel.value = values.some((v) => v === current) ? current : "";
}

function renderFilters() {
  const agents = uniqueSorted(state.shoutouts.map((s) => s.agent));
  const teams = uniqueSorted(state.shoutouts.map((s) => s.team));
  // Keep a remembered driver in the list even before their first shout-out loads.
  const agentOpts = state.filters.agent && !agents.some((a) => sameName(a, state.filters.agent))
    ? [...agents, state.filters.agent] : agents;
  fillSelect($("#fAgent"), agentOpts, "All drivers");
  $("#fAgent").value = agentOpts.find((a) => sameName(a, state.filters.agent)) || "";
  fillSelect($("#fTeam"), teams, "All teams");
  $("#fTeam").value = state.filters.team;
  $("#agentList").replaceChildren(...agents.map((a) => h("option", { value: a })));
  $("#teamList").replaceChildren(...teams.map((t) => h("option", { value: t })));
}

function renderGarage() {
  const g = $("#garage");
  const name = state.filters.agent;
  if (!name) { g.hidden = true; return; }
  const mine = state.shoutouts.filter((s) => sameName(s.agent, name));
  const [c1] = livery(name);
  const week = mine.filter((s) => withinDays(s.createdAt, 7)).length;
  const rank = standings(state.shoutouts, "agent").findIndex((r) => sameName(r.label, name)) + 1;
  g.style.setProperty("--livery", c1);
  g.replaceChildren(
    plate(name),
    h("div", {},
      h("h2", {}, mine.length ? `${name}'s Garage` : `Welcome to the grid, ${name}!`),
      h("p", {}, mine.length
        ? `${plural(mine.length, "call-out")} · ${plural(mine.reduce((n, s) => n + cheers(s), 0), "cheer")}`
        : "No call-outs yet. Your first checkered flag is coming."),
    ),
    h("div", { class: "badges" },
      rank > 0 && h("span", { class: "chip gold" }, `P${rank} all-time`),
      week > 0 && h("span", { class: "chip" }, `🔥 ${week} this week`),
      h("button", { class: "chip-btn", onclick: () => setAgent("") }, "Show everyone"),
    ),
  );
  g.hidden = false;
}

function renderWall() {
  const list = filtered();
  $("#wall").replaceChildren(...list.map(card));
  $("#wallEmpty").hidden = list.length > 0;
}

function standings(items, field) {
  const map = new Map();
  for (const s of items) {
    const label = s[field];
    if (!label) continue;
    const k = label.toLowerCase();
    const row = map.get(k) || { label, count: 0, cheers: 0 };
    row.count++;
    row.cheers += cheers(s);
    map.set(k, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.cheers - a.cheers || a.label.localeCompare(b.label));
}

function renderBoard(el, rows) {
  const max = rows[0]?.count || 1;
  el.replaceChildren(...(rows.length
    ? rows.slice(0, 15).map((r) =>
        h("li", {},
          h("div", { class: "bar-wrap" },
            h("div", { class: "label" }, r.label),
            h("div", { class: "bar", style: `width:${(r.count / max) * 100}%` }),
          ),
          h("span", { class: "n", title: plural(r.cheers, "cheer") }, r.count),
        ))
    : [h("li", { class: "empty", style: "display:block" }, "No laps recorded in this period.")]));
}

function renderLeaderboard() {
  const items = state.shoutouts.filter((s) => withinDays(s.createdAt, state.period));
  const drivers = standings(items, "agent");
  const podium = $("#podium");
  podium.replaceChildren(...drivers.slice(0, 3).map((r, i) =>
    h("div", { class: `step p${i + 1}` },
      plate(r.label),
      h("div", { class: "who" }, r.label),
      h("div", { class: "count" }, `${plural(r.count, "call-out")} · ${plural(r.cheers, "cheer")}`),
      h("div", { class: "block" }, i + 1),
    )));
  renderBoard($("#driverStandings"), drivers);
  renderBoard($("#teamStandings"), standings(items, "team"));
}

function renderManage() {
  const panel = $("#managePanel");
  panel.hidden = !state.passcode;
  if (!state.passcode) return;
  const q = $("#manageSearch").value.trim().toLowerCase();
  const list = state.shoutouts.filter((s) =>
    !q || [s.agent, s.team, s.leader, s.verbatim, s.note].join(" ").toLowerCase().includes(q));
  $("#manageCount").textContent = `${list.length} of ${plural(state.shoutouts.length, "post")}`;
  $("#manageList").replaceChildren(...list.map((s) =>
    h("li", {},
      h("div", { class: "manage-main" },
        h("div", { class: "manage-title" }, h("b", {}, s.agent),
          " · ", [s.team, s.channel].filter(Boolean).join(" · ")),
        h("div", { class: "manage-quote" },
          s.verbatim.length > 140 ? `“${s.verbatim.slice(0, 140)}…”` : `“${s.verbatim}”`),
        h("div", { class: "manage-meta" },
          `Posted by ${s.leader} · ${new Date(s.createdAt).toLocaleString()}`),
      ),
      h("button", { class: "btn danger", onclick: (e) => remove(s, e.currentTarget) }, "Delete"),
    )));
  $("#manageEmpty").hidden = list.length > 0;
}

function render() {
  renderManage();
  renderStats();
  renderFilters();
  renderGarage();
  renderWall();
  renderLeaderboard();
}

// ---------- actions ----------
function setAgent(name) {
  state.filters.agent = name;
  storageSet("woh-agent", name);
  showView("wall");
  render();
  window.scrollTo({ top: $(".tabs").offsetTop, behavior: "smooth" });
}

async function react(s, key, btn) {
  const mine = state.myReactions[s.id] || [];
  const had = mine.includes(key);
  btn.disabled = true;
  try {
    const { reactions } = await api("/api/react", {
      method: "POST",
      body: JSON.stringify({ id: s.id, reaction: key, delta: had ? -1 : 1 }),
    });
    s.reactions = reactions;
    state.myReactions[s.id] = had ? mine.filter((k) => k !== key) : [...mine, key];
    storageSet("woh-reactions", state.myReactions);
    if (!had) burst(18);
    renderStats();
    renderWall();
    renderGarage();
    renderLeaderboard();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

async function remove(s, btn) {
  if (!confirm(`Delete this shout-out for ${s.agent}? This can't be undone.`)) return;
  if (btn) btn.disabled = true;
  try {
    await api(`/api/shoutouts?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
    state.shoutouts = state.shoutouts.filter((x) => x.id !== s.id);
    render();
  } catch (err) {
    alert(err.message);
    if (btn) btn.disabled = false;
    if (err.status === 401) setLeaderMode("");
  }
}

async function load() {
  try {
    const { shoutouts } = await api("/api/shoutouts");
    // Skip re-rendering (and replaying card animations) when nothing changed.
    if (JSON.stringify(shoutouts) === JSON.stringify(state.shoutouts) && state.loaded) return;
    state.shoutouts = shoutouts;
    state.loaded = true;
  } catch (err) {
    $("#wallEmpty").textContent = `Couldn't reach the pit wall: ${err.message}`;
  }
  render();
}

function showView(name) {
  document.querySelectorAll(".tab").forEach((t) => {
    const on = t.dataset.view === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
}

function setLeaderMode(passcode) {
  state.passcode = passcode;
  sessionSet("woh-pass", passcode);
  $("#unlockForm").hidden = !!passcode;
  $("#postForm").hidden = !passcode;
  renderWall();
  renderManage();
}

// ---------- wiring ----------
function init() {
  startLights();
  state.filters.agent = storageGet("woh-agent", "");
  state.myReactions = storageGet("woh-reactions", {});

  fillSelect($("#fChannel"), CHANNELS, "All channels");
  $("#channelSelect").replaceChildren(...CHANNELS.map((c) => h("option", { value: c }, c)));

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
  document.querySelectorAll("[data-period]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-period]").forEach((x) => x.classList.toggle("active", x === b));
      state.period = Number(b.dataset.period);
      renderLeaderboard();
    }));

  $("#fAgent").addEventListener("change", (e) => setAgent(e.target.value));
  $("#fTeam").addEventListener("change", (e) => { state.filters.team = e.target.value; renderWall(); });
  $("#fChannel").addEventListener("change", (e) => { state.filters.channel = e.target.value; renderWall(); });
  $("#fSearch").addEventListener("input", (e) => { state.filters.search = e.target.value; renderWall(); });

  $("#unlockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#unlockMsg");
    const code = $("#passcode").value;
    try {
      state.passcode = code;
      await api("/api/verify", { method: "POST" });
      $("#passcode").value = "";
      msg.textContent = "";
      setLeaderMode(code);
    } catch (err) {
      state.passcode = "";
      msg.className = "msg err";
      msg.textContent = err.message;
    }
  });

  $("#lockBtn").addEventListener("click", () => setLeaderMode(""));
  $("#manageSearch").addEventListener("input", renderManage);

  $("#postForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const msg = $("#postMsg");
    const data = Object.fromEntries(new FormData(form));
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      const { shoutout } = await api("/api/shoutouts", { method: "POST", body: JSON.stringify(data) });
      state.shoutouts.unshift(shoutout);
      storageSet("woh-leader", data.leader);
      form.reset();
      form.leader.value = data.leader;
      msg.className = "msg ok";
      msg.textContent = `🏁 Posted! ${shoutout.agent} is on the wall.`;
      burst(70);
      render();
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message;
      if (err.status === 401) setLeaderMode("");
    } finally {
      submit.disabled = false;
    }
  });

  $("#postForm").leader.value = storageGet("woh-leader", "");
  setLeaderMode(sessionGet("woh-pass"));
  load();
  // Refresh periodically so a wall left open on a team monitor stays current.
  setInterval(() => { if (!document.hidden) load(); }, 60000);
}

init();
