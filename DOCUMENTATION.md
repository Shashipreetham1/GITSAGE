# GitSage — Software Documentation

> **"The Brain Behind Your Branches"**
> Version: 1.0 | Last Updated: February 28, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Core Features](#3-core-features)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Folder Structure](#6-folder-structure)
7. [Backend — Server](#7-backend--server)
   - 7.1 [Entry Point](#71-entry-point)
   - 7.2 [Routes](#72-routes)
   - 7.3 [Services](#73-services)
   - 7.4 [Playbook Storage](#74-playbook-storage)
8. [Frontend — Client](#8-frontend--client)
   - 8.1 [Entry & App Shell](#81-entry--app-shell)
   - 8.2 [Pages](#82-pages)
   - 8.3 [Components](#83-components)
   - 8.4 [API Utility](#84-api-utility)
9. [Data Flow](#9-data-flow)
10. [Real-Time System (SSE + Webhooks + Polling)](#10-real-time-system-sse--webhooks--polling)
11. [AI & Intelligence Layer](#11-ai--intelligence-layer)
12. [API Reference](#12-api-reference)
13. [Environment Variables](#13-environment-variables)
14. [Setup & Installation](#14-setup--installation)
15. [Deployment Guide](#15-deployment-guide)
16. [Security Considerations](#16-security-considerations)

---

## 1. Project Overview

**GitSage** is an AI-powered GitHub repository intelligence platform that gives engineering teams a living, real-time understanding of their codebase. It goes far beyond standard GitHub metrics — combining AI commit analysis, function-level collision detection, letter-graded health scoring, and a built-in Kanban task board in a single unified interface.

Connect any public (or authorized private) GitHub repository and GitSage immediately:

- Pulls commits, branches, PRs, issues, and contributors from the GitHub REST API.
- Generates an AI health summary of the repository state.
- Identifies work overlap (collisions) between contributors before merge conflicts occur.
- Builds a persistent "playbook" — an institutional knowledge base of every commit's before/after/impact.
- Provides a self-contained Kanban board with deadline tracking and PR-linked task automation.
- Streams all updates live via Server-Sent Events.

---

## 2. Problem Statement

Engineering teams face five critical blind spots:

| # | Problem | Impact |
|---|---------|--------|
| 1 | No real-time project health visibility | Issues compound silently |
| 2 | Developers unknowingly overwrite each other's code | Merge conflicts and regressions |
| 3 | Commit history lacks context | Institutional knowledge loss |
| 4 | Task management disconnected from code activity | Deadlines slip, blockers hidden |
| 5 | Health assessments are subjective | No data-driven engineering culture |

Existing tools (GitHub Insights, GitPrime, LinearB, CodeClimate) each solve one slice. GitSage addresses all five in one platform.

---

## 3. Core Features

### 3.1 AI Health Pulse
Automatically generates a structured health report the moment a repository is connected:
- **Rating**: Healthy / At Risk / Critical
- **Headline**: One-sentence diagnosis
- **Highlights**: What's working well
- **Concerns**: Early warning signals (stale branches, declining velocity, unreviewed PRs)
- **Blockers**: Actionable blockers with severity levels
- **Recommendations**: Specific next steps

### 3.2 Collision Radar
Detects overlapping work between contributors across a configurable time window (default: 3 days) at three levels:

| Level | Detection Method | Severity |
|-------|-----------------|----------|
| Line-Range Overlap | Git hunk header parsing (`@@ -a,b +c,d @@`) | High |
| Function-Level Overlap | Multi-language regex extraction | Medium |
| File-Level Overlap | File path matching across commits | Low |

Supports languages: JavaScript, TypeScript, Python, Java, Kotlin, C#, Go, Ruby.

Collisions can be **resolved** — tracking who resolved them and when.

### 3.3 Project Playbook
Every commit gets a persistent AI-generated three-part summary:
- **Before**: State of the code before the change
- **Added**: What was introduced or modified
- **Impact**: Downstream effects of the change

Playbooks are stored as JSON files on disk, survive team turnover, and feed the AI chat assistant with full project context.

- Batch initializes up to 20 historical commits on first connection.
- Background queue processes unanalyzed commits (max 2 concurrent repos, 2s delay between commits).

### 3.4 Deep Commit Analyzer
On-demand or automatic analysis of any commit:
- Fetches the full diff from GitHub
- Filters out noise (lock files, images, build artifacts, binaries)
- Chunks large diffs for AI processing, then merges results
- Produces: headline, type classification (feature / bugfix / refactor / config / docs / test / chore), impact level (high / medium / low), per-file descriptions, and a key insight

### 3.5 AI Chat Assistant
A streaming conversational AI with full repo context:
- Repository metadata (stars, forks, language, issues, PRs)
- Full project playbook history
- Active collision/overlap data
- Branch and contributor state

All responses stream in real time with markdown formatting.

### 3.6 Health Checkup — Letter-Graded Scoring

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Code Collaboration | 35% | Collision risk, contributor distribution, PR review patterns |
| Project Velocity | 40% | Commit frequency, PR merge rate, issue close rate, trend direction |
| Bus Factor | 25% | Contributor concentration risk, knowledge distribution |

Each category yields a letter grade (A+ through F) with actionable recommendations.

### 3.7 Smart Kanban Board
A built-in task board with four columns: **To Do → In Progress → In Review → Done**
- Drag-and-drop reordering via `@dnd-kit`
- Priority levels: Critical / High / Medium / Low
- Deadline tracking with overdue flagging and near-deadline warnings (2-day threshold)
- Auto-moves tasks when linked PRs are merged (via GitHub webhooks)
- **Self-assign only** policy for accountability
- Contributor flag system for missed deadlines

### 3.8 Real-Time System
GitSage is a live system, not a static dashboard:
- **Server-Sent Events (SSE)**: Client subscribes per-repo and receives live commit, analysis, and collision updates
- **GitHub Webhooks**: Auto-created on OAuth login; processes `push`, `pull_request`, and `create` events
- **Background Polling**: 30-second interval fallback when webhooks aren't available
- **Live Toast Notifications**: Non-intrusive UI toasts for incoming events

---

## 4. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| @tanstack/react-query | — | Server state management |
| @dnd-kit | — | Drag-and-drop Kanban |
| Recharts | — | Data visualizations (heatmaps, charts) |
| React Router | — | Client-side routing |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18 | HTTP framework |
| ES Modules | Native | Module system |
| express-session | — | Session management |
| dotenv | — | Environment variables |
| crypto (built-in) | — | Webhook signature verification, OAuth state |
| fs/promises (built-in) | — | Disk-based JSON storage |

### AI Engine

| Technology | Purpose |
|-----------|---------|
| Ollama (local) | AI inference server |
| kimi-k2.5:cloud | Default model for summaries and chat |
| Configurable model | Swappable via `OLLAMA_MODEL` env variable |

All AI runs **locally** through Ollama — no data leaves your infrastructure.

### External APIs

| Service | Purpose |
|---------|---------|
| GitHub REST API v3 | Commits, branches, PRs, issues, contributors, webhooks |
| GitHub OAuth | User authentication and token acquisition |

### Storage

| Mechanism | Used For |
|-----------|---------|
| Disk-based JSON | Playbooks, Kanban boards, contributor data |
| In-memory Map | Cache versioning, SSE connections, repo tracking |

---

## 5. System Architecture

```
┌─────────────────────┐       SSE (real-time)      ┌──────────────────────┐
│                     │ <─────────────────────────── │                      │
│   React Client      │                              │   Express Server     │
│   (Vite + TW)       │ ──── REST (JSON) ──────────> │   (Node.js 18+)      │
│   localhost:5173    │                              │   localhost:3003     │
└─────────────────────┘                              └──────┬───────────────┘
                                                            │
                        ┌───────────────────────────────────┤
                        │               │                   │
                 ┌──────▼──────┐ ┌──────▼──────┐  ┌────────▼────────┐
                 │             │ │             │  │                 │
                 │ GitHub API  │ │ Ollama AI   │  │ Disk Storage    │
                 │ (REST v3)   │ │ (Local)     │  │ (JSON Playbooks)│
                 └─────────────┘ └─────────────┘  └─────────────────┘
```

### Key Architectural Decisions

1. **Local AI via Ollama**: No code leaves your infrastructure. Suitable for enterprises with data sovereignty requirements. Zero per-token API costs.
2. **Version-based caching**: Cache invalidation is tied to the latest commit SHA — not arbitrary TTLs. When a new commit lands, cache invalidates automatically.
3. **Persistent playbooks on disk**: Project knowledge stored as structured JSON. No database required. Easy to backup, migrate, and inspect.
4. **Background AI processing**: The `/api/pulse` endpoint returns GitHub data immediately and processes AI summaries asynchronously, broadcasting results via SSE.
5. **Modular service architecture**: 13 focused services with single responsibilities.

---

## 6. Folder Structure

```
gitsage/
│
├── README.md                        # Setup and usage overview
├── pitch.md                         # Product pitch and technical overview
├── DOCUMENTATION.md                 # This file
│
├── client/                          # React + Vite Frontend
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite build config (proxy to :3003)
│   ├── tailwind.config.js           # TailwindCSS configuration
│   ├── postcss.config.js            # PostCSS for Tailwind
│   └── src/
│       ├── main.jsx                 # React DOM entry point
│       ├── App.jsx                  # Root component, state, routing
│       ├── index.css                # Global styles
│       ├── components/              # Reusable UI components
│       │   ├── ActivityHeatmap.jsx  # Commit activity heatmap grid
│       │   ├── AuthButton.jsx       # GitHub OAuth login/logout button
│       │   ├── BlockerPanel.jsx     # Displays active blockers
│       │   ├── BranchList.jsx       # Branch table with stale detection
│       │   ├── ChatPanel.jsx        # AI chat interface with streaming
│       │   ├── CollisionRadarPanel.jsx  # Collision detection UI
│       │   ├── CommitAnalyzer.jsx   # On-demand commit diff analyzer
│       │   ├── CommitList.jsx       # Paginated commit history list
│       │   ├── CommitSummaryCard.jsx    # Individual commit summary card
│       │   ├── ContributorFlagBadge.jsx # Deadline miss badge
│       │   ├── ContributorHeatmap.jsx   # Per-contributor activity chart
│       │   ├── ContributorList.jsx      # Contributor stats table
│       │   ├── DeadlineWarningBanner.jsx # Kanban deadline warnings
│       │   ├── ErrorDisplay.jsx     # Standardized error UI
│       │   ├── GitGraph.jsx         # Branch graph visualization
│       │   ├── GitGraphPanel.jsx    # Git graph panel wrapper
│       │   ├── HealthCheckupPanel.jsx   # Health checkup display
│       │   ├── IssueList.jsx        # GitHub issues list
│       │   ├── KanbanBoard.jsx      # Drag-and-drop Kanban board
│       │   ├── LiveEventToast.jsx   # Real-time event toast notifications
│       │   ├── LoadingState.jsx     # Loading spinner / skeleton
│       │   ├── PlaybookPanel.jsx    # Project playbook display
│       │   ├── PullRequestList.jsx  # Open PR list
│       │   ├── PulseSummary.jsx     # AI health summary card
│       │   ├── RepoInput.jsx        # Repository URL input form
│       │   ├── RepoSelector.jsx     # OAuth repo selection dropdown
│       │   ├── Sidebar.jsx          # Navigation sidebar
│       │   ├── StatsGrid.jsx        # Quick stats (commits, PRs, issues)
│       │   ├── TaskCard.jsx         # Individual Kanban task card
│       │   └── TaskModal.jsx        # Create/edit task modal
│       ├── pages/                   # Full-page views
│       │   ├── LandingPage.jsx      # Initial landing / repo input page
│       │   ├── OverviewPage.jsx     # Main dashboard overview
│       │   ├── InsightsPage.jsx     # Commits, playbook, commit analyzer
│       │   ├── ActivityPage.jsx     # Branch graph and activity details
│       │   ├── CollaborationPage.jsx    # Collision radar and contributor map
│       │   └── TasksPage.jsx        # Kanban board page
│       └── utils/
│           └── api.js               # All fetch/SSE calls to the backend
│
└── server/                          # Node.js + Express Backend
    ├── index.js                     # Server entry point, middleware, app.listen
    ├── package.json                 # Backend dependencies
    ├── .env                         # Environment variables (not committed)
    ├── routes/                      # HTTP route handlers
    │   ├── auth.js                  # GitHub OAuth flow + repo listing
    │   ├── pulse.js                 # Repository data + SSE events
    │   ├── playbook.js              # Playbook read + commit analysis
    │   ├── collision.js             # Collision detection endpoints
    │   ├── health.js                # Health checkup endpoints
    │   ├── board.js                 # Kanban board CRUD
    │   └── webhook.js               # GitHub webhook receiver
    ├── services/                    # Business logic layer
    │   ├── githubService.js         # GitHub API wrapper (fetch, pagination)
    │   ├── ollamaService.js         # Ollama AI — health summaries
    │   ├── chatService.js           # Ollama AI — streaming chat
    │   ├── commitAnalyzerService.js # Ollama AI — deep commit analysis
    │   ├── commitSummarizer.js      # AI summarization for playbook entries
    │   ├── playbookService.js       # Playbook read/write/sync
    │   ├── backgroundAnalyzerService.js  # Queue-based background commit analyzer
    │   ├── collisionService.js      # Collision detection algorithm
    │   ├── healthService.js         # Health scoring (collaboration, velocity, bus factor)
    │   ├── boardService.js          # Kanban persistence + deadline logic
    │   ├── cacheService.js          # In-memory version-based cache
    │   ├── sseService.js            # SSE connection management
    │   └── pollingService.js        # Background GitHub polling
    ├── playbooks/                   # Disk-based persistent data store
    │   └── {owner}-{repo}/          # One folder per tracked repo
    │       ├── project.json         # Project-level playbook
    │       ├── board.json           # Kanban board state
    │       └── contributors/        # Per-contributor playbooks
    │           └── {username}.json
    └── utils/                       # Shared utilities
```

---

## 7. Backend — Server

### 7.1 Entry Point

**File**: `server/index.js`

Bootstraps the Express application:
- Applies CORS with origin restriction to `CLIENT_URL`
- Parses JSON bodies up to 2MB
- Sets up `express-session` with a 24-hour cookie
- Mounts all API route groups under `/api`
- Starts the background polling service via `startPolling()`
- Listens on `PORT` (default: `3003`)

```
Server startup sequence:
  dotenv.config()
  → Express middleware
  → Session middleware
  → Mount routes (/api/*)
  → app.listen(PORT)
  → startPolling()
```

### 7.2 Routes

#### `routes/auth.js` — GitHub OAuth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | GET | Redirects to GitHub OAuth authorization URL (scopes: `repo admin:repo_hook read:user`) |
| `/api/auth/github/callback` | GET | Exchanges OAuth code for access token, stores in session, auto-creates repo webhook |
| `/api/auth/user` | GET | Returns the current authenticated user from session |
| `/api/auth/logout` | POST | Destroys the session |
| `/api/auth/repos` | GET | Lists the authenticated user's repositories |

**OAuth Flow**:
1. Browser → `GET /api/auth/github` → redirect to GitHub
2. GitHub → `GET /api/auth/github/callback?code=...` → exchange code for token
3. Token stored in `req.session.githubToken`
4. Webhook auto-registered for `push`, `pull_request`, `create` events

---

#### `routes/pulse.js` — Repository Data + SSE
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/pulse` | POST | Fetch repo health data. Returns immediately with GitHub data; AI processes in background via SSE |
| `GET /api/events/:owner/:repo` | GET | Open SSE stream for a repository |

**Pulse flow**:
1. Check version-based cache (compare latest commit SHA)
2. Cache hit → return immediately with `cached: true`
3. Cache miss → `fetchRepoData()` → return `{ repoData, aiPending: true }`
4. Background: `syncCommitsToPlaybook()` → `generatePulseSummary()` → `broadcast('summary')`

---

#### `routes/playbook.js` — Playbook & Commit Analysis
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/playbook/:owner/:repo` | GET | Returns project playbook + contributor playbooks |
| `POST /api/commit/analyze` | POST | Deep-analyzes a specific commit SHA with AI |

---

#### `routes/collision.js` — Collision Detection
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/collisions/:owner/:repo` | GET | Runs collision detection and returns results |
| `PATCH /api/collisions/:owner/:repo/:collisionId/resolve` | PATCH | Marks a collision as resolved |

---

#### `routes/health.js` — Health Checkup
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/health/:owner/:repo` | GET | Runs full health analysis; returns letter grades for all three categories |

---

#### `routes/board.js` — Kanban Board
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/board/:owner/:repo` | GET | Load the full Kanban board state |
| `POST /api/board/:owner/:repo/tasks` | POST | Create a new task |
| `PATCH /api/board/:owner/:repo/tasks/:id` | PATCH | Update task properties |
| `PATCH /api/board/:owner/:repo/tasks/:id/move` | PATCH | Move task to a different column |
| `DELETE /api/board/:owner/:repo/tasks/:id` | DELETE | Delete a task |
| `GET /api/board/:owner/:repo/flags` | GET | Get all contributor deadline flags |

---

#### `routes/webhook.js` — GitHub Webhooks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/webhook/:owner/:repo` | POST | Receives GitHub webhook payloads |

Handles three event types:
- **`push`**: Processes each commit, updates playbook, broadcasts `new_event`
- **`pull_request`** (`closed` + `merged`): Auto-moves linked board tasks to `done`
- **`create`** (branch): Logs new branch creation

Uses HMAC SHA-256 signature verification (`X-Hub-Signature-256` header).

---

### 7.3 Services

#### `githubService.js` — GitHub API Layer
Core functions:
- `parseRepoUrl(url)` — Parses `https://github.com/owner/repo` or `owner/repo` strings
- `fetchRepoData(repoUrl, token)` — Aggregates all repo data: meta, commits, branches, PRs, issues, contributors, blockers
- `fetchAllPages(endpoint, token, maxPages)` — Handles GitHub REST pagination (100 per page)
- `fetchCommitDetails(owner, repo, sha, token)` — Fetches full diff with file patches
- `fetchLatestCommitSha(owner, repo, token)` — Lightweight version check
- `fetchFullCommitInfo(owner, repo, sha, token)` — Full commit info including author, branch, files
- Rate limit error handling with reset time information
- 404 / 403 / private repo error differentiation

---

#### `ollamaService.js` — AI Health Summaries
- Connects to local Ollama instance at `http://localhost:11434`
- Uses model `kimi-k2.5:cloud` by default (configurable via `OLLAMA_MODEL`)
- `generatePulseSummary(repoData, playbookContext)` — Sends condensed repo data + playbook to AI; parses JSON response
- Handles `<think>` tags and markdown code fences in model output
- Returns structured summary: `{ rating, headline, highlights[], concerns[], blockers[], recommendations[] }`
- Timeout: 5 minutes

---

#### `chatService.js` — AI Chat Streaming
- `streamChatResponse(messages, repoContext, res)` — Streams chat response via HTTP chunked transfer
- Builds a rich system prompt from: repo metadata, commit history, playbook context, PR/issue list, branch status, blockers, active collisions
- Timeout: 3 minutes
- Model: `kimi-k2.5:cloud` (separate configurable from health model)

---

#### `commitAnalyzerService.js` — Deep Commit Analysis
- `analyzeCommit(owner, repo, sha, token)` — Fetches diff, filters noise, sends to AI
- Skips: lock files (`.lock`, `package-lock.json`), images, build artifacts, binaries
- Chunks large diffs to stay within token limits
- Returns: `{ headline, type, impactLevel, files[], keyInsight }`

---

#### `commitSummarizer.js` — Playbook Entry AI
- `summarizeEvent(eventData, token)` — Generates before/added/impact summary for a single commit
- `batchSummarizeEvents(events, token)` — Batch processes multiple commits
- `regenerateProjectSummary(playbook)` — Regenerates the overall project narrative
- `regenerateContributorSummary(contributorPlaybook)` — Regenerates per-contributor summaries

---

#### `playbookService.js` — Playbook Persistence
- `initPlaybook(owner, repo)` — Creates directory structure and empty `project.json`
- `getProjectPlaybook(owner, repo)` — Reads `project.json` from disk
- `writeProjectPlaybook(owner, repo, playbook)` — Persists to disk
- `getContributorPlaybook(owner, repo, username)` — Reads per-user JSON
- `getAllContributorPlaybooks(owner, repo)` — Reads all contributor JSONs
- `updatePlaybookWithEvent(owner, repo, eventData)` — Adds/updates a commit entry and triggers AI analysis
- `syncCommitsToPlaybook(owner, repo, commits, repoData, token)` — Batch syncs unanalyzed commits on first load
- `buildContextFromPlaybook(owner, repo)` — Returns a condensed context object for the AI chat

**Disk layout per repo**:
```
playbooks/{owner}-{repo}/
├── project.json          ← project-level playbook
├── board.json            ← Kanban board state
└── contributors/
    └── {username}.json   ← per-contributor playbook
```

---

#### `collisionService.js` — Collision Detection Algorithm
- `detectCollisions(owner, repo, token)` — Main entry point; returns collisions, stats, hot zones
- **Algorithm**:
  1. Load project playbook to get all recent commit entries
  2. Fetch full diffs for each commit
  3. For every pair of (commitA, commitB) from different authors within the time window:
     - Check for shared file paths → `file_only` (low severity)
     - Check for overlapping line ranges via `parseLineRanges()` → `line_overlap` (high severity)
     - Check for shared function names via `extractFunctions()` → `function_overlap` (medium severity)
  4. Deduplicate and rank by severity
  5. Identify hot zones (files with ≥2 contributors)
- **Resolution tracking**: Resolved collisions stored in `project.json`; re-detected collisions check resolution status

---

#### `healthService.js` — Health Scoring
Three weighted dimensions, each with findings, suggestions, and a letter grade:

**Code Collaboration (35%)**:
- Penalty for active line overlaps (-10 per overlap, max -25)
- Penalty for function overlaps (-5 per overlap, max -15)
- Bonus for high collision resolution rate (+5)
- Penalty for excessive hot zones (-10 if >5)

**Project Velocity (40%)**:
- Based on commit frequency, last commit date, consistency over recent weeks
- Trend detection: accelerating / steady / decelerating

**Bus Factor (25%)**:
- Based on Gini coefficient of commit distribution among contributors
- Single author > 80% commits = high bus factor risk

Final weighted score → `getLetterGrade(score)` → A+ through F

---

#### `boardService.js` — Kanban Persistence
- `loadBoard(owner, repo)` — Reads `board.json`; computes deadline statuses on every load
- `saveBoard(owner, repo, board)` — Writes to disk
- `computeDeadlineStatuses(board)` — Iterates all tasks:
  - `overdue`: deadline passed → sets `flagged: true`, adds to `flags[]`
  - `approaching`: within 2 days of deadline
  - `on_track`: otherwise
  - Tasks in `done` column are never flagged
- `moveTaskByPR(owner, repo, prNumber)` — Finds tasks with matching `prNumber` and moves them to `done`
- `getContributorFlags(board, username)` — Returns deadline flags for a specific contributor

**Board JSON structure**:
```json
{
  "repoFullName": "owner/repo",
  "lastUpdated": "ISO timestamp",
  "columns": ["todo", "in_progress", "in_review", "done"],
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "column": "todo|in_progress|in_review|done",
      "priority": "critical|high|medium|low",
      "assignee": "github_username",
      "deadline": "YYYY-MM-DD",
      "deadlineStatus": "on_track|approaching|overdue",
      "prNumber": 123,
      "flagged": false
    }
  ],
  "flags": [
    {
      "taskId": "uuid",
      "assignee": "username",
      "taskTitle": "string",
      "deadline": "YYYY-MM-DD",
      "daysOverdue": 3,
      "flaggedAt": "ISO timestamp"
    }
  ]
}
```

---

#### `cacheService.js` — Version-Based Cache
- In-memory `Map` keyed by repository URL
- Each entry stores: `{ data, version (commit SHA), timestamp }`
- `getCachedData(repoUrl, latestSha)` — Returns data only if SHA matches
- `setCachedData(repoUrl, data, version)` — Stores data with version
- `invalidateCache(repoUrl)` — Removes entry from cache
- No TTL — purely event-driven invalidation based on commit SHA

---

#### `sseService.js` — SSE Connection Manager
- Stores active connections in a `Map<repoKey, Set<Response>>`
- `addConnection(owner, repo, res)` — Registers a response stream
- `removeConnection(owner, repo, res)` — Cleans up on disconnect
- `broadcast(owner, repo, eventType, data)` — Sends `event: {type}\ndata: {json}\n\n` to all connected clients
- `getActiveRepos()` — Returns list of repos with active clients (used by polling service)

---

#### `pollingService.js` — Background Polling
- `startPolling()` — Starts a `setInterval` at `POLL_INTERVAL_MS` (default: 30s)
- On each tick, calls `getActiveRepos()` and checks each for new commits via `fetchLatestCommitSha()`
- Detects SHA change → invalidates cache → broadcasts `new_event` → calls `processNewCommit()` asynchronously
- `setRepoVersion(owner, repo, sha)` — Called by pulse route to pre-seed the version map on load
- Guards: only polls repos with active SSE clients; skips if no change

---

#### `backgroundAnalyzerService.js` — Background Commit Queue
- Processes unanalyzed commits from playbooks in the background
- Max 2 concurrent repos analyzed at once
- 2-second delay between commits to respect rate limits
- Broadcasts `background_analysis_started`, `commit_analyzed`, `background_analysis_completed` events via SSE

---

### 7.4 Playbook Storage

GitSage uses disk-based JSON as its only persistent storage. No database is required.

```
server/playbooks/
├── {owner}-{repo}/             ← one directory per tracked repository
│   ├── project.json            ← aggregated project playbook
│   ├── board.json              ← Kanban board state
│   └── contributors/
│       └── {username}.json     ← per-contributor playbook
```

**`project.json` schema**:
```json
{
  "repoFullName": "owner/repo",
  "lastUpdated": "ISO 8601",
  "totalCommitsTracked": 42,
  "projectSummary": "AI-generated narrative",
  "techAreas": ["src", "server", "docs"],
  "overallVelocity": "accelerating|steady|decelerating",
  "commits": [
    {
      "shortId": "abc1234",
      "commitId": "abc1234...",
      "author": "username",
      "timestamp": "ISO 8601",
      "message": "feat: add collision detection",
      "filesChanged": ["src/collision.js"],
      "additions": 120,
      "deletions": 5,
      "primaryArea": "src",
      "before": "AI summary",
      "added": "AI summary",
      "impact": "AI summary",
      "analyzed": true
    }
  ],
  "resolvedCollisions": { "collisionId": { "resolvedBy": "user", "resolvedAt": "ISO 8601" } }
}
```

---

## 8. Frontend — Client

### 8.1 Entry & App Shell

**`src/main.jsx`** — Wraps `<App>` with `QueryClientProvider` (React Query).

**`src/App.jsx`** — Root component managing all global state and routing:

**State managed**:
- `pulseData` — Full repository data (GitHub + AI summary)
- `user` — Authenticated GitHub user
- `authChecked` — Boolean for auth check completion
- `aiPending` — Whether AI summary is still being generated
- `liveEvents` — Array of SSE-delivered live events for toast display
- `activeView` — Current active page (`overview`, `insights`, `activity`, `collaboration`, `tasks`)
- `sidebarCollapsed` — UI state for sidebar collapse
- `analyzerSha` — SHA to deep-analyze in commit analyzer
- `playbookRefreshKey` — Increment counter to trigger playbook re-fetches

**SSE subscription** (set up in `useEffect` when `pulseData` changes):
| Event Type | App Action |
|-----------|-----------|
| `summary` | Updates `pulseData.summary`, clears `aiPending` |
| `new_event` | Appends to `liveEvents` toast queue |
| `event_processed` | Updates event in toast queue; prepends commit to `pulseData.repoData.commits` |
| `playbook_updated` | Increments `playbookRefreshKey` |
| `playbook` | Updates `playbookAvailable` flag |

---

### 8.2 Pages

| Page | Route Key | Description |
|------|-----------|-------------|
| `LandingPage` | (initial) | Repository URL input, OAuth login, recent repos list |
| `OverviewPage` | `overview` | AI summary, blockers, stats grid, heatmaps, branches, PRs, issues, contributors |
| `InsightsPage` | `insights` | Commit analyzer, playbook panel, commit list, commit summary cards |
| `ActivityPage` | `activity` | Branch graph visualization, activity details |
| `CollaborationPage` | `collaboration` | Collision radar panel, contributor heatmap |
| `TasksPage` | `tasks` | Kanban board, deadline warnings, contributor flags |

---

### 8.3 Components

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Navigation menu with view switching, shows active repo name, handles mobile collapse |
| `AuthButton` | GitHub OAuth login/logout, shows user avatar when authenticated |
| `RepoInput` | Text input + submit for entering a GitHub repo URL |
| `RepoSelector` | Dropdown to pick from authenticated user's repositories |
| `PulseSummary` | Renders AI health summary card (rating, headline, highlights, concerns, blockers) |
| `BlockerPanel` | Renders list of detected development blockers with severity badges |
| `StatsGrid` | 5-card grid: total commits, open branches, open PRs, open issues, contributors |
| `ActivityHeatmap` | 7-day commit heatmap grid showing hourly activity intensity |
| `ContributorHeatmap` | Horizontal bar chart of contributor commit counts |
| `BranchList` | Table of branches with stale detection (>30 days), PR linkage indicator |
| `PullRequestList` | List of open PRs with author, age, draft status, review decision |
| `IssueList` | List of open issues with labels, priority, and creation date |
| `ContributorList` | Table of contributors with commit count, last active, and flag badges |
| `CommitList` | Paginated list of recent commits with SHA, author, message, date |
| `CommitSummaryCard` | Card showing AI before/added/impact for a playbook entry |
| `PlaybookPanel` | Full playbook display: project summary, tech areas, per-commit AI entries |
| `CommitAnalyzer` | Input a commit SHA → triggers `/api/commit/analyze` → shows structured result |
| `CollisionRadarPanel` | Displays active collisions by type (line/function/file), hot zones, resolution controls |
| `HealthCheckupPanel` | Renders three category scores + overall grade with findings and suggestions |
| `GitGraph` | Visual branch divergence graph using SVG/canvas |
| `GitGraphPanel` | Wrapper for git graph with branch filtering |
| `KanbanBoard` | Full drag-and-drop Kanban with @dnd-kit; manages column state locally |
| `TaskCard` | Individual task card with priority color, deadline indicator, assignee |
| `TaskModal` | Create/edit modal: title, description, priority, assignee, deadline, PR link |
| `DeadlineWarningBanner` | Fixed banner for approaching/overdue tasks |
| `ContributorFlagBadge` | Badge displayed on contributors with missed deadlines |
| `LiveEventToast` | Sliding toast for real-time SSE events (commit pushed, analysis done) |
| `LoadingState` | Full-page loading skeleton while initial data is fetched |
| `ErrorDisplay` | Renders error message with code and suggestions based on error type |

---

### 8.4 API Utility

**`src/utils/api.js`** — All client-to-server communication:

| Function | Description |
|----------|-------------|
| `subscribeToUpdates(owner, repo, onEvent)` | Opens EventSource SSE connection; registers listeners for 12+ event types; returns cleanup function |
| `fetchPulseData(repoUrl, forceRefresh)` | POST to `/api/pulse`; throws typed error on failure |
| `sendChatMessage(messages, repoContext, onChunk)` | POST to `/api/chat`; streams response via `ReadableStream` / `TextDecoder`; calls `onChunk` per token |
| `fetchCollisions(owner, repo)` | GET `/api/collisions/:owner/:repo` |
| `resolveCollision(owner, repo, collisionId)` | PATCH `/api/collisions/.../resolve` |
| `fetchHealthCheckup(owner, repo)` | GET `/api/health/:owner/:repo` |
| `fetchPlaybook(owner, repo)` | GET `/api/playbook/:owner/:repo` |
| `analyzeCommit(owner, repo, sha)` | POST `/api/commit/analyze` |
| `getBoard(owner, repo)` | GET `/api/board/:owner/:repo` |
| `createTask(owner, repo, task)` | POST `/api/board/:owner/:repo/tasks` |
| `updateTask(owner, repo, taskId, updates)` | PATCH `/api/board/:owner/:repo/tasks/:id` |
| `moveTask(owner, repo, taskId, column)` | PATCH `/api/board/:owner/:repo/tasks/:id/move` |
| `deleteTask(owner, repo, taskId)` | DELETE `/api/board/:owner/:repo/tasks/:id` |
| `getAuthUser()` | GET `/api/auth/user` |
| `getUserRepos()` | GET `/api/auth/repos` |

---

## 9. Data Flow

### Initial Repository Load
```
User enters URL
  → App.jsx calls fetchPulseData()
    → POST /api/pulse
      → Server: parseRepoUrl() + fetchLatestCommitSha()
      → Cache hit? → return cached data immediately
      → Cache miss?
          → fetchRepoData() (GitHub API)
          → Return { repoData, aiPending: true } immediately
          → Background: syncCommitsToPlaybook() + generatePulseSummary()
          → broadcast('summary') via SSE
  → Client: render OverviewPage with repoData
  → SSE: receive 'summary' event → update PulseSummary component
```

### New Commit (Webhook Path)
```
Developer pushes to GitHub
  → GitHub sends POST /api/webhook/:owner/:repo
  → Server: verifySignature() ✓
  → normalizePushEvent() → eventData
  → updatePlaybookWithEvent() → save to disk
  → broadcast('new_event') → SSE to all clients
  → commitSummarizer.summarizeEvent() (AI)
  → broadcast('event_processed') with AI summary
  → invalidateCache()
```

### New Commit (Polling Path)
```
pollingService interval fires
  → getActiveRepos() → repos with open SSE connections
  → fetchLatestCommitSha() for each
  → SHA changed?
    → invalidateCache()
    → fetchFullCommitInfo()
    → broadcast('new_event')
    → processNewCommit(): updatePlaybook + broadcast('event_processed')
```

### Chat Message
```
User types message in ChatPanel
  → sendChatMessage(messages, repoContext, onChunk)
    → POST /api/chat
    → chatService.buildSystemPrompt(repoContext)  [includes playbook + collisions]
    → streamChatResponse() via Ollama
    → HTTP chunked transfer → onChunk() called per token
    → UI renders tokens as they arrive
```

---

## 10. Real-Time System (SSE + Webhooks + Polling)

### Server-Sent Events (SSE)
- **Endpoint**: `GET /api/events/:owner/:repo`
- Sets headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Client uses native browser `EventSource` API
- Clean up on `req.on('close')` via `removeConnection()`

**Event types broadcast**:
| Event | Payload | Trigger |
|-------|---------|---------|
| `connected` | `{ message }` | On SSE connect |
| `summary` | `{ summary, summaryError, playbookAvailable }` | AI summary complete |
| `playbook` | `{ available, context }` | Playbook synced |
| `new_event` | `{ commitId, author, message, branch, ... }` | New commit detected |
| `event_processed` | `{ commitId, before, added, impact, ... }` | AI analysis complete |
| `playbook_updated` | `{ commitId }` | Playbook entry updated |
| `background_analysis_started` | `{ repoKey, count }` | Background queue started |
| `commit_analyzed` | `{ shortId, author, ... }` | Background commit analyzed |
| `background_analysis_completed` | `{ repoKey }` | Queue drained |

### GitHub Webhooks
- Auto-registered via `POST https://api.github.com/repos/:owner/:repo/hooks` on OAuth login
- Payload URL: `{SERVER_URL}/api/webhook/:owner/:repo`
- Events: `push`, `pull_request`, `create`
- Signature verification: HMAC-SHA256 on raw body

### Background Polling
- One interval per server process (not per repo)
- Only checks repos with active SSE clients (`getActiveRepos()`)
- Is the fallback mechanism for environments where webhooks can't be configured (local dev, private networks)

---

## 11. AI & Intelligence Layer

### AI Engine: Ollama
GitSage uses **Ollama** as its local AI inference server. Ollama runs models entirely on your machine — no tokens sent to external APIs.

- Default model: `kimi-k2.5:cloud`
- Configurable: set `OLLAMA_MODEL` / `OLLAMA_CHAT_MODEL` in `.env`
- Base URL: `http://localhost:11434` (configurable via `OLLAMA_BASE_URL`)

### AI Use Points

| Feature | Service | Model Call Type |
|---------|---------|----------------|
| Health Pulse Summary | `ollamaService.js` | JSON completion |
| Chat Assistant | `chatService.js` | Streaming chat |
| Deep Commit Analyzer | `commitAnalyzerService.js` | JSON completion |
| Playbook Entry (before/added/impact) | `commitSummarizer.js` | JSON completion |
| Project Summary Regeneration | `commitSummarizer.js` | Text completion |
| Contributor Summary Regeneration | `commitSummarizer.js` | Text completion |

### Prompt Engineering
- All system prompts include condensed repo context (not raw data) to minimize tokens
- Large diffs are chunked and processed in segments, then merged
- Output parsing handles `<think>` tags (from reasoning models) and markdown code fences
- Graceful fallback if AI response is malformed — returns `null` and broadcasts `summaryError`

---

## 12. API Reference

### Full Endpoint List

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Server health check |
| GET | `/api/auth/github` | None | Start GitHub OAuth |
| GET | `/api/auth/github/callback` | None | OAuth callback |
| GET | `/api/auth/user` | Session | Get current user |
| POST | `/api/auth/logout` | Session | Logout |
| GET | `/api/auth/repos` | Session | List user's repos |
| POST | `/api/pulse` | Optional Token | Fetch repo data |
| GET | `/api/events/:owner/:repo` | None | SSE stream |
| GET | `/api/playbook/:owner/:repo` | Optional Token | Get playbook |
| POST | `/api/commit/analyze` | Optional Token | Analyze commit |
| GET | `/api/collisions/:owner/:repo` | Optional Token | Get collisions |
| PATCH | `/api/collisions/:owner/:repo/:id/resolve` | None | Resolve collision |
| GET | `/api/health/:owner/:repo` | Optional Token | Health checkup |
| GET | `/api/board/:owner/:repo` | None | Get board |
| POST | `/api/board/:owner/:repo/tasks` | None | Create task |
| PATCH | `/api/board/:owner/:repo/tasks/:id` | None | Update task |
| PATCH | `/api/board/:owner/:repo/tasks/:id/move` | None | Move task |
| DELETE | `/api/board/:owner/:repo/tasks/:id` | None | Delete task |
| GET | `/api/board/:owner/:repo/flags` | None | Get flags |
| POST | `/api/webhook/:owner/:repo` | Signature | GitHub webhook |

---

## 13. Environment Variables

Create `server/.env` from the template below:

```env
# Server
PORT=3003
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-random-secret-here

# GitHub
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_CLIENT_ID=your_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# AI (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=kimi-k2.5:cloud
OLLAMA_CHAT_MODEL=kimi-k2.5:cloud

# Storage
PLAYBOOK_DIR=./playbooks

# Polling
POLL_INTERVAL_MS=30000
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3003` | Server listen port |
| `CLIENT_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `SESSION_SECRET` | Recommended | `gitsage-session-secret` | Session cookie encryption |
| `GITHUB_TOKEN` | Recommended | — | Personal Access Token for higher rate limits |
| `GITHUB_CLIENT_ID` | For Auth | — | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | For Auth | — | GitHub OAuth App Client Secret |
| `GITHUB_WEBHOOK_SECRET` | For Webhooks | Auto-generated | HMAC secret for webhook verification |
| `OLLAMA_BASE_URL` | For AI | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | No | `kimi-k2.5:cloud` | Model for summaries and analysis |
| `OLLAMA_CHAT_MODEL` | No | `kimi-k2.5:cloud` | Model for chat |
| `PLAYBOOK_DIR` | No | `./playbooks` | Playbook storage directory |
| `POLL_INTERVAL_MS` | No | `30000` | Background polling interval (ms) |

---

## 14. Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- [Ollama](https://ollama.ai) installed and running locally
- GitHub Personal Access Token (recommended)
- GitHub OAuth App (for login + webhooks)

### Step 1 — Install Ollama and pull model
```bash
# Install Ollama (https://ollama.ai)
ollama pull kimi-k2.5:cloud
ollama serve     # starts on http://localhost:11434
```

### Step 2 — Clone and install dependencies
```bash
git clone <repo-url>
cd gitsage

# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### Step 3 — Configure environment
```bash
cd server
# Create .env file with the variables from section 13
```

### Step 4 — GitHub OAuth App Setup
1. Go to **GitHub Settings > Developer settings > OAuth Apps > New OAuth App**
2. Set **Authorization callback URL** to: `http://localhost:3003/api/auth/github/callback`
3. Copy **Client ID** and **Client Secret** to `.env`

### Step 5 — Run the application
```bash
# Terminal 1: Start backend
cd server
npm run dev     # runs with nodemon on port 3003

# Terminal 2: Start frontend
cd client
npm run dev     # runs Vite dev server on port 5173
```

Open **http://localhost:5173** in your browser.

---

## 15. Deployment Guide

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.com`

### Backend (Railway / Render / Heroku)
1. Connect repository
2. Set root directory: `server`
3. Start command: `npm start`
4. Add all environment variables from section 13
5. Note: Ollama must be accessible from the deployment environment (self-hosted or container)

### Production Checklist
- [ ] Set `SESSION_SECRET` to a strong random value
- [ ] Set `cookie.secure = true` in `index.js` session config (requires HTTPS)
- [ ] Set `GITHUB_WEBHOOK_SECRET` to a strong random value
- [ ] Point `GITHUB_CLIENT_ID/SECRET` to a production OAuth App with the correct callback URL
- [ ] Ensure `PLAYBOOK_DIR` is on a persistent volume (not ephemeral storage)
- [ ] Configure Ollama access from the server (or use a hosted Ollama endpoint)

---

## 16. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| GitHub OAuth state forgery | Random `state` parameter verified on callback |
| Webhook spoofing | HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) |
| Session fixation | `express-session` with `saveUninitialized: false`; `httpOnly` cookies |
| GitHub token exposure | Token stored only in server-side session; never sent to client |
| CORS | Restricted to `CLIENT_URL` only |
| Request size | JSON body limit set to 2MB |
| Rate limiting | GitHub API 403/rate-limit errors caught and surfaced to user |
| Token in env | `.env` never committed (should be in `.gitignore`) |
| AI data privacy | All AI processing via local Ollama — no code sent to external services |

---

*Documentation generated for GitSage v1.0 — February 28, 2026*
