# Recommended Tech Stack

## Why This Stack

The goal is to move fast, keep types consistent across the system, and leave room for AI-heavy workflows without rebuilding later.

## Frontend

- Next.js
- TypeScript
- Tailwind CSS

Why:

- Great developer speed
- Strong routing and server-side support
- Easy deployment

## Backend

- NestJS
- TypeScript

Why:

- Clear module boundaries
- Good fit for roles, APIs, services, and background processing
- Easy to scale as business logic grows

## Database

- PostgreSQL
- Prisma

Why:

- Reliable relational model for schools, users, classes, assessments, and submissions
- Prisma keeps schema and queries productive

## AI

- OpenAI API

Why:

- Strong fit for rubric-based feedback, answer evaluation assistance, and summarization

## Auth

- Clerk for fastest MVP
- Auth.js if you want more control inside your own stack

## Testing

- Vitest for unit tests
- Supertest for API tests
- Playwright for end-to-end flows
