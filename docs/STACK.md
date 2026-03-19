# Recommended Tech Stack

## Why This Stack

The goal is to build a clean web MVP quickly, keep the codebase understandable, and avoid extra layers until they are truly needed.

## Frontend

- Next.js
- TypeScript

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

## Auth

- Auth.js if you want a flexible web-native auth layer
- A simpler custom session approach is also fine for the first version

## Shared Code

- `packages/shared` only if shared types become necessary

Why:

- Avoids premature abstraction
- Keeps the MVP simple while leaving room to share types later

## Testing

- Vitest for unit tests
- Supertest for API tests
- Playwright for end-to-end flows
