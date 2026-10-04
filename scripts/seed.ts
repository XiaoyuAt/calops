try { process.loadEnvFile(); } catch {}
// 种子脚本：npm run seed（重置数据库 + 灌入真实日历数据）
import { initDb } from "../src/mastra/db";

const db = await initDb(true);
const rows = await db.query<{ name: string; status: string }>(`SELECT name, status FROM events ORDER BY start_time`);
console.log(`已播种 ${rows.length} 场活动:`);
rows.forEach(r => console.log(`  [${r.status}] ${r.name}`));
await db.close();
