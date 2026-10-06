import { isAgent, isLeader, json } from "../lib/common.mjs";

// POST /api/verify checks the leader passcode; POST /api/verify?role=agent checks the team passcode.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const ok = new URL(req.url).searchParams.get("role") === "agent" ? isAgent(req) : isLeader(req);
  return ok ? json({ ok: true }) : json({ error: "Wrong passcode." }, 401);
};

export const config = { path: "/api/verify" };
