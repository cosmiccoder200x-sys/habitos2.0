# HabitOS2.0 — Build Streaks & Earn XP.

A gamified habit and task tracker built with React + Vite. Track daily habits, manage tasks, earn XP, level up, unlock badges, and stay motivated with streaks, a heatmap, and a Pomodoro timer — all running fully client-side with no backend required.

## Features

- **Habit Tracking** — Create habits with custom icons, mark daily completions, and build streaks
- **Task Manager** — Add tasks with priority levels (low / medium / high) and due dates
- **XP & Leveling System** — Earn XP for completing habits and tasks, progress through 7 levels (Seedling → Unstoppable)
- **Achievements / Badges** — Unlock badges for milestones like 7-day streaks, 1000 XP, completing 20 tasks, and more
- **Daily Missions** — Rotating daily challenges to keep you engaged
- **Activity Heatmap** — GitHub-style calendar heatmap visualizing your consistency over time
- **Analytics Dashboard** — Visual breakdown of habits, tasks, and focus time
- **Pomodoro Timer** — Built-in focus timer with 25/5, 50/10, and 90/20 presets
- **Daily Journal** — Quick mood check-ins and journal entries
- **Productivity Pet** — A virtual companion that reacts to your consistency
- **Data Manager** — Import/export your data as JSON for backup or transfer
- **Dark Mode UI** — Clean, modern dark-themed interface throughout

## Tech Stack

- **React 18** — UI library
- **Vite 5** — Build tool and dev server
- **localStorage** — Client-side data persistence (no database or backend needed)

## Project Structure

```
habitos-fixed/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── Heatmap.jsx
│   │   ├── Achievements.jsx
│   │   ├── Analytics.jsx
│   │   ├── DailyMissions.jsx
│   │   ├── ProductivityPet.jsx
│   │   └── DataManager.jsx
│   ├── lib/
│   │   └── productivity.js     # Core logic: levels, badges, dates, streaks
│   ├── App.jsx                 # Main app state & layout
│   └── main.jsx                # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js (v20.x recommended)
- npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd habitos-fixed

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

This generates a static `dist/` folder ready to deploy anywhere.

### Preview Production Build Locally

```bash
npm run preview
```

## Deployment (Vercel)

This project deploys to Vercel with zero configuration:

1. Push this repo to GitHub
2. On [vercel.com](https://vercel.com), click **Add New Project** and import the repo
3. Vercel auto-detects the **Vite** framework preset
4. Build command: `npm run build` · Output directory: `dist`
5. Deploy — no environment variables required

> **Note:** If your repo has the project files nested inside a subfolder, set **Root Directory** in Vercel's project settings accordingly before deploying.

## Data & Privacy

All data (habits, tasks, XP, badges, journal entries) is stored locally in your browser via `localStorage`. Nothing is sent to a server. Clearing your browser data will reset the app — use the built-in **Data Manager** to export a backup first.

## License

Personal project — license as you see fit.
