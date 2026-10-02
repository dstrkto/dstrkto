import { REACTIONS, json, key, store, validId } from "../lib/common.mjs";

// Reactions are counters; viewers toggle them on/off. The browser remembers which
// reactions it has given, so this is a cheer counter, not a vote with identity.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  const { id, reaction } = body;
  const delta = body.delta === -1 ? -1 : 1;
  if (!validId(id) || !REACTIONS.includes(reaction)) {
    return json({ error: "Invalid reaction." }, 400);
  }

  const s = store();
  // Optimistic concurrency: retry when another cheer landed between read and write.
  for (let attempt = 0; attempt < 5; attempt++) {
    const entry = await s.getWithMetadata(key(id), { type: "json" });
    if (!entry) return json({ error: "Shout-out not found." }, 404);
    const shoutout = entry.data;
    shoutout.reactions[reaction] = Math.max(0, (shoutout.reactions[reaction] || 0) + delta);
    const result = await s.setJSON(key(id), shoutout, { onlyIfMatch: entry.etag });
    if (result.modified) return json({ reactions: shoutout.reactions });
  }
  return json({ error: "Busy pit lane, try again." }, 409);
};

export const config = { path: "/api/react" };
