try { process.loadEnvFile(); } catch {}
// Demo 触发器：真实 AgentMail 收信 → 全链路反应（新增 poll 模式）
// 用法：
//   npm run simulate:approval approved    → 模拟模式（本地造邮件）
//   npm run simulate:approval poll        → 真实模式：发测试邮件到 agent inbox → 轮询收信 → 跑链路
import { initDb } from "../src/mastra/db";
import { classifyEmailTool, updateEventTool, detectConflictsTool } from "../src/mastra/tools";

const kind = (process.argv[2] || "approved") as "approved" | "waitlist" | "declined" | "poll";

const SCRIPTS: Record<string, { from: string; subject: string; body: string }> = {
  approved: {
    from: "events@jpmorgan.com",
    subject: "You're in! JPM x MoFo Life Sciences Summit — Oct 7",
    body: `Congratulations! Your registration for the JPM x MoFo 生命科学峰会 (Life Sciences Summit) has been approved. Wednesday, October 7, 3:30 PM PT. Venue details will follow. See you there!`,
  },
  waitlist: {
    from: "hello@partiful.com",
    subject: "You're on the waitlist for a16z Bio/Health Mixer",
    body: `You're #12 in line for the a16z Bio/Health Mixer (Tue Oct 6). We'll notify you if a spot opens.`,
  },
  declined: {
    from: "events@svb.com",
    subject: "Update on your SVB: Scaling Innovation registration",
    body: `Thank you for your interest. Unfortunately we are unable to approve your registration at this time.`,
  },
};

async function main() {
  let mail: { from: string; subject: string; body: string };
  if (kind === "poll") {
    // 真实链路：用第二个 inbox 发「批准邮件」到 agent inbox → 轮询收到 → 跑链路
    const apiKey = process.env.AGENTMAIL_API_KEY!;
    const inbox = process.env.AGENTMAIL_INBOX_ID || "calops@agentmail.to";
    console.log("📤 [真实模式] 从 hackathon-demo@agentmail.to 发审批邮件到", inbox);
    await fetch(`https://api.agentmail.to/v0/inboxes/hackathon-demo@agentmail.to/messages/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [inbox],
        subject: "You're in! JPM x MoFo Life Sciences Summit — Oct 7",
        text: "Congratulations! Your registration for the JPM x MoFo 生命科学峰会 has been approved. Wednesday, October 7, 3:30 PM PT. See you there!",
      }),
    });
    // 轮询收件
    let got: any = null;
    for (let i = 0; i < 12 && !got; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const res = await fetch(`https://api.agentmail.to/v0/inboxes/${inbox}/messages?limit=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json() as any;
      const m = data.messages?.[0];
      if (m && typeof m.from === "string" && m.from.includes("hackathon-demo@agentmail.to")) got = m;
    }
    if (!got) { console.log("❌ 60 秒内未收到邮件"); process.exit(1); }
    console.log("📥 真实收到邮件:", got.subject);
    mail = { from: got.from, subject: got.subject, body: got.preview || "" };
  } else {
    mail = SCRIPTS[kind];
    console.log("📧 收到邮件:", mail.subject);
  }

  // 1. 分类
  const cls = await classifyEmailTool.execute({ from: mail.from, subject: mail.subject, body: mail.body }, {} as any) as {
    classified: "approved" | "waitlist" | "declined" | "other" | "needs_review";
    confidence: number; event_name?: string; reason?: string;
  };
  console.log(`\n🔍 分类结果: ${cls.classified} (confidence ${cls.confidence}) — ${cls.reason}`);

  // 2. 状态机更新（含备选联动）
  if (cls.classified === "approved" || cls.classified === "waitlist" || cls.classified === "declined") {
    const upd = await updateEventTool.execute({
      event_name: mail.subject, new_status: cls.classified,
    }, {} as any) as any;
    console.log(`\n⚙️ 状态机更新:`);
    upd.updated.forEach(u => console.log(`   ${u.from} → ${u.to}  (${u.name})`));
    if (!upd.updated.length) console.log(`   (未匹配到事件)`);
  }

  // 3. 冲突重算
  const conf = await detectConflictsTool.execute({}, {} as any) as { summary: string; conflicts: { a: string; b: string; kind: string; advice: string }[] };
  console.log(`\n⚔️ 冲突重算: ${conf.summary}`);
  conf.conflicts.forEach(c => console.log(`   [${c.kind}] ${c.a} ⟷ ${c.b}\n     → ${c.advice}`));

  // 4. 写 inbox_log（审计轨迹，demo 时展示）
  const db = await initDb();
  await db.query(
    `INSERT INTO inbox_log (from_addr, subject, body_preview, classified, confidence) VALUES ($1,$2,$3,$4,$5)`,
    [mail.from, mail.subject, mail.body.slice(0, 120), cls.classified, cls.confidence]
  );
  console.log("\n✅ 全链路完成 — inbox_log 已记录");
  await db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
