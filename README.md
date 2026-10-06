# Hospital Management Platform — Appointment Booking

An appointment booking system with two portals:

- **Patient portal**: register, log in, pick a department, pick a doctor, pick an available date,
  and book — instantly getting a token number and estimated reporting time.
- **Admin portal** (`/admin`): manage departments, doctor profiles (qualification, specialization,
  registration number, consultation fee) and weekly consultation timings. Changes that would break
  an already-booked appointment (lowering the daily limit below existing bookings, removing/moving a
  day with future bookings, deactivating a doctor with future bookings) are blocked with the list of
  affected dates.

- **Backend**: Java 17, Spring Boot 3.5, Spring Security (JWT, role-based: `PATIENT` / `ADMIN`), MyBatis, MySQL 8, Flyway
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Specs**: see [`spec_details/`](spec_details/) for the full module specifications this app implements

## Quick start (Docker — recommended)

Requires only [Docker](https://docs.docker.com/get-docker/) with Compose. No local Java/Node/MySQL needed.

```bash
docker compose up -d --build
```

This builds and starts three containers in order (MySQL → backend → frontend, each waiting for the
previous to be healthy):

| Service | URL |
|---|---|
| Frontend (patient portal) | http://localhost:3000 |
| Admin portal | http://localhost:3000/admin/login |
| Backend API | http://localhost:8080/api/v1 |
| API docs (Swagger UI) | http://localhost:8080/swagger-ui.html |
| Backend health | http://localhost:8080/actuator/health |
| MySQL | localhost:3306 |

Open http://localhost:3000, register a new patient, and book an appointment. Departments and
doctors are pre-seeded (see `backend/src/main/resources/db/migration/V2__seed_departments_doctors.sql`)
and can be further managed from the admin portal.

**Admin login**: username `admin`, temporary password `Admin@123` (seeded by
`V3__seed_admin.sql`). You'll be forced to change it on first login.

To customize ports/credentials, copy `.env.example` to `.env` and edit it — `docker compose` picks
it up automatically:

```bash
cp .env.example .env
```

Useful commands:

```bash
docker compose logs -f              # tail logs from all services
docker compose down                 # stop containers, keep data
docker compose down -v              # stop containers and wipe the MySQL volume (fresh start)
docker compose up -d --build        # rebuild after code changes
```

## Manual setup (local development, no Docker)

Useful if you're actively developing and want faster rebuild loops than `docker compose build`.

### Prerequisites

- Java 17+ and Maven
- Node.js 20+ and npm
- A MySQL 8.0.16+ server reachable from your machine (the easiest way is still via Docker — see below)

### 1. Start MySQL

```bash
docker run -d --name hms-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=hms \
  -e MYSQL_USER=hms \
  -e MYSQL_PASSWORD=hms \
  -p 3306:3306 \
  mysql:8.0.36
```

(Or point at any MySQL 8.0.16+ instance you already have — just adjust the env vars in step 2.)

### 2. Run the backend

```bash
cd backend
DB_HOST=127.0.0.1 DB_USER=hms DB_PASSWORD=hms DB_NAME=hms mvn spring-boot:run
```

Flyway applies all migrations (schema + seed data) automatically on startup. The API is then live at
`http://localhost:8080/api/v1`, with interactive docs at `http://localhost:8080/swagger-ui.html`.

Run the tests (includes a Testcontainers-backed concurrency test, so Docker must be running):

```bash
cd backend && mvn test
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app is then live at `http://localhost:3000`. It talks to the backend via
`NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` (defaults to `http://localhost:8080/api/v1`).

## Environment variables

See [`.env.example`](.env.example) for the full list (MySQL credentials, JWT secret, CORS origin,
frontend API base URL). Every variable has a working default for local/dev use — you only need a
`.env` file if you want to override something.

## Project structure

```
backend/    Spring Boot API — see backend/Dockerfile
frontend/   Next.js app — see frontend/Dockerfile
spec_details/   Module specs this app implements
docker-compose.yml   Runs mysql + backend + frontend together
```
