try { process.loadEnvFile(); } catch {}
// Demo 主脚本：无 UI 情况下跑完整剧本（终端版 demo + 录屏素材）
// 用法：npm run demo
import { initDb } from "../src/mastra/db";
import { detectConflictsTool, genDigestTool } from "../src/mastra/tools";
import { calOpsAgent } from "../src/mastra/agents";

async function chat(prompt: string) {
  console.log(`\n👤 ${prompt}`);
  try {
    const res = await calOpsAgent.generate(prompt);
    console.log(`🤖 ${res.text}`);
  } catch (e) {
    console.log(`🤖 (LLM 未配置，跳过问答环节 — ${(e as Error).message.slice(0, 80)})`);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("CalOps — Terminal Demo");
  console.log("=".repeat(60));

  const db = await initDb(true); // 重置并播种
  console.log(`\n[db mode: ${db.mode()}] 种子数据: 校长真实 Tech Week 日历 19 场\n`);

  // Act 1 — 行动简报
  const d1 = await genDigestTool.execute({ date: "2026-10-06" }, {} as any) as { digest: string };
  console.log(d1.digest);

  // Act 2 — 冲突全景
  const conf = await detectConflictsTool.execute({}, {} as any) as { summary: string; conflicts: { a: string; b: string; kind: string; advice: string }[] };
  console.log(`\n⚔️ 全周冲突扫描: ${conf.summary}`);
  conf.conflicts.slice(0, 8).forEach(c => console.log(`   [${c.kind}] ${c.a} ⟷ ${c.b}\n     → ${c.advice}`));

  // Act 3 — agent 问答（需 LLM key）
  await chat("What's my Monday plan? Give me go/drop decisions.");
  await chat("If JPM MoFo gets approved today, what happens to my Wednesday?");

  await db.close();
  console.log("\n— demo end —");
}

main().catch(e => { console.error(e); process.exit(1); });
