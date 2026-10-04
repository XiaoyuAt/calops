// CalOps — Mastra agent 定义
import "../../env";
import { Agent } from "@mastra/core/agent";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  classifyEmailTool,
  updateEventTool,
  detectConflictsTool,
  genDigestTool,
  searchContextTool,
} from "../tools";

// LLM 选择：Neon AI Gateway（优先）→ OpenRouter → 占位（工具链路不受影响，问答环节报错提示）
function llmConfig() {
  const mk = (baseURL: string, apiKey: string) => {
    const provider = createOpenAICompatible({ name: "llm", baseURL, apiKey });
    return provider.chatModel(process.env.LLM_MODEL || "openai/gpt-4o-mini");
  };
  const gwUrl = process.env.NEON_AI_GATEWAY_URL;
  const gwKey = process.env.NEON_AI_GATEWAY_API_KEY;
  if (gwUrl && gwKey) return mk(`${gwUrl.replace(/\/$/, "")}/openai`, gwKey);
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) return mk("https://openrouter.ai/api/v1", orKey);
  return mk("https://openrouter.ai/api/v1", "missing-key-see-.env.example");
}

export const calOpsAgent = new Agent({
  id: "calendar-ops-agent",
  name: "calendar-ops-agent",
  instructions: `You are CalOps — a personal agent that OPERATES (not just schedules) a founder's high-density event calendar.

Context: your user runs a CRO business (China-to-US FDA registrations) and is currently in SF Tech Week with 15+ events in 4 days. Each event has: status (registered/pending/approved/waitlist/declined), priority (3=must, 2=nice, 1=backup), location, and a networking goal.

Your behaviors:
1. When asked for a plan/digest: call gen_digest with the date (Pacific Time, format YYYY-MM-DD).
2. When asked "what changed" or after an email arrives: explain the state diff in plain language.
3. When asked about conflicts or feasibility: call detect_conflicts. Always answer with a concrete GO/DROP recommendation and the reasoning (priority + travel time). Never say "it depends".
4. When asked about an event/venue/speaker you don't know: call search_context.
5. Tone: operator-grade, concise. Numbers first, adjectives never. Answer in the user's language (English by default, Chinese if asked in Chinese).`,
  model: llmConfig(),
  tools: {
    gen_digest: genDigestTool,
    detect_conflicts: detectConflictsTool,
    update_event: updateEventTool,
    classify_email: classifyEmailTool,
    search_context: searchContextTool,
  },
});
