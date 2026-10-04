# CalOps — The Cops for Your Calendar

> **Hackathon**: Build Personal Agents Hack · 2026-10-04 · Terra Gallery, SF
> **品类定义**: **CalOps = 日历运营** —— 像运营航班调度中心一样，运营你的日历和人际互动
> **Slogan**: *The cops for your calendar.*
> **One-liner (pitch 开场句)**: "Every AI product this weekend makes humans talk to machines more. I built the opposite: **as AI gets stronger, human-to-human interaction becomes the scarce asset — and CalOps is the agent that operates it.**"

---

## 0. 愿景（为什么是现在）

**AI 越强，agent 越强，人与人之间的真实互动越有价值、越重要。**

未来 12 个月，写作、编程、研究、客服都会被 agent 吃掉。剩下不会贬值的，是两个人坐到同一张桌子前的那 45 分钟：投资人见面会、客户拜访、投标答辩、Tech Week 的酒会。这些"高价值面对面时刻"的数量会暴涨（因为其他事都不用亲自干了），但**它们的运营方式还停留在石器时代**：审批制门票、候补名单、跨城冲突、地理可达性、临场取舍——全靠自己人肉记着。

今天所有的日程产品都在优化"已经确定的格子"（Calendly/Reclaim/Motion）。没有人运营**不确定的、带依赖的、会突变的人际互动**。

CalOps 定义这个新品类：**日历运营（Interaction Ops）—— 像运营航班调度中心一样，运营你的人际互动。**

## 1. 产品形态：三层抽象

```
┌─────────────────────────────────────────────────────┐
│  Playbook（剧本）   Event Week │ 远程例会 │ 客户拜访 │ 投标会  │
├─────────────────────────────────────────────────────┤
│  Lifecycle（生命周期状态机）                            │
│  proposed → invited → pending → confirmed → prepped  │
│           → held → debriefed → followed-up           │
│           (waitlist / declined / conflicted 为旁路态)  │
├─────────────────────────────────────────────────────┤
│  Meeting（实体）    时间・地点・对方・目标・优先级・依赖 │
│                     持久化在 Neon = agent 的长期记忆     │
└─────────────────────────────────────────────────────┘
```

- **Meeting 实体**：一次人际互动的完整档案（不只是日历上的一个格子）——谁、何时、何地、什么状态、目标是什么、和谁冲突、是谁的备选
- **Lifecycle**：所有互动共享同一台状态机。Tech Week 门票的"等审核"和投标会的"等标书反馈"，在状态机眼里是同一件事
- **Playbook**：不同场景挂载不同剧本。剧本 = 该场景下的分类规则 + 冲突策略 + digest 模板 + 跟进动作

**黑客松 demo 完整实现 Playbook #1（Event Week），其余三本剧本来现场讲 roadmap。**

## 2. Playbook 矩阵（场景扩展 = 产品天花板）

| Playbook | 场景 | 特有状态/规则 | 谁有这痛点 |
|---|---|---|---|
| **#1 Event Week**（demo） | Tech Week / 展会 / 峰会周：20+ 场审批制活动 | 审批制门票、候补、备选依赖、跨城冲突 | 参会者、BD、投资人 |
| #2 远程例会 | 1:1 / standup / 周会：重复但常漂移 | 改期连锁反应、议程 prep、会后 action items | 每个远程团队 |
| #3 客户拜访 | 销售/BD 外勤：一天串 4 家客户 | 路线优化、拜访前情报（Exa）、拜访后跟进 SLA | 销售团队 |
| #4 投标会 | 答辩/评审：多轮、多干系人、材料死线 | 材料 checklist、干系人状态、倒排时间线 | 乙方、咨询、律所 |

**平台性叙事（pitch 收尾用）**：状态机和 agent 是同一套，新增场景 = 写一本新 playbook。这是"agent-native CRM 的前哨"——CRM 记录已成事实的互动结果，CalOps 运营互动发生之前和之中的全部混乱。

## 3. 真实痛点（Playbook #1，我自己就是用户）

SF Tech Week 一周，我的 Outlook 日历长这样：

- 20+ 场活动，状态五花八门：✅已确认 / ⏳等审核 / 候补 #99 / 等邀请
- 门票是**审批制**的（Luma/Partiful/SVB），批准邮件随时可能进来，地址"批准后公布"
- 互相冲突：JPM×MoFo 15:30–18:00 vs SVB Lounge 16:00–18:00，二选一
- 逻辑依赖：若 A 获批则弃备选 B；下课 15:30 → 开车 30 分钟 → 赶 17:00 酒会
- 每天早上要人肉梳理：今天哪几场能去？路线怎么排？目标人物是谁？

**现有产品全部失效**：Calendly/Cal.com（别人约你）、Reclaim/Motion（任务排程）、Toki/AI 日历（单事件视角）。没有一个产品管「概率性、带依赖、会变的行程运营」。

## 4. 用户故事

1. 作为参会者，我要 agent 追踪每场活动的审批状态，批准邮件一到就自动更新我的计划
2. 作为参会者，我要每天早上收到一份 digest：今天确认几场、待定几场、冲突在哪、建议取舍
3. 作为参会者，新增一场活动时，agent 自动检测冲突并给出"去 A 弃 B"建议（含地理可达性）
4. 作为参会者，我能用自然语言问"明天下午怎么安排"，agent 基于最新状态回答

## 5. MVP 范围（明天 16:30 提交版）

| 功能 | 优先级 | 说明 |
|---|---|---|
| Meeting 状态机 | P0 | registered → pending → approved / waitlist / declined；状态存 Neon |
| 冲突检测 + 取舍建议 | P0 | 时间重叠 + 优先级 + 地理可达（简化：地点字符串 + 通行时间估算表） |
| Morning Digest | P0 | 每日计划简报：确认/待定/冲突/建议/目标人物 |
| AgentMail 收审批邮件 | P0 | webhook 收信 → LLM 分类（approved/declined/waitlist）→ 状态机转移 |
| 自然语言问答 | P0 | Assistant UI 聊天："今天怎么排？""SVB 批了吗？" |
| Exa 场地/活动背景 | P1 | 问"XX 场在哪、主讲谁"时 agent 搜索补充 |
| 自动重排建议 | P1 | 状态变化 → 输出 diff："JPM 获批 → 弃 SVB → Neuro 17:30 仍可衔接" |
| Kernel/Executor/Fly.io | P2 | 时间富余再接（Kernel 查场地页面，Executor 做工具层，Fly 部署） |

**砍掉**：真实 Outlook OAuth 接入（demo 用导出的 ICS/JSON）、多用户、移动端、Playbook #2-4（只讲不做）。

## 6. 技术架构（全 co-host 栈，评委看得懂）

```
AgentMail (agent 邮箱收审批信)
   │ webhook
   ▼
Mastra agent (编排核心)
   ├── 工具1: classify_email   (LLM: approved/declined/waitlist/other)
   ├── 工具2: update_event     (状态机转移, 写 Neon)
   ├── 工具3: detect_conflicts (查 Neon, 时间重叠+优先级+地理)
   ├── 工具4: gen_digest       (每日简报)
   └── 工具5: search_context   (Exa: 活动背景/场地信息)
   ▼
Neon Postgres (meetings 表 = 状态机的持久层 + agent 记忆)
   ▼
Assistant UI (聊天界面: 问答 + digest 展示)
```

## 7. 数据模型（Neon）

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text,                    -- 'luma' | 'partiful' | 'svb' | 'manual'
  status text NOT NULL DEFAULT 'registered',
    -- registered | pending | approved | waitlist | declined | attended
  priority int DEFAULT 2,         -- 1..3 (对应 ⭐ 数)
  start_time timestamptz,
  end_time timestamptz,
  location text,
  goal text,                      -- 现场目标: 见谁、什么口径
  fallback_for uuid,              -- 备选逻辑: 此场获批则弃 id 指向的场
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE inbox_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_addr text, subject text, body_preview text,
  classified text,                -- 分类结果
  event_id uuid REFERENCES events(id),
  received_at timestamptz DEFAULT now()
);
```

**种子数据**：从我的真实 Outlook 日历导出 10/5–10/8 的 15+ 场活动（含真实状态），demo 跑真数据。
（注：v1 实现用 `events` 表名；产品化时迁移为 `meetings` + `playbook` 字段，见 §9 roadmap。）

## 8. Demo 剧本（2 分钟，卡秒表）

1. **[0:00–0:20] 痛点**：投影我真实的 Outlook 日历截图（20+ 场、星标、待审核标记）→ "This is my actual calendar this week. Half of it is Schrödinger's events — I won't know if I'm in until an email arrives."
2. **[0:20–1:40] 现场 demo**：
   - 打开 CalOps（Assistant UI 界面）→ 问 "What's my Monday plan?" → 输出 digest：5 场，3 approved / 2 pending，1 处冲突（JPM vs SVB），建议 + 理由
   - **高潮**：掏出手机，给 agent 邮箱（AgentMail）现场转发一封 "You're in! JPM × MoFo"（提前准备好的真邮件存在草稿箱）→ 3 秒内界面弹更新 → "JPM approved → SVB dropped (backup) → Neuro 17:30 still reachable" → 问 agent "What changed?" → 它讲 diff
3. **[1:40–2:00] 平台性收尾**：一页架构图 + Playbook 矩阵 → "The state machine and the agent don't care whether it's a Luma approval or a bid-review callback. New scenario = new playbook. **AI is eating everything except the room where two humans shake hands. CalOps operates that room. The cops for your calendar.**"

**备份**：全程录屏视频提前录好存本地（wifi 崩了就放视频，脚本不变）。

## 9. Roadmap（产品化路径，Q&A 弹药）

| 阶段 | 内容 |
|---|---|
| v1（黑客松） | Playbook #1 Event Week 全链路，单用户，邮件驱动 |
| v1.5 | 表结构迁移 `events → meetings`，加 `playbook` 字段；Outlook/Google 双向同步 |
| v2 | Playbook #2 远程例会（改期连锁 + action items 追踪）；多用户 |
| v3 | Playbook #3/#4（客户拜访路线、投标倒排）；团队版：BD/销售团队的 event week ops |
| 远期 | agent-native CRM 前哨：互动的"发生前/发生中"运营层，结果回写 CRM |

## 10. Pitch 备忘 & Q&A 预案

| 可能提问 | 答案要点 |
|---|---|
| 为什么不用 Outlook/Google Calendar API？ | MVP 用导出数据隔离日历权限风险；生产版接 Graph API，状态字段以 extended properties 存在原生日历上 |
| 状态机怎么防误分类？ | classify_email 有 confidence 阈值，低于阈值标 'needs_review' 进人工确认队列（human-in-the-loop） |
| 多场活动地理冲突怎么算？ | v1 用静态通行时间表（SF 常用场地间），v2 接 Maps API |
| 这和 Reclaim/Motion 区别？ | 他们优化"确定的格子"，我运营"不确定的互动"。互补不竞争 —— Reclaim 用户照样有 Tech Week |
| 这和 CRM 区别？ | CRM 记录互动的**结果**（已成事实），CalOps 运营互动**发生前和之中**的混乱（审批、冲突、prep、跟进）。是 CRM 的上游 |
| 怎么商业化？ | 免费 personal → 团队版（BD/销售团队的 event week ops）→ 按 playbook 增值（投标/客户拜访剧本是 B 端付费点） |
| 昨晚做了多少？ | 坦然："Scaffold + 数据模型昨晚搭好，今天现场接通了 AgentMail 回调、调通冲突引擎、跑了真实数据" |

## 11. 今晚 → 明天分工

**今晚（我 + 校长各干各的）**：
- 校长：注册账号（见清单）+ 从 Outlook 导出 10/5–10/8 日历（ICS 或截图）+ 手机草稿箱存一封 "You're in!" 邮件备用
- 我：PRD（本文件）→ 骨架代码（Mastra 工程 + Neon schema + 种子数据 + Assistant UI 前端 + mock 收信链路）→ README

**明天现场（校长只做三件事）**：
1. 和 co-host 工程师聊架构（顺便社交，GitHub/LinkedIn 互加）
2. 换上真 API key，跑通真实收信 → 重排链路，录备份视频
3. 排练 pitch × 3，16:30 前提交（portal：build-personal-agents.com/auth/sign-in）

## 12. 账号注册清单（已全部就绪 ✅）

| # | 服务 | 状态 |
|---|---|---|
| 1 | **Neon** | ✅ connection string 已入 .env（pooler us-west-2），19 场真实数据已迁移 |
| 2 | **AgentMail** | ✅ `calops@agentmail.to` + API key；真实收发链路已验证 |
| 3 | **Exa** | ✅ key 已入 .env，真搜索已验证 |
| 4 | **Mastra** | ✅ npm 本地，无需账号 |
| 5 | **Fly.io** | ✅ token 已入 .env（部署为可选项） |
| 6 | LLM | ✅ OpenRouter + llama-3.3-70b（gpt-4o-mini 区域受限，已切换） |
| 7 | Kernel / Executor | 现场领 credits（P2） |

## 13. 提交材料 checklist

- [ ] GitHub repo（MIT License，争 CodeRabbit $10k side quest；repo 名改 `calops`）
- [ ] README：一句话 + 痛点截图 + 架构图 + demo GIF + 快速启动
- [ ] 30s demo 备份视频（本地+云各一份）
- [ ] 提交 portal：build-personal-agents.com/auth/sign-in（明早先登录一次确认账号通）
