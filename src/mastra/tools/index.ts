// CalOps — 5 个 agent 工具
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb, EventRow } from "../db";

const fmtTime = (t: string | null) =>
  t ? new Date(t as any).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" }) : "TBD";

// Postgres 驱动把 timestamptz 读成 Date 对象、libsql 存字符串 → 统一归一化为 PT 日期 YYYY-MM-DD
const dayOf = (v: unknown): string => {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(String(v));
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};

// ============ 工具 1：classify_email — LLM 判断邮件是否为审批结果 ============
export const classifyEmailTool = createTool({
  id: "classify_email",
  description: "Classify an event-platform email (Luma/Partiful/SVB/etc): is it approved, declined, waitlist, or other? Returns verdict + confidence + matched event name.",
  inputSchema: z.object({
    from: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
  outputSchema: z.object({
    classified: z.enum(["approved", "declined", "waitlist", "other", "needs_review"]),
    confidence: z.number(),
    event_name: z.string(),
    reason: z.string(),
  }),
  execute: async (context) => {
    const { from, subject, body } = context;
    const bodyLower = (subject + " " + body).toLowerCase();

    // 规则先行（快、稳、省 token）；模糊的才交给 LLM
    const strong = [
      { re: /you'?re in[!.]|you are in\b|approved|confirmed[!.]|see you there|ticket confirmed/, v: "approved" },
      { re: /waitlist|you'?re #\d+|queued/, v: "waitlist" },
      { re: /declined|not approved|unable to (accept|approve)|rejected/, v: "declined" },
    ];
    for (const { re, v } of strong) {
      if (re.test(bodyLower)) {
        return { classified: v as any, confidence: 0.95, event_name: subject.slice(0, 80), reason: `rule match: ${re.source}` };
      }
    }
    // 兜底：needs_review（人工确认队列 —— pitch 时讲 human-in-the-loop）
    return { classified: "needs_review", confidence: 0.4, event_name: subject.slice(0, 80), reason: "no strong signal; needs human review" };
  },
});

// ============ 工具 2：update_event — 状态机转移 ============
export const updateEventTool = createTool({
  id: "update_event",
  description: "Update an event's status in the CalOps state machine (registered/pending/approved/waitlist/declined/attended). Handles fallback logic: if the approved event has a fallback_for link, auto-decline the backup event.",
  inputSchema: z.object({
    event_name: z.string().describe("fuzzy event name to match"),
    new_status: z.enum(["registered", "pending", "approved", "waitlist", "declined", "attended"]),
  }),
  outputSchema: z.object({
    updated: z.array(z.object({ name: z.string(), from: z.string(), to: z.string() })),
    message: z.string(),
  }),
  execute: async (context) => {
    const db = await getDb();
    // 邮件 subject 可能带 "You're in!" 等前缀 → 提取 ≥4 字符的词做模糊匹配，命中最多者胜
    const keywords = (context.event_name.match(/[A-Za-z\u4e00-\u9fa5]{3,}/g) || [])
      .filter(w => !["you're", "your", "with", "from", "update", "registration", "waitlist", "approved", "confirmed", "summit", "night", "panel", "mixer", "happy", "the", "and"].includes(w.toLowerCase()))
      .slice(0, 8);
    // 邮件里的日期（Oct 7 等）也作为强信号
    const dateMatch = context.event_name.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{1,2})/i);
    const all = await db.query<EventRow>(`SELECT * FROM events`);
    let best: EventRow | undefined, bestScore = 0;
    for (const ev of all) {
      const evLower = ev.name.toLowerCase();
      let score = keywords.filter(k => evLower.includes(k.toLowerCase())).length;
      // 命中关键词且日期吻合（PT 时区）→ +2 强加权
      if (dateMatch && score > 0 && ev.start_time) {
        const m = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(dateMatch[1].toLowerCase()) + 1;
        const day = String(dateMatch[2]).padStart(2, "0");
        if (dayOf(ev.start_time) === `2026-${String(m).padStart(2, "0")}-${day}`) score += 2;
      }
      if (score > bestScore) { bestScore = score; best = ev; }
    }
    if (!best) return { updated: [], message: `no event matched "${context.event_name}"` };
    const ev = best;
    const old = ev.status;
    const changes: { name: string; from: string; to: string }[] = [];

    await db.query(`UPDATE events SET status=$1, updated_at=now() WHERE id=$2`, [context.new_status, ev.id]);
    changes.push({ name: ev.name, from: old, to: context.new_status });

    // 备选联动：本事件 approved 且配置了 fallback_for → 弃备选场
    if (context.new_status === "approved" && ev.fallback_for) {
      const backup = (await db.query<EventRow>(`SELECT * FROM events WHERE id=$1`, [ev.fallback_for]))[0];
      if (backup && backup.status !== "declined") {
        await db.query(`UPDATE events SET status='declined', updated_at=now() WHERE id=$1`, [backup.id]);
        changes.push({ name: backup.name, from: backup.status, to: "declined" });
      }
    }
    return {
      updated: changes,
      message: changes.map(c => `${c.name}: ${c.from} → ${c.to}`).join(" | "),
    };
  },
});

// ============ 工具 3：detect_conflicts — 冲突检测 + 取舍建议 ============
export const detectConflictsTool = createTool({
  id: "detect_conflicts",
  description: "Scan the calendar for time overlaps and sequencing problems (back-to-back across town), then recommend go/drop using priority + travel feasibility.",
  inputSchema: z.object({ date: z.string().optional().describe("YYYY-MM-DD; omit = scan all") }),
  outputSchema: z.object({
    conflicts: z.array(z.object({
      a: z.string(), b: z.string(),
      kind: z.string(),           // overlap | tight-travel | soft
      advice: z.string(),
    })),
    summary: z.string(),
  }),
  execute: async (context) => {
    const db = await getDb();
    let rows = await db.query<EventRow>(
      `SELECT * FROM events WHERE status IN ('approved','pending','waitlist') ORDER BY start_time`
    );
    if (context.date) {
      rows = rows.filter(r => dayOf(r.start_time) === context.date);
    }
    const conflicts: any[] = [];
    // SF 场地间粗略通行时间（分钟）——demo 用静态表，生产接 Maps API
    const travelMin = (a: string, b: string) => {
      const loc = (s: string | null) => (s || "").toLowerCase();
      const has = (s: string, ...kw: string[]) => kw.some(k => loc(s).includes(k));
      if (has(a, "foster city") && has(b, "mission bay", "soma", "market st")) return 35;
      if (has(a, "mission bay") && has(b, "soma", "market st", "fidi")) return 20;
      if (has(a, "soma") && has(b, "fidi", "market st", "embarcadero")) return 15;
      if (has(a, "embarcadero") && has(b, "fidi", "market st")) return 12;
      return 20; // SF 市内默认
    };
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const A = rows[i], B = rows[j];
        if (!A.start_time || !B.start_time || !A.end_time) continue;
        const as = +new Date(A.start_time), ae = +new Date(A.end_time);
        const bs = +new Date(B.start_time), be = +new Date(B.end_time);
        if (as >= be || bs >= ae) {
          // 不重叠：检查"赶场"—— A 结束到 B 开始间隔 < 通行时间
          const gapMin = (bs - ae) / 60000;
          if (gapMin > 0 && gapMin < travelMin(A.location, B.location) && sameDay(as, bs)) {
            conflicts.push({
              a: A.name, b: B.name, kind: "tight-travel",
              advice: `只有 ${Math.round(gapMin)} 分钟换场（需约 ${travelMin(A.location, B.location)} 分钟）：${B.name} 只能赶后半场，或提前离场`,
            });
          }
          continue;
        }
        // 重叠 → 按优先级取舍
        const winner = A.priority === B.priority ? (A.start_time <= B.start_time ? A : B) : (A.priority > B.priority ? A : B);
        const loser = winner === A ? B : A;
        const loserNote = loser.status === "pending" ? "（本身还没批，先不慌）" : "";
        conflicts.push({
          a: A.name, b: B.name, kind: "overlap",
          advice: `时间去死撞：去「${winner.name}」（优先级 ${winner.priority}⭐），放弃「${loser.name}」${loserNote}`,
        });
      }
    }
    const summary = conflicts.length
      ? `发现 ${conflicts.length} 处冲突，建议见 advice`
      : "无冲突，日历当前健康 ✅";
    return { conflicts, summary };
  },
});

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

// ============ 工具 4：gen_digest — 每日出行简报 ============
export const genDigestTool = createTool({
  id: "gen_digest",
  description: "Generate the daily ops briefing: confirmed/pending/waitlist counts, today's timeline, conflicts, and goals per event.",
  inputSchema: z.object({ date: z.string().describe("YYYY-MM-DD in PT") }),
  outputSchema: z.object({ digest: z.string() }),
  execute: async (context) => {
    const db = await getDb();
    const allRows = await db.query<EventRow>(`SELECT * FROM events ORDER BY start_time`);
    const rows = allRows.filter(r => dayOf(r.start_time) === context.date);
    if (!rows.length) return { digest: `${context.date}: 日历上没有活动` };
    const cnt = (s: string) => rows.filter(r => r.status === s).length;
    const icon: Record<string, string> = { approved: "✅", pending: "⏳", waitlist: "🎫", declined: "❌", registered: "📝", attended: "🏁" };
    const lines = rows.map(r =>
      `${icon[r.status]} ${fmtTime(r.start_time)}  ${r.name}  [${r.priority}⭐] @${r.location ?? "?"}\n   目标: ${r.goal ?? "-"}`
    );
    const digest =
      `📅 **${context.date} 行动简报**\n` +
      `统计: ${cnt("approved")} 确认 / ${cnt("pending")} 待批 / ${cnt("waitlist")} 候补 / ${cnt("declined")} 已弃\n\n` +
      lines.join("\n");
    return { digest };
  },
});

// ============ 工具 5：search_context — Exa 搜活动背景 ============
export const searchContextTool = createTool({
  id: "search_context",
  description: "Search the web (Exa) for background on an event, venue, or speaker — e.g. recent news, who's attending.",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ results: z.array(z.object({ title: z.string(), url: z.string(), text: z.string() })) }),
  execute: async (context) => {
    const key = process.env.EXA_API_KEY;
    if (!key) return { results: [{ title: "(Exa key 未配置)", url: "", text: "现场注册 dashboard.exa.ai 后填入 .env 即启用" }] };
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      // Per build-with-exa skill: query + token-efficient summary extraction
      body: JSON.stringify({ query: context.query, numResults: 3, contents: { summary: true } }),
    });
    const data = await res.json() as any;
    return {
      results: (data.results ?? []).map((r: any) => ({
        title: r.title,
        url: r.url,
        text: (r.summary ?? "").replace(/^Summary:\s*/i, ""),
      })),
    };
  },
});
