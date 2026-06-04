# Readiora

Readiora is a modern study workspace built with React, Vite, and Supabase. It gives students a focused place to manage subjects, write notes, upload attachments, and track study activity inside a polished command-center style interface.

## Overview

The app is a frontend React single-page application with Supabase handling authentication, database access, and file storage. The codebase is organized around clear page, component, service, hook, and context layers so the project is easy to extend as new study and AI-assisted features are added.

## Features

- Public landing page for the Readiora product experience.
- Email/password authentication with Supabase.
- Google and GitHub OAuth sign-in.
- Protected dashboard, subjects, notes, and settings routes.
- Subject creation, editing, and deletion.
- Markdown-style note editing and previewing.
- Note attachment uploads through Supabase Storage.
- Profile settings with avatar and phone support.
- Responsive app shell with protected navigation.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, JavaScript ES modules |
| Build Tool | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4, CSS |
| Backend Services | Supabase Auth, Postgres, Storage |
| Animation | Framer Motion, Motion |
| Icons | Lucide React |
| Tooling | ESLint, shadcn config |

## Getting Started

### Prerequisites

- Node.js
- npm
- Supabase project credentials

### Installation

```bash
npm install
```

Create a local `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:

```bash
npm run dev
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production app into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint checks. |

## Project Structure

```text
Readiora/
  docs/                  Project documentation
  playform/              Local design and reference assets
  public/                Static assets served directly by Vite
  src/
    assets/              Images imported by React components
    components/          Shared UI components
    context/             React context providers
    hooks/               Reusable React hooks
    lib/                 Shared library setup
    pages/               Route-level screens
    routes/              Route guards and routing helpers
    services/            Supabase service functions
    App.jsx              Main route table
    main.jsx             React entry point
```

## Key Folders

| Path | Purpose |
| --- | --- |
| `src/pages/` | Main screens for landing, auth, dashboard, subjects, notes, and settings. |
| `src/components/` | Reusable UI, layout components, landing sections, and visual effects. |
| `src/services/` | Supabase-facing functions for auth, profiles, subjects, notes, and attachments. |
| `src/hooks/` | Shared React hooks such as `useAuth`. |
| `src/context/` | App-level state providers such as profile context. |
| `src/lib/` | Shared setup files, including the Supabase client. |
| `docs/` | Architecture notes and file navigation docs. |

## Environment

The app expects these Vite environment variables:

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key. |

Do not commit `.env` files or private credentials.

## Documentation

- `docs/file-map.md` explains where files live and when to edit them.
- `docs/architecture.md` documents the current app architecture and route flow.
- `AI_STACK_CONTEXT.md` summarizes the project stack and technical direction.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Status

Readiora is under active development. The current codebase focuses on the React app shell, authentication, subjects, notes, attachments, and profile settings. AI-facing product direction exists in the interface and project context, but no live AI provider integration is currently wired into the application.
