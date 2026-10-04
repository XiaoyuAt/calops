// CalOps — 数据库访问层
// 双模式：DATABASE_URL 有值走 Neon Postgres；否则降级本地 libsql（零配置 demo 模式）
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";


export type EventRow = {
  id: string;
  name: string;
  source: string;
  status: "registered" | "pending" | "approved" | "waitlist" | "declined" | "attended";
  priority: number;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  goal: string | null;
  fallback_for: string | null;
  updated_at: string;
};

export type InboxRow = {
  id: string;
  from_addr: string | null;
  subject: string | null;
  body_preview: string | null;
  classified: string | null;
  confidence: number | null;
  event_id: string | null;
  received_at: string;
};

const SCHEMA = fs.readFileSync(path.resolve(import.meta.dirname, "../../db/schema.sql"), "utf8");
const SEED = fs.readFileSync(path.resolve(import.meta.dirname, "../../db/seed.sql"), "utf8");

export interface Db {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
  mode(): "neon" | "libsql";
  close(): Promise<void>;
}

// Postgres SQL → SQLite 方言转换（libsql 模式用）
function toSqlite(sql: string): string {
  return sql
    .replace(/CREATE EXTENSION[^;]*;?/gi, "")
    .replace(/\buuid\b/gi, "TEXT")
    .replace(/\btimestamptz\b/gi, "TEXT")
    .replace(/\s+DEFAULT gen_random_uuid\(\)/gi, "")
    .replace(/::date/gi, "")
    .replace(/ILIKE/gi, "LIKE")
    .replace(/REFERENCES\s+events\(id\)\s+ON DELETE SET NULL/gi, "REFERENCES events(id)")
    .replace(/\$(\d+)/g, "?")
    .replace(/TRUNCATE\s+(\w+)\s+CASCADE/gi, "DELETE FROM $1")
    .replace(/now\(\)/gi, "(datetime('now'))");
}

// ---------- libsql 模式（本地 demo，无需任何账号） ----------
async function makeLibsql(): Promise<Db> {
  const { createClient } = await import("@libsql/client");
  const file = path.resolve(import.meta.dirname, "../../data/local.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const client = createClient({ url: `file:${file}` });
  return {
    async query<T>(sql: string, params: any[] = []) {
      const res = await client.execute({ sql: toSqlite(sql), args: params });
      return res.rows as unknown as T[];
    },
    async exec(sqlText: string) {
      // 去注释；按 ";" 切分但跳过单引号字符串字面量内部的分号
      const clean = sqlText.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
      const stmts: string[] = [];
      let cur = "", inStr = false;
      for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (ch === "'") inStr = !inStr;
        if (ch === ";" && !inStr) { stmts.push(cur); cur = ""; continue; }
        cur += ch;
      }
      if (cur.trim()) stmts.push(cur);
      for (const stmt of stmts) {
        const s = toSqlite(stmt.trim());
        if (s) await client.execute(s);
      }
    },
    mode: () => "libsql",
    async close() { client.close(); },
  };
}

// ---------- Neon 模式（现场拿到 connection string 后切换） ----------
async function makeNeon(url: string): Promise<Db> {
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, { ssl: "prefer", max: 5, prepare: false });
  return {
    async query<T>(sqlText: string, params: any[] = []) {
      return (await sql.unsafe(sqlText, params)) as unknown as T[];
    },
    async exec(sqlText: string) { await sql.unsafe(sqlText); },
    mode: () => "neon",
    async close() { await sql.end(); },
  };
}

// libsql 模式下无 uuid 默认值 → 应用层生成
export function genId(): string {
  return crypto.randomUUID();
}

export async function getDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith("postgres")) {
    try {
      const db = await makeNeon(url);
      console.log("🟢 [db] Neon Postgres 已连接");
      return db;
    } catch (e) {
      console.warn("⚠️ Neon 连接失败，降级 libsql:", (e as Error).message);
    }
  }
  const db = await makeLibsql();
  console.log("🟡 [db] libsql 本地模式（file:./data/local.db）");
  return db;
}

export async function initDb(reset = false): Promise<Db> {
  const db = await getDb();
  await db.exec(SCHEMA);
  if (reset) {
    await db.exec("DELETE FROM inbox_log;");
    await db.exec("DELETE FROM events;");
    // 先插入（无 id）→ 补 id → 再执行 seed 尾部的 UPDATE（fallback 关系依赖 id）
    const seedBody = SEED.replace(/UPDATE[\s\S]*$/i, "").trim(); // INSERT 部分
    const seedTail = SEED.match(/UPDATE[\s\S]*$/i)?.[0] ?? "";   // UPDATE 部分
    await db.exec(seedBody);
    if (db.mode() === "libsql") {
      await db.exec(`UPDATE events SET id = lower(hex(randomblob(16))) WHERE id IS NULL;`);
    }
    await db.exec(seedTail);
  }
  return db;
}
