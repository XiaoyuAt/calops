-- CalOps 种子数据：校长真实的 SF Tech Week 日历（2026-10-05 ~ 10-08）
-- 状态/优先级/备选关系均照抄真实日历，demo 跑真数据
DELETE FROM inbox_log;
DELETE FROM events;

INSERT INTO events (name, source, status, priority, start_time, end_time, location, goal, fallback_for) VALUES
-- ===== 周一 10/5 =====
('SVB: AI x Healthcare', 'svb', 'pending', 3, '2026-10-05 14:00:00-07', '2026-10-05 17:00:00-07', 'SVB Experience Center, 532 Market St', 'Doug Nissinoff 投资人口径; Matt Donne 纠正误填问卷; 加速器创始人', NULL),
('Can We Predict a Failed Clinical Trial?', 'partiful', 'pending', 3, '2026-10-05 16:00:00-07', '2026-10-05 17:00:00-07', 'Downtown SF（审核后公布）', 'Superderma AI 团队同行交流; 临床运营负责人客户口径', NULL),
('Preventive Health Panel', 'partiful', 'approved', 1, '2026-10-05 16:00:00-07', '2026-10-05 18:00:00-07', 'Fenwick, SF（审核后公布）', 'Jonathan Swerdlin 客户口径; Jane Rhee a16z 投资人口径', NULL),
('Battle Scars MedTech 创始人夜', 'partiful', 'waitlist', 2, '2026-10-05 17:30:00-07', '2026-10-05 20:30:00-07', 'Werqwise, 1301 Sansome St Rooftop', '候补#99 直接去排队; Varun Turlapati 投资人口径', NULL),
('Tech Week 启动夜 Fireworks x a16z', 'luma', 'pending', 3, '2026-10-05 18:00:00-07', '2026-10-05 22:00:00-07', 'Mission Bay（RSVP后发地址）', 'a16z 合作人; Lin Qiao (Fireworks AI)', NULL),
('NEXT.BIO 2026 Dev Summit 启动夜', 'partiful', 'pending', 3, '2026-10-05 19:00:00-07', '2026-10-05 22:00:00-07', 'SF（审核后公布）', 'Next Sequence 加速器团队; 一周长线活动', NULL),

-- ===== 周二 10/6 =====
('Vertical AI 科学创新论坛', 'manual', 'pending', 2, '2026-10-06 16:00:00-07', '2026-10-06 18:00:00-07', 'SF（场地待公布）', 'Stephanie Sharron MoFo 合伙人; Sharad Aggarwal Google Cloud', NULL),
('SVB Investor Matchmaking', 'partiful', 'approved', 3, '2026-10-06 16:00:00-07', '2026-10-06 20:30:00-07', 'SVB Office SOMA', 'a16z 投资人 1:1; 投资轨最高优先级: China-to-US wave + 104 projects', NULL),
('Models to Medicine (AWS)', 'partiful', 'pending', 3, '2026-10-06 17:00:00-07', '2026-10-06 20:00:00-07', 'FiDi SF（审核后公布）', 'AWS 医疗团队 = Euris 上云入口; AI drug discovery 初创客户', NULL),
('a16z Bio/Health Mixer', 'partiful', 'pending', 3, '2026-10-06 17:30:00-07', '2026-10-06 19:00:00-07', 'SOMA SF（审核后公布）', 'Beth Newman & Chris Ham; invite-only 40人 全周最稀缺', NULL),
('Save the World 游戏夜 (VC Lab)', 'email', 'approved', 2, '2026-10-06 17:30:00-07', '2026-10-06 19:30:00-07', 'Cooley Offices, 3 Embarcadero Center', 'Max Harris 引荐2位GP/LP; Adeo Ressi 投资人口径', NULL),
('Mithrl-1 发布酒会', 'partiful', 'pending', 2, '2026-10-06 17:30:00-07', '2026-10-06 20:00:00-07', 'SF 屋顶（审核后公布）', 'Vivek Adarsh CEO; Obvious Ventures 系投资人', NULL),
('From 0 to 100,000 Devices', 'partiful', 'pending', 3, '2026-10-06 17:30:00-07', '2026-10-06 21:00:00-07', 'TIAT, SF', '器械量产创始人 = FDA 合规客户', NULL),

-- ===== 周三 10/7 =====
('MoFo Coast-to-Coast Demo Day', 'partiful', 'pending', 1, '2026-10-07 10:00:00-07', '2026-10-07 13:00:00-07', 'SF（审核后公布）', 'Bling Capital 等评委投资人', NULL),
('SVB: Scaling Innovation Across Borders', 'svb', 'pending', 2, '2026-10-07 09:00:00-07', '2026-10-07 16:00:00-07', 'SVB SF', '跨境生态 = China-to-US 业务直接相关', NULL),
('JPM x MoFo 生命科学峰会', 'email', 'pending', 3, '2026-10-07 15:30:00-07', '2026-10-07 18:00:00-07', 'SF（邀请后公布）', 'Jerry Lee/Nick Richitt JPM 联席主管; 本程含金量最高', NULL),
('SVB Founder & Investor Lounge', 'svb', 'pending', 2, '2026-10-07 16:00:00-07', '2026-10-07 18:00:00-07', 'SVB SF', 'Maven Ventures; Gunderson 律所', NULL),
('Neuro, Neuro 脑科技社交', 'partiful', 'approved', 1, '2026-10-07 17:30:00-07', '2026-10-07 20:00:00-07', 'SF', 'Varun Turlapati; NeuroTech 创始人', NULL),

-- ===== 周四 10/8 =====
('AI Insiders: AI x Longevity 沙龙', 'partiful', 'pending', 2, '2026-10-08 16:30:00-07', '2026-10-08 20:30:00-07', 'Financial District, SF', 'Ronjon Nag R42/Stanford; 长寿初创路演', NULL);

-- ===== 备选依赖关系 =====
-- 若 JPM×MoFo 获批 → 弃 SVB Lounge（备选）
UPDATE events SET fallback_for = (SELECT id FROM events e2 WHERE e2.name LIKE 'SVB Founder%')
WHERE name LIKE 'JPM x MoFo%';

-- SVB Matchmaking 获批 → 15:30 后的 Models to Medicine 只能赶后半场（软冲突，不改数据，让 agent 检测出来讲人话）
