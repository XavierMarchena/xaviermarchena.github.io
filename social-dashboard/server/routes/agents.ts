import { Hono } from "hono";
import { runAgent } from "../agents.js";

const route = new Hono();

route.get("/list", (c) => {
  return c.json([
    { id: "orchestrator", mode: "primary" },
    { id: "x-social", mode: "subagent" },
    { id: "linkedin-social", mode: "subagent" },
    { id: "designer", mode: "subagent" },
    { id: "developer", mode: "subagent" },
  ]);
});

route.post("/run", async (c) => {
  const body = await c.req.json<{ agent: string; prompt: string }>();
  if (!body?.agent || !body?.prompt) {
    return c.json({ error: "agent and prompt required" }, 400);
  }
  try {
    const result = await runAgent(body.agent, body.prompt);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: String(e?.message ?? e) }, 500);
  }
});

export default route;