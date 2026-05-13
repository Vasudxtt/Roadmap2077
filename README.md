# RoadMap2077 — AI Career Intelligence Platform

> **From Doubt to Clarity** — Personalized career roadmaps, exam planners, project guidance, resume AI & more. Powered by Groq.

![Version](https://img.shields.io/badge/version-3.0--VOID-c8ff00?style=flat-square&labelColor=000)
![License](https://img.shields.io/badge/license-MIT-c8ff00?style=flat-square&labelColor=000)
![Stack](https://img.shields.io/badge/stack-Node.js%20%2B%20Express%20%2B%20Groq-c8ff00?style=flat-square&labelColor=000)

---

## What is RoadMap2077?

RoadMap2077 is a full-stack AI career intelligence platform built for Indian students and professionals. It covers every domain — tech, medical, finance, law, content creation, government — and gives you brutally honest, personalized guidance in seconds.

No login. No paywalls. Just AI Without Limit.

---

## Features

**AI Career Roadmaps** — Enter any career goal (Full Stack Dev, MBBS, CA, UPSC, YouTuber) and get a step-by-step roadmap with skills, timelines, resources, and hands-on projects.

**Student Path** — Stream-specific roadmaps for Class 11–12 (PCM, PCB, PCMB, Commerce, Arts) with chapter sequencing and daily study hours. Includes an AI quiz for undecided students.

**Exam Planner** — Brutally honest, topic-by-topic study plans for JEE, NEET, UPSC, GATE, CAT, SSC, CUET, CLAT and more. Includes week-by-week schedules and weak-area focus.

**Question Papers** — AI-generated sample questions for last 5 years' papers across all major exams. Quick links to official sites and PDF sources.

**Project Hub** — World's best websites (Awwwards-curated) + 40+ guided build projects. Click any project → instant AI mentor guide with step-by-step instructions.

**Resume AI** — Three modes:
- Analyze your existing resume (ATS score + improvements)
- Smart Generate (paste JD → AI writes resume)
- GitHub Resume (enter username → AI fetches repos, picks best ones, builds resume)

**AI Chat** — Unlimited career Q&A with a context-aware mentor trained on Indian education and career paths.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express |
| AI | Groq API (LLaMA 3) |
| Frontend | Vanilla HTML/CSS/JS |
| Fonts | Syne, Space Mono, DM Sans |
| Deployment | Any Node.js host (Render, Railway, etc.) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Groq API key → [console.groq.com](https://console.groq.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/Vasudxtt/Roadmap2077.git
cd Roadmap2077

# Install dependencies
npm install

# Create your environment file
echo "GROQ_API_KEY=your_key_here" > .env

# Start the server
node server.js
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure

```
Roadmap2077/
├── public/
│   └── index.html       # Full frontend (single-page app)
├── server.js            # Express server + Groq API proxy
├── package.json
├── .env                 # Your secret keys (never committed)
├── .gitignore
└── README.md
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> **Never commit your `.env` file.** It is already in `.gitignore`.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai` | POST | Proxy to Groq AI — used by all AI features |
| `/api/awwwards` | GET | Curated site-of-the-day data for Project Hub |
| `/api/github/auto-resume` | POST | Fetches GitHub profile + repos for resume generation |

---

## Screenshots

> Dashboard with hero section, feature cards, and career ticker

> Roadmap page with step-by-step AI-generated career path

> Resume AI with GitHub integration and ATS scoring

---

## Roadmap

- [ ] User accounts + saved roadmaps
- [ ] PDF export for roadmaps and study plans
- [ ] More exam support (BITSAT, NIMCET, XAT)
- [ ] Mobile app (React Native)
- [ ] Community project showcase

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT © [Vasudxtt](https://github.com/Vasudxtt)

---
Open → https://roadmap2077.onrender.com/

<div align="center">
  <strong>Built with ⚡ and Groq AI</strong><br>
  <sub>Made for every student who ever Googled "what to do after 12th"</sub>
</div>
