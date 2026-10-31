const PORTFOLIO_REPO = process.env.PORTFOLIO_REPO_PATH ?? "C:\\Users\\xavim\\xaviermarchena.github.io";

let instance: any = null;

async function getInstance() {
  if (!instance) {
    const { OpenCode } = await import("@opencode/sdk");
    instance = await OpenCode.create({ config: { directory: PORTFOLIO_REPO } } as any);
  }
  return instance;
}

export async function runAgent(agent: string, prompt: string): Promise<{ sessionId: string; output: string }> {
  const oc = await getInstance();
  const session = await oc.sessions.create({ agent });
  await oc.sessions.prompt({ sessionID: session.id, text: prompt });
  const msgs = await oc.sessions.context({ sessionID: session.id });
  const last = (msgs as any[]).filter((m) => m.role === "assistant").pop();
  const output = (last?.parts ?? []).map((p: any) => p.text ?? "").join("") || JSON.stringify(last ?? {});
  return { sessionId: session.id, output };
}

export async function closeInstance() {
  if (instance) {
    await instance.close();
    instance = null;
  }
}