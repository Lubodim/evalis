# Evalis Architecture

## Repository Shape

This project starts as a simple workspace-based monorepo so shared code can live in one place from the beginning.

## Applications

### `apps/web`

The frontend for admins, teachers, and students.

Suggested responsibilities:

- Authentication UI
- Dashboards
- Assessment creation
- Submission flows
- Reporting views

### `apps/api`

The backend API and business logic layer.

Suggested responsibilities:

- Authentication integration
- User, class, and assessment APIs
- Submission processing
- AI evaluation orchestration
- Reporting endpoints

## Shared Package

### `packages/shared`

Suggested responsibilities:

- Shared TypeScript types
- Zod validation schemas
- Common constants

## Data Layer

- PostgreSQL as the primary database
- Prisma for schema management and queries

## AI Layer

- OpenAI API for feedback generation and grading assistance
- Human-in-the-loop review for any final grading action

## Deployment Direction

- Frontend: Vercel
- Backend: Railway, Render, or Fly.io
- Database: Neon or Supabase Postgres
