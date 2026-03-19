# Evalis Architecture

## Repository Shape

This project starts as a simple workspace-based monorepo for a web-only application.

## Applications

### `apps/web`

The Next.js frontend for admins, teachers, and students.

Suggested responsibilities:

- Authentication UI
- Dashboards
- Assessment creation
- Submission flows
- Reporting views

### `apps/api`

The NestJS backend API and business logic layer for the web app.

Suggested responsibilities:

- Authentication integration
- User, class, and assessment APIs
- Submission processing
- Reporting endpoints

## Shared Package

### `packages/shared`

Optional package for shared TypeScript types and validation only if duplication becomes a real issue.

It should stay minimal and does not need to be used in the first iteration.

## Data Layer

- PostgreSQL as the primary database
- Prisma for schema management and queries

## MVP Scope Guardrails

- Web application only
- No mobile client
- No desktop client
- No AI features in the initial foundation

## Deployment Direction

- Frontend: Vercel
- Backend: Railway, Render, or Fly.io
- Database: Neon or Supabase Postgres
