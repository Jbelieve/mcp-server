/**
 * Gateway client — calls mcp-gateway edge function.
 * Auth priority: MAASY_ACCESS_TOKEN (OAuth) → MAASY_API_KEY (legacy API key)
 */

const GATEWAY_URL_TEMPLATE = "{base}/functions/v1/mcp-gateway";

let gatewayUrl = "";
let authHeader: { name: string; value: string };

export function initGateway() {
  const base = process.env.MAASY_SUPABASE_URL;
  const oauthToken = process.env.MAASY_ACCESS_TOKEN;
  const apiKey = process.env.MAASY_API_KEY;

  if (!base) {
    throw new Error(
      "Missing MAASY_SUPABASE_URL.\n" +
      "Set it to: https://vdlaoswrgppbimjykugn.supabase.co"
    );
  }

  if (oauthToken) {
    // OAuth path — token was set by Claude Desktop after the OAuth flow
    authHeader = { name: "Authorization", value: `Bearer ${oauthToken}` };
    console.error("✅ Gateway (OAuth): authenticated");
  } else if (apiKey) {
    // Legacy API key path
    authHeader = { name: "x-api-key", value: apiKey };
    console.error("✅ Gateway (API key): authenticated");
  } else {
    throw new Error(
      "Missing authentication.\n" +
      "Either complete the OAuth flow in MAASY → Settings → API / MCP\n" +
      "or set MAASY_API_KEY to your API key."
    );
  }

  gatewayUrl = GATEWAY_URL_TEMPLATE.replace("{base}", base);
}

/**
 * Call a tool via the mcp-gateway edge function.
 */
export async function callGateway(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authHeader.name]: authHeader.value,
    },
    body: JSON.stringify({ tool, args }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Gateway error (${res.status})`);
  }

  return data.result;
}
