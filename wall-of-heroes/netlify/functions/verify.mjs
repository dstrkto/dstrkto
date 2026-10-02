import { isLeader, json } from "../lib/common.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  return isLeader(req) ? json({ ok: true }) : json({ error: "Wrong passcode." }, 401);
};

export const config = { path: "/api/verify" };
