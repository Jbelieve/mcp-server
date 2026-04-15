# @maasy-ai/mcp-server

**MCP server for Maasy** — connect Claude to your marketing intelligence.

Give Claude direct access to your brand DNA, campaigns, CRM, SEO, and content pipeline. Ask Claude to scan your brand, generate content, redistribute ad budget, or create marketing skills — all from Claude Desktop or Claude Code.

---

## Quick install

### Claude Desktop (one click)

Go to **Maasy → Settings → API / MCP** and click **"Instalar en Claude Desktop"**. Done.

### Manual setup

**Step 1:** Get your API key from [Maasy Settings → API / MCP](https://app.maasy.io/settings?tab=api)

**Step 2:** Add to your Claude Desktop config:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "maasy": {
      "command": "npx",
      "args": ["@maasy-ai/mcp-server"],
      "env": {
        "MAASY_SUPABASE_URL": "https://vdlaoswrgppbimjykugn.supabase.co",
        "MAASY_API_KEY": "msy_your_api_key_here"
      }
    }
  }
}
```

**Step 3:** Restart Claude Desktop. Maasy appears in your MCP connectors.

---

## What you can do

### Brand intelligence
- Scan brand health: DNA completeness, campaigns, content, CRM, SEO, alerts
- Get full brand DNA: tone of voice, ICP, value proposition, assets, references
- List all brands with traffic-light status

### Marketing actions
- Generate on-brand social content for any platform
- Discover SEO keywords
- Rotate fatigued ad creatives
- Redistribute budget between campaigns
- Diagnose underperforming campaigns
- Recalculate CRM lead scores
- Fill content calendar gaps

### Skills — teach Maasy new knowledge
- Create specialized skills (e.g. "TikTok expert for pet brands")
- List, edit, and delete existing skills
- Maasy uses skills in the copilot automatically

### Daily intelligence
- Campaign metrics: spend, CTR, CPC, ROAS
- CRM summary: hot leads, contacts, opportunities, pipeline value
- Content pipeline by status and network
- SEO/GEO visibility, mentions, citations
- Pending alerts that need attention
- Daily consolidated operations summary

---

## Example prompts

```
Scan my brand in Maasy
```
```
What pending alerts does my brand have?
```
```
Give me campaign metrics for the last 7 days
```
```
Generate 3 Instagram posts about my main product
```
```
Create a Maasy skill about email marketing for e-commerce
```
```
Give me today's daily summary for my main brand
```

---

## Tools reference

| Tool | Description |
|------|-------------|
| `maasy_list_brands` | List all brands with basic info and health status |
| `maasy_scan_brand` | Deep health scan across DNA, campaigns, content, CRM, SEO |
| `maasy_get_brand_context` | Full brand DNA: tone, ICP, value prop, colors, assets |
| `maasy_get_alerts` | Pending copilot alerts: anomalies, opportunities, gaps |
| `maasy_get_campaign_metrics` | Ad performance: spend, CTR, CPC, ROAS by period |
| `maasy_get_crm_summary` | CRM pipeline: hot leads, contacts, opportunities, value |
| `maasy_get_content_pipeline` | Content status by network and publication state |
| `maasy_get_seo_status` | SEO/GEO scores, keyword rankings, citations |
| `maasy_get_daily_summary` | Consolidated daily summary of all operations |
| `maasy_generate_content` | Generate on-brand content for any platform |
| `maasy_discover_keywords` | AI-powered keyword discovery for SEO |
| `maasy_execute_action` | Execute actions: reports, budget, creatives, lead scoring |
| `maasy_list_skills` | Browse all Maasy copilot skills by category |
| `maasy_get_skill` | Read a skill's full content |
| `maasy_create_skill` | Create new marketing knowledge skill |
| `maasy_update_skill` | Update skill content, category, or priority |
| `maasy_delete_skill` | Remove a skill permanently |

---

## Requirements

- Node.js 18+
- A [Maasy](https://maasy.io) account
- Claude Desktop or any MCP-compatible client

---

Built by the [Maasy](https://maasy.io) team
