# 🔎 RepoLens

### Turn an unfamiliar GitHub repository into your next contribution.

RepoLens is an AI-powered developer tool that helps developers understand unfamiliar repositories faster.

Instead of spending hours navigating folders, reading documentation, and figuring out where to start, RepoLens transforms a GitHub repository into an actionable contribution path:

**Repository → Architecture → Important Files → Contribution Opportunities → Implementation Plan**

## 🚀 The Problem

Contributing to an unfamiliar open-source project can be intimidating. Developers often need to understand the repository structure, technologies, component relationships, relevant files, and potential contribution areas before making a useful change.

This creates a significant onboarding barrier, especially for students, first-time contributors, and developers entering unfamiliar codebases.

## 💡 Our Solution

RepoLens acts as an AI-powered repository navigator.

Give RepoLens a GitHub repository URL and it can:

1. 🔗 Connect to the repository
2. 🌳 Analyze the repository structure
3. 🧩 Detect technologies and project components
4. 🏗️ Visualize the architecture
5. 📁 Identify important files
6. 💡 Discover potential contribution opportunities
7. 🛠️ Generate implementation steps
8. 📝 Turn contribution ideas into actionable issues

> **Go from “I don't understand this repository” to “I know what I can contribute.”**

## ✨ Core Features

### 🔍 Repository Analysis
- Repository metadata
- Languages and technologies
- File structure
- Important project files
- Project organization

### 🏗️ Architecture Visualization
RepoLens converts repository structure into a visual architecture view so developers can understand relationships between frontend, components, services, APIs, backend, and other project layers.

### 💡 Contribution Discovery
Contribution recommendations can include:
- Contribution title
- Difficulty
- Expected impact
- Relevant files
- Reason for the recommendation
- Implementation steps
- Acceptance criteria

### 📝 Issue Generation
Turn a contribution opportunity into a structured issue containing a problem description, proposed solution, implementation plan, and acceptance criteria.

### 🧪 Test Planning
Generate focused test plans for selected repository files and components.

### 🎯 Demo Mode
RepoLens includes a demo repository so the interface can still be explored when the backend or external APIs are unavailable.

## 🧠 How It Works

```text
GitHub Repository
       ↓
   GitHub API
       ↓
Repository Structure
       ↓
Technology Detection
       ↓
  AI Analysis
       ↓
 ┌─────┼───────────┐
 ↓     ↓           ↓
Architecture  Important  Contributions
Map           Files      Opportunities
 └─────┼───────────┘
       ↓
Implementation Plan
       ↓
Generated Issue
```

## 🏗️ Architecture

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Flow

### Backend
- Python
- FastAPI
- HTTPX
- Pydantic

### External Services
- GitHub REST API
- AI model API

## 📂 Project Structure

```text
RepoLens/
├── App.tsx
├── ArchitectureGraph.tsx
├── FileTree.tsx
├── CommandPalette.tsx
├── repository.ts
├── analysis.ts
├── contributions.ts
├── issues.ts
├── client.ts
├── demoRepository.ts
├── backend/
│   ├── main.py
│   ├── ai.py
│   ├── requirements.txt
│   ├── .env
│   └── .venv/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## ⚡ Getting Started

### Prerequisites

- Node.js
- npm
- Python 3.10+
- Git
- GitHub token for API access

### 1. Clone

```bash
git clone https://github.com/rishipilla/repolens.git
cd repolens
```

### 2. Frontend

```bash
npm install
npm run dev
```

### 3. Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GITHUB_TOKEN=your_github_token
AI_API_KEY=your_ai_api_key
```

Never commit this file.

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend health check:

```text
http://localhost:8000/api/health
```

## 🧪 Example

Try analyzing:

```text
https://github.com/rohitg00/agentmemory
```

The intended workflow is:

```text
Repository
   ↓
Structure
   ↓
Technology Stack
   ↓
Architecture
   ↓
Important Files
   ↓
Contribution Opportunities
   ↓
Implementation Plan
```

## 🔐 Security

Sensitive credentials stay on the backend. Never expose `GITHUB_TOKEN` or `AI_API_KEY` to the frontend. Environment files and virtual environments are excluded from Git.

## 📈 Scalability

The architecture can evolve into a multi-user developer platform using repository-analysis caching, commit-SHA based invalidation, asynchronous jobs, queue-based processing, source-file filtering, AI response caching, API rate limiting, GitHub OAuth, user history, and team workspaces.

A key optimization is avoiding repeated analysis of the same repository commit.

## 🎯 Who Is It For?

### 👨‍💻 Developers
Understand unfamiliar codebases faster.

### 🌱 Open-Source Contributors
Find realistic first contributions.

### 🎓 Students
Reduce the barrier to entering real-world repositories.

### 🧑‍💼 Development Teams
Speed up onboarding when developers join unfamiliar projects.

### 🛠️ Maintainers
Help contributors understand projects before submitting changes.

## 🌍 Why RepoLens?

Existing AI coding tools can answer questions about code. RepoLens focuses the workflow on repository understanding and contribution discovery:

```text
“I found a repository.”
        ↓
“What does it contain?”
        ↓
“How is it structured?”
        ↓
“Where can I contribute?”
        ↓
“What files should I change?”
        ↓
“How should I implement it?”
        ↓
“Can I turn this into an issue?”
```

### RepoLens turns repository exploration into contribution action.

## 🛣️ Roadmap

### Phase 1 — MVP
- [x] Repository analysis UI
- [x] Repository file tree
- [x] Technology detection UI
- [x] Architecture visualization
- [x] Contribution discovery UI
- [x] Issue generation UI
- [x] Demo mode

### Phase 2 — Developer Workflow
- [ ] GitHub OAuth
- [ ] Create GitHub issues directly
- [ ] Pull request assistance
- [ ] Improved code understanding
- [ ] Repository search
- [ ] Contribution history

### Phase 3 — Platform
- [ ] User workspaces
- [ ] Team collaboration
- [ ] Repository monitoring
- [ ] Contributor matching
- [ ] Organization dashboards
- [ ] Advanced repository intelligence

## 🤝 Contributing

Contributions are welcome. Fork the repository, create a branch, make your changes, and open a pull request.

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

## 📜 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 👨‍💻 Built for Hacktoberfest Hack Day 2026

RepoLens was built as a developer-focused project exploring how AI can reduce the barrier to understanding and contributing to open-source software.

### Built with ❤️ by Rishi Pilla

**Repository:** https://github.com/rishipilla/repolens
