import { randomUUID } from "node:crypto";
import {
  REACTIONS, editableFields, isAgent, isLeader, json, key, listPending, missingFields, pendingKey, readJson, store,
  validId,
} from "../lib/common.mjs";

// Upper bound on queued nominations, so a leaked agent passcode can't flood the store.
const MAX_PENDING = 300;

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  // Agents (or leaders) submit a nomination. It is not visible on the wall until approved.
  if (req.method === "POST" && !id) {
    if (!isAgent(req)) return json({ error: "Team passcode required." }, 401);
    const body = await readJson(req);
    if (!body) return json({ error: "Invalid JSON." }, 400);
    // Agents can't add a leader note; leaders can add one while reviewing.
    const fields = { ...editableFields(body), note: "" };
    const missing = missingFields(fields);
    if (missing) return json({ error: missing }, 400);
    const s = store();
    const { blobs } = await s.list({ prefix: "pending/" });
    if (blobs.length >= MAX_PENDING) {
      return json({ error: "The approval queue is full. Ask a leader to review pending nominations." }, 429);
    }
    const nomination = { id: randomUUID(), ...fields, source: "agent", submittedAt: new Date().toISOString() };
    await s.setJSON(pendingKey(nomination.id), nomination, { onlyIfNew: true });
    return json({ ok: true }, 201);
  }

  // Everything below is review work for leaders only.
  if (!isLeader(req)) return json({ error: "Leader passcode required." }, 401);

  if (req.method === "GET") {
    return json({ pending: await listPending() });
  }

  if (!validId(id)) return json({ error: "Invalid id." }, 400);
  const s = store();
  const entry = await s.get(pendingKey(id), { type: "json" });
  if (!entry) return json({ error: "This nomination was already reviewed." }, 404);

  // Leader edits a nomination before approving it.
  if (req.method === "PUT") {
    const body = await readJson(req);
    if (!body) return json({ error: "Invalid JSON." }, 400);
    const fields = editableFields(body);
    const missing = missingFields(fields);
    if (missing) return json({ error: missing }, 400);
    const nomination = { ...entry, ...fields, updatedAt: new Date().toISOString() };
    await s.setJSON(pendingKey(id), nomination);
    return json({ nomination });
  }

  // Approve: publish to the wall (dated now, so it shows as new), then remove from the queue.
  if (req.method === "POST" && url.searchParams.get("action") === "approve") {
    const { updatedAt, ...nomination } = entry;
    const shoutout = {
      ...nomination,
      createdAt: new Date().toISOString(),
      reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])),
    };
    const result = await s.setJSON(key(id), shoutout, { onlyIfNew: true });
    await s.delete(pendingKey(id));
    if (!result.modified) return json({ error: "This nomination was already approved." }, 409);
    return json({ shoutout });
  }

  // Reject: discard the nomination.
  if (req.method === "DELETE") {
    await s.delete(pendingKey(id));
    return json({ ok: true });
  }

  return json({ error: "Method not allowed." }, 405);
};

export const config = { path: "/api/nominations" };
