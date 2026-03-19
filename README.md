# Evalis

Evalis is a web-based school assessment system designed to help schools manage classes, assessments, submissions, and results through a clean browser-based experience.

## MVP Goals

- Support school admin and teacher accounts
- Create classes and assessments
- Collect student submissions
- Review and score submissions
- Show basic results and progress views

## Proposed Structure

- `apps/web` - Next.js frontend web application
- `apps/api` - NestJS backend API for the web application
- `packages/shared` - optional shared types if they become necessary
- `docs` - product and architecture notes
- `infra` - deployment and environment setup notes

## Recommended Stack

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: Auth.js or a simple session-based approach
- Testing: Vitest, Playwright, and Supertest

## Next Build Steps

1. Initialize the web app in `apps/web`
2. Initialize the API in `apps/api`
3. Model the first core entities in Prisma
4. Build auth, classes, assessments, and submissions
5. Add basic teacher scoring and results flows
