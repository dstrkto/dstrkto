import { randomUUID } from "node:crypto";
import { CHANNELS, REACTIONS, clean, isLeader, json, key, listShoutouts, store, validId } from "../lib/common.mjs";

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return json({ shoutouts: await listShoutouts() });
  }

  if (!isLeader(req)) {
    return json({ error: "Leader passcode required." }, 401);
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }
    const shoutout = {
      id: randomUUID(),
      agent: clean(body.agent, 60),
      team: clean(body.team, 40),
      channel: CHANNELS.includes(body.channel) ? body.channel : "Phone",
      verbatim: clean(body.verbatim, 1000),
      customer: clean(body.customer, 60),
      leader: clean(body.leader, 60),
      note: clean(body.note, 280),
      createdAt: new Date().toISOString(),
      reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])),
    };
    if (!shoutout.agent || !shoutout.verbatim || !shoutout.leader) {
      return json({ error: "Agent, verbatim, and leader name are required." }, 400);
    }
    await store().setJSON(key(shoutout.id), shoutout, { onlyIfNew: true });
    return json({ shoutout }, 201);
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
