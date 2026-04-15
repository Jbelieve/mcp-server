/**
 * Gateway client — calls mcp-gateway edge function with API key auth.
 * No service role key or email/password needed.
 */

const GATEWAY_URL_TEMPLATE = "{base}/functions/v1/mcp-gateway";

let gatewayUrl = "";
let apiKey = "";

export function initGateway() {
  const base = process.env.MAASY_SUPABASE_URL;
  apiKey = process.env.MAASY_API_KEY || "";

  if (!base) {
    throw new Error("Missing MAASY_SUPABASE_URL.\n" + "Set it to: https://vdlaoswrgppbimjykugn.supabase.co");
  }
  if (!apiKey) {
    throw new Error(
      "Missing MAASY_API_KEY.\n" + "Generate one in maasy → Settings → API Key, then add it to your MCP config."
    );
  }

  gatewayUrl = GATEWAY_URL_TEMPLATE.replace("{base}", base);
  console.error(`✅ Gateway: ${gatewayUrl}`);
}

/**
 * Call a tool via the mcp-gateway edge function.
 */
export async function callGateway(tool: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ tool, args }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Gateway error (${res.status})`);
  }

  return data.result;
}
