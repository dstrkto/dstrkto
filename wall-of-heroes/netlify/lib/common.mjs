import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

export const CHANNELS = ["Phone", "Chat", "Email", "Social", "SMS", "Video"];
export const REACTIONS = ["flag", "fire", "trophy"];
const PREFIX = "shoutout/";

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
export function isLeader(req) {
  const expected = process.env.LEADER_PASSCODE;
  if (!expected) return false;
  const given = req.headers.get("x-leader-passcode") || "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function clean(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function key(id) {
  return PREFIX + id;
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
