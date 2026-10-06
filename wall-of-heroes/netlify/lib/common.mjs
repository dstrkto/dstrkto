import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

export const CHANNELS = ["Phone", "Chat", "Email", "Social", "SMS", "Video"];
export const REACTIONS = ["flag", "fire", "trophy"];
const PREFIX = "shoutout/";
// Agent nominations wait here until a leader approves them; the public wall never reads this prefix.
const PENDING_PREFIX = "pending/";

export function store() {
  return getStore({ name: "wall-of-heroes", consistency: "strong" });
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// Compares hashes so the comparison is constant-time regardless of input length.
// Surrounding whitespace is ignored on both sides (a common copy/paste slip).
function passcodeMatches(given, expected) {
  expected = (expected || "").trim();
  if (!expected) return false;
  const a = createHash("sha256").update((given || "").trim()).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function isLeader(req) {
  return passcodeMatches(req.headers.get("x-leader-passcode"), process.env.LEADER_PASSCODE);
}

export function agentPasscodeConfigured() {
  return !!(process.env.AGENT_PASSCODE || "").trim();
}

// Agents may only submit nominations. Leaders can do anything agents can.
export function isAgent(req) {
  return passcodeMatches(req.headers.get("x-agent-passcode"), process.env.AGENT_PASSCODE) || isLeader(req);
}

export function clean(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function key(id) {
  return PREFIX + id;
}

export function pendingKey(id) {
  return PENDING_PREFIX + id;
}

export function validId(id) {
  return typeof id === "string" && /^[a-z0-9-]{8,64}$/.test(id);
}

export async function listShoutouts() {
  const s = store();
  const { blobs } = await s.list({ prefix: PREFIX });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return items.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPending() {
  const s = store();
  const { blobs } = await s.list({ prefix: PENDING_PREFIX });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return items.filter(Boolean).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function editableFields(body) {
  return {
    agent: clean(body.agent, 60),
    team: clean(body.team, 40),
    channel: CHANNELS.includes(body.channel) ? body.channel : "Phone",
    verbatim: clean(body.verbatim, 1000),
    customer: clean(body.customer, 60),
    leader: clean(body.leader, 60),
    note: clean(body.note, 280),
  };
}

export function missingFields(f) {
  return !f.agent || !f.verbatim || !f.leader ? "Agent, verbatim, and your name are required." : "";
}
