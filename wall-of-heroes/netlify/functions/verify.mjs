import { agentPasscodeConfigured, isAgent, isLeader, json } from "../lib/common.mjs";

const NOT_CONFIGURED =
  "The team passcode isn’t set up on the server yet. A leader needs to set AGENT_PASSCODE in Netlify and redeploy.";

// POST /api/verify checks the leader passcode; POST /api/verify?role=agent checks the team passcode.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const agent = new URL(req.url).searchParams.get("role") === "agent";
  if (agent && !agentPasscodeConfigured() && !isLeader(req)) return json({ error: NOT_CONFIGURED }, 503);
  const ok = agent ? isAgent(req) : isLeader(req);
  return ok ? json({ ok: true }) : json({ error: "Wrong passcode." }, 401);
};

export const config = { path: "/api/verify" };
