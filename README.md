<div align="center">

# 👻 Ghost Job Hunter

**Stop applying to ghosts. Find real, active tech jobs.**

[Live Demo](https://ghost-job-hunter.vercel.app/) • [Report a Bug](https://github.com/PradeepkrishnaGM/ghost-job-hunter/issues/new?labels=bug&title=Bug%3A+) • [Request a Feature](https://github.com/your-username/ghost-job-hunter/issues/new?labels=enhancement&title=Feature%3A+)

</div>

---

## The Problem

Job boards are flooded with **Ghost Jobs** — stale listings left open for months just to collect resumes, inflate company optics, or satisfy shareholder quotas. Job seekers waste countless hours tailoring resumes and applying to roles that do not actually exist.

---

## The Solution

**Ghost Job Hunter** is an automated job aggregator that actively scrapes global tech listings and mathematically flags postings that have been sitting idle for over **45 days**.

---

## Features

### Automated Data Pipeline
A Python-based scraper runs continuously via GitHub Actions, aggregating live roles from:

- LinkedIn (top tech giants)
- RSS feeds (remote startups)

### Ghost Job Detection
Automatically calculates the age of a job posting and visually flags it if it crosses the stale threshold.

### Database Pruning
Built-in data retention policies automatically sweep and delete jobs older than **90 days** to keep the index fresh and performant.

### Lightning Fast Search
Real-time search and filtering powered by **Next.js Server Components**.

### Modern UI
Responsive, dark-mode-first dashboard featuring:

- Glassmorphism
- CSS Grid layouts
- Visual status indicators

---

## Tech Stack

| Category | Technologies |
|--------|-------------|
| Frontend | Next.js (App Router), React, Tailwind CSS, TypeScript |
| Database & Auth | Supabase (PostgreSQL) |
| Data Engine | Python (`requests`, `beautifulsoup4`, `feedparser`) |
| Automation | GitHub Actions (Cron Jobs) |
| Hosting | Vercel |

---

## Architecture: How It Works

Instead of live-scraping the web when a user searches (which is slow and can lead to IP bans), this app uses an **Index Architecture**:

### 1. The Crawler
A GitHub Action triggers `scraper.py` every **5 hours**.

### 2. The Processing
Python parses XML/HTML, normalizes company names, calculates job age, and removes duplicate links.

### 3. The Index
Cleaned data is pushed into a **Supabase PostgreSQL** database.

### 4. The UI
The Next.js frontend queries the indexed database instantly, delivering a sub-second search experience.

---

## Local Setup

Want to run this locally? Follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/ghost-job-hunter.git
cd ghost-job-hunter/web-app
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a .env.local file inside the web-app directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser and visit:

```bash
http://localhost:3000
```
