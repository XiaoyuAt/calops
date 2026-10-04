# CalOps 📅⚔️

> **The layer above scheduling.** A personal agent that OPERATES a calendar of uncertain, colliding, city-spanning events — the kind no calendar app can handle.

**The problem**: During SF Tech Week I have 19 events in 4 days. Half are `pending approval`, one is `waitlist #99`, venues are "revealed after approval", two events collide at 5:30 PM, and approval emails arrive at random. Calendly schedules meetings people *request*. Motion schedules *tasks*. **Nobody operates a calendar that's 50% Schrödinger.**

**The agent**: watches approval emails → classifies them → flips a per-event state machine (`registered → pending → approved / waitlist / declined`) → auto-drops backup events via fallback links → re-scans conflicts (time overlap + cross-town travel feasibility + priority) → answers questions in plain language.

## Stack (all hackathon co-hosts)

| Layer | Tool | Role |
|---|---|---|
| Agent framework | **Mastra** | 5 tools, agent orchestration |
| Database / memory | **Neon** Postgres (libsql fallback for offline demo) | Event state machine + inbox audit log |
| Email | **AgentMail** (live: two agent inboxes, real send + poll + classify) | Approval emails in |
| Search | **Exa** | Event/venue/speaker context |
| UI | Terminal demo (Assistant UI integration ready) | Chat + digest |

## Quick start

```bash
npm install
cp .env.example .env   # add OPENROUTER_API_KEY (or Neon AI Gateway creds)
npm run demo           # full terminal demo: seed → digest → conflicts → agent Q&A
```

## Demo flow (2 min)

```bash
npm run demo                          # Act 1-2: digest + 33 conflicts found
npm run simulate:approval poll        # Act 3 (climax): REAL email via AgentMail
# → hackathon-demo@agentmail.to sends approval → calops@agentmail.to receives
# → classified: approved (0.95)
# → JPM x MoFo: pending → approved
# → SVB Founder & Investor Lounge: pending → declined (auto-dropped backup)
npm run simulate:approval approved    # offline fallback: simulated email
```

## The 5 tools

| Tool | What it does |
|---|---|
| `classify_email` | Rule-first + confidence scoring → approved/declined/waitlist/needs_review (human-in-the-loop) |
| `update_event` | State machine transition + **fallback cascade** (approve A ⇒ drop backup B) |
| `detect_conflicts` | Overlap + tight-travel detection (static SF travel-time table, Maps API in prod) with GO/DROP verdicts |
| `gen_digest` | Daily ops briefing: confirmed/pending/waitlist counts, timeline, per-event networking goals |
| `search_context` | Exa-powered background on events/venues/speakers |

## Data model

`events` — name, source, **status** (state machine), **priority** (1–3⭐), times, location, networking goal, **fallback_for** (uuid link for backup logic)
`inbox_log` — every classified email + confidence (audit trail)

Seeded with **my real calendar** — 19 actual SF Tech Week events, real statuses, real priorities, real fallback dependencies.

## Roadmap

- [ ] Outlook/Google Calendar sync (Graph API, status as extended properties)
- [ ] Maps API for travel-time feasibility
- [ ] Morning digest via email/Telegram

| Account status (pre-registered) — **all live, zero pending** |

| Service | Status |
|---|---|
| Neon | ✅ **production Postgres**, seeded with real calendar, full pipeline verified on it |
| AgentMail | ✅ verified, 2 live inboxes (`calops@` + `hackathon-demo@agentmail.to`), real pipeline tested |
| Fly.io | ✅ account + CLI auth + `FLY_API_TOKEN` in `.env` |
| LLM | ✅ OpenRouter (`meta-llama/llama-3.3-70b`) |
| Exa | ✅ key live in `.env`, real web search verified (via `x-api-key` + summary extraction per build-with-exa) |

## License

MIT
