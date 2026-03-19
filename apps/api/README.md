# API App

NestJS backend API for the Evalis web application.

## Current Scope

- Auth module scaffold
- Users module with Prisma reads
- Classes module with Prisma reads
- Assessments module with Prisma reads and create flow
- Prisma migration and seed support

## Local Database With Docker

The project includes a local PostgreSQL setup in the root [docker-compose.yml](d:/LUBO/UKTC/Evalis/docker-compose.yml).

Default database settings:

- database: `evalis`
- user: `postgres`
- password: `postgres`
- port: `5432`

Start the database:

`docker compose up -d`

Stop the database:

`docker compose down`

Stop the database and remove its stored data volume:

`docker compose down -v`

## Local Environment

Create `apps/api/.env` from `apps/api/.env.example` and keep the Docker-matching PostgreSQL connection:

- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/evalis?schema=public"`
- `API_PORT=4000`

## Local Run Steps

1. Install dependencies from the repo root:
   `npm install`
2. Start PostgreSQL:
   `docker compose up -d`
3. Copy `apps/api/.env.example` to `apps/api/.env`
4. Generate the Prisma client:
   `npm run prisma:generate --workspace api`
5. Apply the database migration:
   `npm run prisma:migrate:dev --workspace api`
6. Seed the database:
   `npm run prisma:seed --workspace api`
7. Start the API:
   `npm run start:dev --workspace api`

## Helpful Scripts

- `npm run prisma:generate --workspace api`
- `npm run prisma:migrate:dev --workspace api`
- `npm run prisma:migrate:deploy --workspace api`
- `npm run prisma:seed --workspace api`
- `npm run db:setup --workspace api`
- `npm run start:dev --workspace api`
