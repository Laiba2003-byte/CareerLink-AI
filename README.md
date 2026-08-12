# CareerLink AI

**CareerLink AI** is a personal AI-powered career networking and relationship management platform designed to turn your existing LinkedIn company network into targeted professional opportunities.

Instead of mass-sending connection requests or generic messages, CareerLink AI helps identify **which companies and hiring professionals are actually worth approaching**, understand why they are relevant to your career goals, and prepare personalized outreach while keeping the user in control of every LinkedIn action.

## How It Works

CareerLink AI starts by importing the user's LinkedIn **Company Follows** data. The imported companies are matched against the user's skills, experience, target roles, and career interests to identify the most promising companies.

For each relevant company, the user can add potential HR professionals or recruiters. AI then analyzes the contact's role, the company, available hiring signals, and the user's profile to determine how relevant that person is and why they should be approached.

The networking process follows a structured relationship pipeline:

```text
NOT CONTACTED
      ↓
HR IDENTIFIED
      ↓
YOU APPROVED HR
      ↓
CONNECTION REQUEST READY
      ↓
YOU SEND ON LINKEDIN
      ↓
CONNECTION REQUESTED
      ↓
HR ACCEPTED
      ↓
CONNECTED
      ↓
FOLLOW-UP READY
      ↓
YOU SEND MESSAGE
      ↓
RESPONDED
      ↓
INTERESTED
```

At each stage, CareerLink AI provides intelligence and recommendations, while the user remains responsible for external LinkedIn actions.

### AI Responsibilities

The AI helps with:

* Company research and relevance scoring
* Identifying why a company may be a good career target
* Analyzing HR/recruiter relevance
* Finding the best outreach angle
* Generating personalized connection notes
* Generating context-aware follow-up messages
* Analyzing recruiter responses
* Detecting hiring intent and opportunity signals
* Recommending the next best action
* Maintaining relationship context across interactions

### Human Responsibilities

The user remains in control of:

* Approving HR/recruiter contacts
* Reviewing and editing AI-generated messages
* Sending LinkedIn connection requests
* Marking connection requests as sent
* Marking accepted connections
* Sending follow-up messages
* Recording recruiter responses
* Deciding whether to pursue an opportunity

CareerLink AI **does not automate LinkedIn actions, scrape LinkedIn, or send connection requests/messages automatically**. Its purpose is to provide the intelligence and preparation needed to make the user's networking more targeted and effective.

## Core Philosophy

The goal is not to **contact as many HRs as possible**.

The goal is to:

> **Find the right companies, identify the right people, build meaningful professional relationships, and turn those relationships into genuine career opportunities.**

CareerLink AI essentially acts as a **personal AI career networking assistant + relationship CRM**, helping the user know **who to approach, why to approach them, what to say, and what to do next**.

## Project Structure

```text
backend/    Express API, AI services, Prisma schema, backend .env
frontend/   React + Vite + MUI app, frontend .env
```

## Setup

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the API from `backend/`:

```bash
npm run dev
```

Start the frontend from `frontend/` in another terminal:

```bash
npm run dev
```

Open:

```text
Use the local URL printed by Vite. It usually starts at http://127.0.0.1:5173 and automatically moves to the next available port if needed.
```

## Local Data And Neon

By default, the backend uses a local JSON data store at `backend/data/dev-store.json` so the app can run immediately.

The backend allows browser requests from any localhost, `127.0.0.1`, or `::1` port by default, so the frontend can run on whichever port Vite selects without CORS errors.

To use Neon/PostgreSQL:

1. Open `backend/.env`.
2. Set `DATABASE_URL` to your Neon connection string.
3. From `backend/`, run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Then start the server normally.

To force the local JSON store even when `DATABASE_URL` exists, set:

```text
DATA_STORE=file
```

## AI

Without an API key, the app returns deterministic AI-style drafts and recommendations so the workflow remains usable.

To use an LLM, set:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

The AI code is centralized in `backend/src/services/ai`.
