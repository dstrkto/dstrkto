import { randomUUID } from "node:crypto";
import {
  REACTIONS, editableFields, isLeader, json, key, listShoutouts, missingFields, readJson, store, validId,
} from "../lib/common.mjs";

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return json({ shoutouts: await listShoutouts() });
  }

  if (!isLeader(req)) {
    return json({ error: "Leader passcode required." }, 401);
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    if (!body) return json({ error: "Invalid JSON." }, 400);
    const shoutout = {
      id: randomUUID(),
      ...editableFields(body),
      createdAt: new Date().toISOString(),
      reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])),
    };
    const missing = missingFields(shoutout);
    if (missing) return json({ error: missing }, 400);
    await store().setJSON(key(shoutout.id), shoutout, { onlyIfNew: true });
    return json({ shoutout }, 201);
  }

  // Edit: replaces only the text fields; id, createdAt and reactions are kept.
  if (req.method === "PUT") {
    const id = url.searchParams.get("id");
    if (!validId(id)) return json({ error: "Invalid id." }, 400);
    const body = await readJson(req);
    if (!body) return json({ error: "Invalid JSON." }, 400);
    const fields = editableFields(body);
    const missing = missingFields(fields);
    if (missing) return json({ error: missing }, 400);

    const s = store();
    // Retry if a cheer lands between the read and the write, so it isn't lost.
    for (let attempt = 0; attempt < 5; attempt++) {
      const entry = await s.getWithMetadata(key(id), { type: "json" });
      if (!entry) return json({ error: "This shout-out no longer exists." }, 404);
      const shoutout = { ...entry.data, ...fields, updatedAt: new Date().toISOString() };
      const result = await s.setJSON(key(id), shoutout, { onlyIfMatch: entry.etag });
      if (result.modified) return json({ shoutout });
    }
    return json({ error: "Busy pit lane, try again." }, 409);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!validId(id)) return json({ error: "Invalid id." }, 400);
    await store().delete(key(id));
    return json({ ok: true });
  }

  return json({ error: "Method not allowed." }, 405);
};

export const config = { path: "/api/shoutouts" };
