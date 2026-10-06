const CHANNELS = ["Phone", "Chat", "Email", "Social", "SMS", "Video"];
const REACTIONS = [
  { key: "flag", label: "Flag" },
  { key: "fire", label: "On fire" },
  { key: "trophy", label: "Trophy" },
];
// Livery pairs from the JLR palette: [primary, secondary, plate ink].
const LIVERIES = [
  ["#1983C0", "#41BDED", "#fff"], ["#4E8951", "#95C98F", "#fff"], ["#B6571E", "#DF6F21", "#fff"],
  ["#5C7482", "#9DBDCE", "#fff"], ["#637364", "#9AA99D", "#fff"], ["#96553E", "#BF7F56", "#fff"],
  ["#000000", "#EEECE1", "#fff"], ["#2A2A2A", "#41BDED", "#fff"],
];
const DAY = 86400000;

const state = {
  shoutouts: [],
  loaded: false,
  loading: true,
  error: "",
  filters: { agent: "", team: "", channel: "", search: "" },
  period: 7,
  passcode: "",
  myReactions: {},
  saving: new Set(),
  pendingDelete: null,
};

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
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
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function hash(str) {
  let x = 7;
  for (const ch of str.toLowerCase()) x = (x * 31 + ch.codePointAt(0)) >>> 0;
  return x;
}
// First letter of the first and last word ("Audrey Scolny" -> "AS"), skipping punctuation.
function initials(name) {
  const words = name.trim().split(/\s+/)
    .map((w) => w.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean);
  if (!words.length) return "?";
  return (words.length > 1 ? words[0] + words[words.length - 1] : words[0]).toUpperCase();
}
const livery = (name) => LIVERIES[(hash(name) >>> 4) % LIVERIES.length];
const liveryVars = (name) => {
  const [c1, c2, ink] = livery(name);
  return `--c1:${c1};--c2:${c2};--ink:${ink}`;
};
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const fmt = (n) => n.toLocaleString("en-GB");
const plural = (n, word) => `${fmt(n)} ${word}${n === 1 ? "" : "s"}`;
const cheers = (s) => Object.values(s.reactions || {}).reduce((a, b) => a + b, 0);
const snip = (text, max = 140) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);
const withinDays = (iso, days) => !days || Date.now() - new Date(iso).getTime() < days * DAY;
const uniqueSorted = (arr) =>
  [...new Map(arr.filter(Boolean).map((v) => [v.toLowerCase(), v])).values()].sort((a, b) => a.localeCompare(b));

function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const hr = Math.round(m / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return d < 30 ? `${d}d ago` : `${Math.round(d / 30)}mo ago`;
}
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (state.passcode) headers["x-leader-passcode"] = state.passcode;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

// ---------- celebration burst ----------
function burst(x, y, big) {
  if (reducedMotion()) return;
  const layer = $("#bursts");
  const group = h("div");
  const colors = ["var(--accent-1)", "#111", "#fff", "checker", "var(--accent-2)"];
  const n = big ? 70 : 18;
  for (let i = 0; i < n; i++) {
    const a = big ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const d = (big ? 220 : 70) + Math.random() * (big ? 360 : 90);
    const size = big ? 8 + Math.random() * 12 : 5 + Math.random() * 5;
    const c = colors[i % colors.length];
    const checker = c === "checker";
    group.append(h("span", {
      style: `left:${x}px;top:${y}px;width:${size}px;height:${size * (checker ? 0.7 : 1)}px;` +
        `background:${checker ? "repeating-conic-gradient(#111 0 25%, #fff 0 50%) 0 0/6px 6px" : c};` +
        `${checker || c === "#fff" ? "border:1px solid #111;" : ""}` +
        `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d + (big ? 120 : 30)}px;` +
        `--rot:${Math.round(Math.random() * 720 - 360)}deg;--dur:${(big ? 1100 : 700) + Math.random() * 400}ms`,
    }));
  }
  layer.append(group);
  setTimeout(() => group.remove(), 1700);
}

// ---------- start lights ----------
function startLights() {
  if (reducedMotion() || sessionGet("woh-lights")) return;
  sessionSet("woh-lights", "1");
  const intro = $("#intro");
  const bulbs = intro.querySelectorAll(".lights span");
  const timers = [];
  const close = () => { timers.forEach(clearTimeout); intro.remove(); };
  intro.hidden = false;
  bulbs.forEach((b, i) => timers.push(setTimeout(() => b.classList.add("on"), (i + 1) * 300)));
  timers.push(setTimeout(() => bulbs.forEach((b) => b.classList.remove("on")), 2000));
  timers.push(setTimeout(() => intro.classList.add("fade"), 2050));
  timers.push(setTimeout(close, 2400));
  intro.addEventListener("click", close);
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

const plate = (name, size = "") =>
  h("div", { class: `plate ${size}`, style: liveryVars(name), "aria-hidden": "true" }, initials(name));

function card(s, i) {
  const mine = state.myReactions[s.id] || [];
  const len = s.verbatim.length;
  return h("article", {
    class: "card", style: `${liveryVars(s.agent)};animation-delay:${Math.min(i, 8) * 60}ms`,
    "aria-label": `Shout-out for ${s.agent}`,
  },
    h("div", { class: "livery", "aria-hidden": "true" }, h("span"), h("span")),
    h("div", { class: "card-body" },
      h("div", { class: "card-head" },
        plate(s.agent),
        h("div", { class: "driver" },
          h("button", { class: "driver-name", title: `Show ${s.agent}’s call-outs`, onclick: () => setAgent(s.agent) }, s.agent),
          h("div", { class: "tags" },
            s.team && h("span", { class: "tag team" }, s.team),
            h("span", { class: "tag" }, s.channel),
          ),
        ),
        state.passcode && h("button", {
          class: "btn-small", "aria-label": `Delete shout-out for ${s.agent}`, onclick: () => askDelete(s),
        }, "Delete"),
      ),
      h("blockquote", {},
        h("div", { class: "qmark", "aria-hidden": "true" }, "“"),
        h("p", { class: `quote ${len < 80 ? "s" : len < 240 ? "m" : ""}` }, s.verbatim),
        s.customer && h("footer", { class: "cust" }, `– ${s.customer}`),
      ),
      s.note && h("div", { class: "note" }, h("div", { class: "label" }, "Pit wall note"), h("div", {}, s.note)),
      h("div", { class: "card-foot" },
        h("div", { class: "flagged" }, "Flagged by ", h("b", {}, s.leader), ` · ${timeAgo(s.createdAt)}`),
        h("div", { class: "reacts", role: "group", "aria-label": "Cheers" },
          REACTIONS.map((r) => {
            const on = mine.includes(r.key);
            const count = s.reactions?.[r.key] || 0;
            return h("button", {
              class: "react", "aria-pressed": String(on), disabled: state.saving.has(`${s.id}:${r.key}`),
              "aria-label": `${r.label}: ${count}${on ? ", you cheered" : ""}`,
              onclick: (e) => react(s, r.key, e.currentTarget),
            }, h("span", { class: `mark ${r.key}`, "aria-hidden": "true" }), h("span", {}, r.label), h("span", { class: "n" }, count));
          }),
        ),
      ),
    ),
  );
}

function renderStats() {
  const all = state.shoutouts;
  $("#statTotal").textContent = fmt(all.length);
  $("#statDrivers").textContent = fmt(uniqueSorted(all.map((s) => s.agent)).length);
  $("#statWeek").textContent = fmt(all.filter((s) => withinDays(s.createdAt, 7)).length);
  $("#statCheers").textContent = fmt(all.reduce((n, s) => n + cheers(s), 0));
}

function fillSelect(sel, values, allLabel, current) {
  sel.replaceChildren(h("option", { value: "" }, allLabel), ...values.map((v) => h("option", { value: v }, v)));
  sel.value = values.find((v) => sameName(v, current || "")) || "";
}

function renderFilters() {
  const agents = uniqueSorted(state.shoutouts.map((s) => s.agent));
  const teams = uniqueSorted(state.shoutouts.map((s) => s.team));
  const { agent, team } = state.filters;
  // Keep a remembered driver selectable before their first shout-out exists.
  const agentOpts = agent && !agents.some((a) => sameName(a, agent)) ? [...agents, agent] : agents;
  fillSelect($("#fAgent"), agentOpts, "All drivers", agent);
  fillSelect($("#fTeam"), teams, "All teams", team);
  $("#agentList").replaceChildren(...agents.map((a) => h("option", { value: a })));
  $("#teamList").replaceChildren(...teams.map((t) => h("option", { value: t })));
  const n = Object.values(state.filters).filter(Boolean).length;
  $("#filterSummary").textContent = n ? `${n} active` : "All";
}

function renderGarage() {
  const g = $("#garage");
  const name = state.filters.agent;
  if (!name) { g.hidden = true; return; }
  const mine = state.shoutouts.filter((s) => sameName(s.agent, name));
  const week = mine.filter((s) => withinDays(s.createdAt, 7)).length;
  const pos = standings(state.shoutouts, "agent").findIndex((r) => sameName(r.label, name)) + 1;
  g.style.cssText = liveryVars(name);
  g.replaceChildren(
    plate(name, "lg"),
    h("div", { class: "garage-main" },
      h("h2", {}, mine.length ? `${name}’s Garage` : `Welcome to the grid, ${name.split(" ")[0]}`),
      h("div", { class: "garage-sub" }, mine.length
        ? `${plural(mine.length, "call-out")} · ${plural(mine.reduce((n, s) => n + cheers(s), 0), "cheer")}`
        : "No call-outs yet. Your first checkered flag is coming."),
      h("div", { class: "badges" },
        pos > 0 && mine.length > 0 && h("span", { class: "badge" }, `P${pos} all-time`),
        week > 0 && h("span", { class: "badge" }, `${week} this week`),
      ),
    ),
    h("button", { class: "btn-outline", onclick: () => setAgent("") }, "Show everyone"),
  );
  g.hidden = false;
}

function renderWall() {
  const loading = state.loading && !state.loaded;
  const error = !state.loaded && !!state.error;
  const list = state.loaded ? filtered() : [];
  $("#wallLoading").replaceChildren(...(loading
    ? [64, 120, 84, 140, 72, 100].map((ht) => h("div", { class: "skeleton" },
        h("div", { class: "sk-head" }, h("span"), h("span")),
        h("div", { style: `height:${ht}px` }),
        h("div", { style: "height:12px;width:60%" })))
    : []));
  $("#wallError").hidden = !error;
  $("#wallErrorMsg").textContent = state.error;
  $("#wallEmpty").hidden = loading || error || list.length > 0;
  $("#clearFilters").hidden = !Object.values(state.filters).some(Boolean);
  $("#wall").replaceChildren(...list.map(card));
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
    ? rows.slice(0, 15).map((r, i) => h("li", {},
        h("span", { class: "p" }, `P${i + 1}`),
        h("span", { class: "nm", title: r.label }, r.label),
        h("span", { class: "bar", "aria-hidden": "true" }, h("span", { style: `width:${Math.max(4, (r.count / max) * 100)}%` })),
        h("span", { class: "ct", title: plural(r.cheers, "cheer") }, r.count)))
    : [h("li", { class: "none" }, "No entries in this period.")]));
}

function renderLeaderboard() {
  const items = state.shoutouts.filter((s) => withinDays(s.createdAt, state.period));
  const drivers = standings(items, "agent");
  $("#poleEmpty").hidden = drivers.length > 0;
  $("#poleContent").hidden = drivers.length === 0;
  // Visual order 2 – 1 – 3, with 1st tallest.
  $("#podium").replaceChildren(...[1, 0, 2].map((i) => {
    const d = drivers[i];
    return h("div", { class: "step" },
      d && h("div", { class: "step-who" },
        plate(d.label, i === 0 ? "lg" : "md"),
        h("div", { class: "step-name" }, d.label),
        h("div", { class: "step-sub" }, `${plural(d.count, "call-out")} · ${plural(d.cheers, "cheer")}`)),
      h("div", { class: `block p${i + 1}${d ? "" : " empty"}`, "aria-label": d ? `Position ${i + 1}` : `Position ${i + 1}: open` },
        h("div", { class: "pos" }, i + 1)));
  }));
  renderBoard($("#driverStandings"), drivers);
  renderBoard($("#teamStandings"), standings(items, "team"));
}

function renderManage() {
  if (!state.passcode) return;
  const q = $("#manageSearch").value.trim().toLowerCase();
  const all = state.shoutouts;
  const list = all.filter((s) => !q || [s.agent, s.team, s.leader, s.verbatim, s.note].join(" ").toLowerCase().includes(q));
  $("#manageCount").textContent = `${fmt(list.length)} of ${plural(all.length, "post")}`;
  const empty = all.length === 0 ? "No posts yet." : list.length === 0 ? "No posts match." : "";
  $("#manageEmpty").textContent = empty;
  $("#manageEmpty").hidden = !empty;
  $("#manageList").replaceChildren(...list.map((s) =>
    h("div", { class: "mrow", style: liveryVars(s.agent) },
      h("div", { class: "stripe", "aria-hidden": "true" }),
      h("div", { class: "mrow-main" },
        h("div", { class: "mrow-title" }, h("b", {}, s.agent), [s.team, s.channel].filter(Boolean).map((t) => ` · ${t}`).join("")),
        h("div", { class: "mrow-snip" }, snip(s.verbatim)),
        h("div", { class: "small" }, `Posted by ${s.leader} · ${fmtDate(s.createdAt)}`)),
      h("button", { class: "btn-small", "aria-label": `Delete shout-out for ${s.agent}`, onclick: () => askDelete(s) }, "Delete"))));
}

function render() {
  renderStats();
  renderFilters();
  renderGarage();
  renderWall();
  renderLeaderboard();
  renderManage();
}

// ---------- actions ----------
function setAgent(name) {
  state.filters.agent = name;
  storageSet("woh-agent", name);
  showView("wall");
  render();
}

async function react(s, key, btn) {
  const id = `${s.id}:${key}`;
  if (state.saving.has(id)) return;
  const mine = state.myReactions[s.id] || [];
  const had = mine.includes(key);
  if (!had) {
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, false);
  }
  state.saving.add(id);
  btn.disabled = true;
  try {
    const { reactions } = await api("/api/react", {
      method: "POST",
      body: JSON.stringify({ id: s.id, reaction: key, delta: had ? -1 : 1 }),
    });
    s.reactions = reactions;
    state.myReactions[s.id] = had ? mine.filter((k) => k !== key) : [...mine, key];
    storageSet("woh-reactions", state.myReactions);
  } catch (err) {
    alert(err.message);
  } finally {
    state.saving.delete(id);
    renderStats();
    renderWall();
    renderGarage();
    renderLeaderboard();
  }
}

// Delete confirmation modal
function askDelete(s) {
  state.pendingDelete = s;
  $("#modalTitle").textContent = `Delete this shout-out for ${s.agent}?`;
  $("#modalSnip").textContent = `“${snip(s.verbatim)}”`;
  $("#modalErr").hidden = true;
  setDeleting(false);
  $("#modal").hidden = false;
  $("#modalCancel").focus();
}
function closeModal() {
  if ($("#modalConfirm").disabled) return;
  $("#modal").hidden = true;
  state.pendingDelete = null;
}
function setDeleting(on) {
  $("#modalConfirm").disabled = on;
  $("#modalConfirm").textContent = on ? "Deleting…" : "Delete";
}
async function confirmDelete() {
  const s = state.pendingDelete;
  if (!s) return;
  setDeleting(true);
  try {
    await api(`/api/shoutouts?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
    state.shoutouts = state.shoutouts.filter((x) => x.id !== s.id);
    setDeleting(false);
    closeModal();
    render();
  } catch (err) {
    setDeleting(false);
    $("#modalErrMsg").textContent = err.message;
    $("#modalErr").hidden = false;
    if (err.status === 401) { closeModal(); setLeaderMode(""); }
  }
}

async function load() {
  try {
    const { shoutouts } = await api("/api/shoutouts");
    state.error = "";
    // Skip re-rendering (and replaying card animations) when nothing changed.
    if (state.loaded && JSON.stringify(shoutouts) === JSON.stringify(state.shoutouts)) return;
    state.shoutouts = shoutouts;
    state.loaded = true;
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
  }
  render();
}

function showView(name) {
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.view === name)));
  document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== `view-${name}`; });
}

function setLeaderMode(passcode) {
  state.passcode = passcode;
  sessionSet("woh-pass", passcode);
  $("#locked").hidden = !!passcode;
  $("#unlocked").hidden = !passcode;
  renderWall();
  renderManage();
}

// ---------- post form ----------
function setFieldError(form, name, msg) {
  const field = form.elements[name];
  field.setAttribute("aria-invalid", msg ? "true" : "false");
  form.querySelector(`.field-err[data-for="${name}"]`).textContent = msg;
}

function updateCounts(form) {
  const v = form.verbatim.value.length;
  $("#vCount").textContent = `${fmt(v)} / 1,000`;
  $("#vCount").classList.toggle("near", v > 900);
  $("#nCount").textContent = `${fmt(form.note.value.length)} / 280`;
}

async function submitPost(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const required = { agent: "Add the agent’s name.", leader: "Add your name.", verbatim: "Add the customer’s words." };
  let firstBad = null;
  for (const [k, msg] of Object.entries(required)) {
    const bad = !String(data[k] || "").trim();
    setFieldError(form, k, bad ? msg : "");
    if (bad && !firstBad) firstBad = form.elements[k];
  }
  $("#postOk").hidden = true;
  $("#postErr").hidden = true;
  if (firstBad) { firstBad.focus(); return; }

  const btn = $("#submitBtn");
  btn.disabled = true;
  $("#submitLabel").textContent = "Waving…";
  try {
    const { shoutout } = await api("/api/shoutouts", { method: "POST", body: JSON.stringify(data) });
    state.shoutouts.unshift(shoutout);
    storageSet("woh-leader", data.leader.trim());
    form.reset();
    form.leader.value = data.leader.trim();
    updateCounts(form);
    $("#postOkName").textContent = shoutout.agent;
    $("#postOk").hidden = false;
    burst(window.innerWidth / 2, window.innerHeight * 0.45, true);
    render();
  } catch (err) {
    $("#postErrMsg").textContent = err.status === 401
      ? "Your passcode is no longer valid. Unlock Pit Lane again."
      : `Couldn’t post to the pit wall. ${err.message}`;
    $("#postErr").hidden = false;
    if (err.status === 401) setLeaderMode("");
  } finally {
    btn.disabled = false;
    $("#submitLabel").textContent = "Wave the flag";
  }
}

// ---------- wiring ----------
function init() {
  startLights();
  state.filters.agent = storageGet("woh-agent", "");
  state.myReactions = storageGet("woh-reactions", {});

  fillSelect($("#fChannel"), CHANNELS, "All channels", "");
  $("#channelSelect").replaceChildren(...CHANNELS.map((c) => h("option", { value: c }, c)));

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
  document.querySelectorAll("[data-period]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-period]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      state.period = Number(b.dataset.period);
      renderLeaderboard();
    }));

  $("#filterToggle").addEventListener("click", (e) => {
    const open = $("#filters").classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });
  $("#fAgent").addEventListener("change", (e) => setAgent(e.target.value));
  $("#fTeam").addEventListener("change", (e) => { state.filters.team = e.target.value; renderFilters(); renderWall(); });
  $("#fChannel").addEventListener("change", (e) => { state.filters.channel = e.target.value; renderFilters(); renderWall(); });
  $("#fSearch").addEventListener("input", (e) => { state.filters.search = e.target.value; renderFilters(); renderWall(); });
  $("#clearFilters").addEventListener("click", () => {
    state.filters.team = state.filters.channel = state.filters.search = "";
    $("#fChannel").value = "";
    $("#fSearch").value = "";
    setAgent("");
  });

  $("#unlockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#passcode");
    const code = input.value;
    try {
      state.passcode = code;
      await api("/api/verify", { method: "POST" });
      input.value = "";
      input.removeAttribute("aria-invalid");
      $("#passErr").hidden = true;
      setLeaderMode(code);
    } catch (err) {
      state.passcode = "";
      $("#passErrMsg").textContent = err.message;
      $("#passErr").hidden = false;
      input.setAttribute("aria-invalid", "true");
    }
  });
  $("#passcode").addEventListener("input", () => { $("#passErr").hidden = true; $("#passcode").removeAttribute("aria-invalid"); });
  $("#lockBtn").addEventListener("click", () => { $("#postOk").hidden = true; setLeaderMode(""); });

  const form = $("#postForm");
  form.addEventListener("submit", submitPost);
  form.addEventListener("input", (e) => {
    updateCounts(form);
    if (e.target.name && form.querySelector(`.field-err[data-for="${e.target.name}"]`)) setFieldError(form, e.target.name, "");
  });
  form.leader.value = storageGet("woh-leader", "");
  $("#manageSearch").addEventListener("input", renderManage);

  $("#modal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
  $("#modalCancel").addEventListener("click", closeModal);
  $("#modalConfirm").addEventListener("click", confirmDelete);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });

  showView("wall");
  setLeaderMode(sessionGet("woh-pass"));
  render();
  load();
  // Refresh periodically so a wall left open on a team monitor stays current.
  setInterval(() => { if (!document.hidden) load(); }, 60000);
}

init();
