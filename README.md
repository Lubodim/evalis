# Evalis

Evalis is an intelligent school assessment system designed to help schools create, manage, review, and improve student assessments with AI-assisted workflows.

## MVP Goals

- Support school admin and teacher accounts
- Create classes and assessments
- Collect student submissions
- Assist grading with AI
- Generate simple performance insights

## Proposed Structure

- `apps/web` - school-facing frontend
- `apps/api` - backend API and AI orchestration
- `packages/shared` - shared types and validation
- `docs` - product and architecture notes
- `infra` - deployment and environment setup notes

## Recommended Stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: Clerk or Auth.js
- AI: OpenAI API
- Testing: Vitest, Playwright, and Supertest

## Next Build Steps

1. Initialize the web app in `apps/web`
2. Initialize the API in `apps/api`
3. Model the first core entities in Prisma
4. Build auth, classes, assessments, and submissions
5. Add AI-powered grading assistance
