#!/usr/bin/env node
/**
 * @maasy/mcp-server
 *
 * MCP server for Maasy AI Marketing Copilot.
 * Connects Claude (or any MCP client) to your marketing intelligence.
 *
 * Auth: API key generated in maasy Settings.
 * No service role key, no email/password needed.
 *
 * Required env vars:
 *   MAASY_SUPABASE_URL  — https://vdlaoswrgppbimjykugn.supabase.co
 *   MAASY_API_KEY        — Your maasy API key (msy_...)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initGateway, callGateway } from "./supabase.js";

const DEFAULT_PROJECT_ID = process.env.MAASY_PROJECT_ID || "";

// ─── Helper: wrap tool call ──────────────────────────────────────────
function toolHandler(toolName: string, argsFn?: (args: any) => Record<string, unknown>) {
  return async (args: any) => {
    try {
      const gatewayArgs = argsFn ? argsFn(args) : args;
      // Auto-inject default project_id if not provided
      if (DEFAULT_PROJECT_ID && !gatewayArgs.project_id) {
        gatewayArgs.project_id = DEFAULT_PROJECT_ID;
      }
      const result = await callGateway(toolName, gatewayArgs);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true };
    }
  };
}

// ─── Create MCP Server ──────────────────────────────────────────────
const server = new McpServer({
  name: "maasy",
  version: "0.1.0",
  description: "Maasy AI Marketing Copilot — marketing intelligence, brand scanning, content generation, skill management",
});

// ═══════════════════════════════════════════════════════════════════════
// BRAND TOOLS (3)
// ═══════════════════════════════════════════════════════════════════════

server.tool(
  "maasy_list_brands",
  "List all brands (projects) in your maasy account with basic info",
  {},
  toolHandler("list_brands")
);

server.tool(
  "maasy_scan_brand",
  "Deep health scan: DNA completeness, campaigns, content, CRM, SEO, alerts. Returns traffic-light status per area.",
  { project_id: z.string().optional().describe("Brand UUID (uses default if omitted)") },
  toolHandler("scan_brand")
);

server.tool(
  "maasy_get_brand_context",
  "Full brand DNA: name, industry, tone, ICP, value prop, assets, references. Essential for on-brand generation.",
  { project_id: z.string().optional().describe("Brand UUID") },
  toolHandler("get_brand_context")
);

// ═══════════════════════════════════════════════════════════════════════
// SKILLS TOOLS (5) — Teach maasy new marketing knowledge
// ═══════════════════════════════════════════════════════════════════════

server.tool(
  "maasy_list_skills",
  "List all maasy copilot skills — modular knowledge packages (SEO, ads, CRM playbooks, etc).",
  {
    category: z.enum(["copilot", "ads", "ads_manager", "seo_geo", "content", "email", "crm", "funnels", "landing", "video", "cultural", "general"]).optional(),
    active_only: z.boolean().optional().default(true),
  },
  toolHandler("list_skills")
);

server.tool(
  "maasy_get_skill",
  "Get full details of a skill including content and auto-generated quick action pills.",
  { skill_id: z.string().describe("Skill UUID") },
  toolHandler("get_skill")
);

server.tool(
  "maasy_create_skill",
  "Create a new knowledge skill for maasy. Write actionable marketing knowledge in markdown — frameworks, checklists, strategies. " +
  "Auto-generates quick action pills after creation. maasy loads relevant skills based on which tool the user is using.",
  {
    name: z.string().min(3).max(100).describe("Skill name (e.g. 'Meta Ads Scaling Framework')"),
    slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).describe("URL-safe slug (e.g. 'meta-ads-scaling')"),
    category: z.enum(["copilot", "ads", "ads_manager", "seo_geo", "content", "email", "crm", "funnels", "landing", "video", "cultural", "general"]).describe(
      "Which module loads this: copilot=always, ads=Ads Studio, seo_geo=SEO, content=Content Gen, email=Email, crm=CRM, general=everywhere"
    ),
    description: z.string().max(300).optional().describe("Short description"),
    content: z.string().min(50).describe("Knowledge content in markdown. Include frameworks, processes, best practices, examples. Max ~2000 words."),
    priority: z.number().min(0).max(100).optional().default(50).describe("Loading priority (higher=first)"),
    max_tokens: z.number().min(100).max(2000).optional().default(500),
  },
  toolHandler("create_skill")
);

server.tool(
  "maasy_update_skill",
  "Update a skill's content, category, priority, or active status. Regenerates quick action pills if content changes.",
  {
    skill_id: z.string().describe("Skill UUID"),
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.enum(["copilot", "ads", "ads_manager", "seo_geo", "content", "email", "crm", "funnels", "landing", "video", "cultural", "general"]).optional(),
    content: z.string().optional(),
    priority: z.number().min(0).max(100).optional(),
    max_tokens: z.number().min(100).max(2000).optional(),
    is_active: z.boolean().optional(),
  },
  toolHandler("update_skill")
);

server.tool(
  "maasy_delete_skill",
  "Permanently delete a skill. Removes the knowledge from maasy.",
  { skill_id: z.string().describe("Skill UUID") },
  toolHandler("delete_skill")
);

// ═══════════════════════════════════════════════════════════════════════
// MARKETING INTELLIGENCE TOOLS (9)
// ═══════════════════════════════════════════════════════════════════════

server.tool(
  "maasy_get_alerts",
  "Pending copilot alerts: campaign anomalies, lead opportunities, content gaps, SEO drops.",
  {
    project_id: z.string().optional().describe("Brand UUID"),
    limit: z.number().optional().default(20),
  },
  toolHandler("get_alerts")
);

server.tool(
  "maasy_get_campaign_metrics",
  "Ad campaign performance: spend, impressions, clicks, CTR, CPC, conversions, ROAS.",
  {
    project_id: z.string().optional().describe("Brand UUID"),
    days: z.number().optional().default(7).describe("Lookback days"),
  },
  toolHandler("get_campaign_metrics")
);

server.tool(
  "maasy_get_crm_summary",
  "CRM pipeline: leads by status, hot leads, contacts, opportunities, total pipeline value.",
  { project_id: z.string().optional().describe("Brand UUID") },
  toolHandler("get_crm_summary")
);

server.tool(
  "maasy_get_content_pipeline",
  "Content pipeline: drafts, scheduled, published, by status, last N days.",
  {
    project_id: z.string().optional().describe("Brand UUID"),
    days: z.number().optional().default(30),
  },
  toolHandler("get_content_pipeline")
);

server.tool(
  "maasy_get_seo_status",
  "SEO/GEO scores, keyword rankings, visibility trends, top queries.",
  { project_id: z.string().optional().describe("Brand UUID") },
  toolHandler("get_seo_status")
);

server.tool(
  "maasy_generate_content",
  "Generate on-brand social content using maasy AI. Respects brand DNA, tone, ICP.",
  {
    project_id: z.string().optional().describe("Brand UUID"),
    prompt: z.string().describe("What to generate (e.g. '3 Instagram posts about our product launch')"),
    platform: z.enum(["instagram", "facebook", "linkedin", "twitter", "tiktok", "general"]).optional().default("general"),
  },
  toolHandler("generate_content")
);

server.tool(
  "maasy_discover_keywords",
  "AI keyword discovery: clusters, volume estimates, difficulty scores.",
  {
    project_id: z.string().optional().describe("Brand UUID"),
    seed_topic: z.string().optional().describe("Focus topic"),
  },
  toolHandler("discover_keywords")
);

server.tool(
  "maasy_get_daily_summary",
  "Today's operations summary: what happened, what needs attention, recommended actions.",
  { project_id: z.string().optional().describe("Brand UUID") },
  toolHandler("get_daily_summary")
);

server.tool(
  "maasy_execute_action",
  "Execute a copilot action: generate report, redistribute budget, rotate creatives, diagnose campaigns, etc.",
  {
    project_id: z.string().optional().describe("Brand UUID"),
    action: z.enum([
      "generate_weekly_report", "redistribute_budget", "rotate_creatives",
      "recalculate_scores", "send_followup_leads", "diagnose_campaigns",
      "fill_content_gap", "check_email_health",
    ]),
  },
  toolHandler("execute_action")
);

// ═══════════════════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════════════════

server.resource(
  "active-brand",
  "maasy://brand/active",
  async (uri) => {
    if (!DEFAULT_PROJECT_ID) {
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text: "No default brand. Set MAASY_PROJECT_ID or use maasy_list_brands." }] };
    }
    try {
      const ctx = await callGateway("get_brand_context", { project_id: DEFAULT_PROJECT_ID });
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(ctx, null, 2) }] };
    } catch (e: any) {
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${e.message}` }] };
    }
  }
);

server.resource(
  "skills-catalog",
  "maasy://skills/catalog",
  async (uri) => {
    try {
      const skills = await callGateway("list_skills", { active_only: true });
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(skills, null, 2) }] };
    } catch (e: any) {
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${e.message}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════════════════════════════

server.prompt(
  "brand-audit",
  "Complete brand health audit with actionable recommendations",
  { project_id: z.string().optional().describe("Brand UUID") },
  async (args) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: [
          `Run a complete marketing audit for my brand${args.project_id ? ` (project: ${args.project_id})` : ""}.`,
          "",
          "1. maasy_scan_brand → overall health",
          "2. maasy_get_campaign_metrics → ad performance",
          "3. maasy_get_crm_summary → pipeline status",
          "4. maasy_get_content_pipeline → content status",
          "5. maasy_get_seo_status → SEO/GEO scores",
          "6. maasy_get_alerts → pending issues",
          "",
          "Provide: executive summary (3 bullets), top 3 critical issues, top 3 opportunities, weekly action plan.",
        ].join("\n"),
      },
    }],
  })
);

server.prompt(
  "teach-maasy",
  "Create a new skill to teach maasy specialized marketing knowledge",
  {
    topic: z.string().describe("Marketing topic (e.g. 'B2B LinkedIn Strategy')"),
    category: z.string().optional().describe("Module: ads, seo_geo, content, email, crm, funnels, landing, general"),
  },
  async (args) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: [
          `Teach maasy about: "${args.topic}"`,
          "",
          "1. Use maasy_list_skills to see current knowledge",
          `2. Use maasy_create_skill with category "${args.category || "general"}"`,
          "",
          "Content should include: framework/methodology, best practices, metrics + benchmarks, 2-3 examples, decision tree.",
          "Write as instructions for an AI copilot. Markdown. Under 2000 words.",
        ].join("\n"),
      },
    }],
  })
);

server.prompt(
  "weekly-strategy",
  "Generate a weekly marketing strategy and action plan",
  { project_id: z.string().optional().describe("Brand UUID") },
  async (args) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: [
          `Weekly marketing strategy for my brand${args.project_id ? ` (${args.project_id})` : ""}.`,
          "",
          "Scan brand, check alerts, get 14-day campaign metrics, check content pipeline.",
          "Then create Mon-Fri plan: audit, content, campaigns, CRM, reporting.",
          "For each day, suggest maasy_execute_action calls.",
        ].join("\n"),
      },
    }],
  })
);

// ═══════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  initGateway();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🐙 Maasy MCP server running — 17 tools, 2 resources, 3 prompts");
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
