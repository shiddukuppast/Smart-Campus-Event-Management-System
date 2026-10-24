# Smart Campus Event Management API

This directory is a standalone Next.js App Router API backend. It does not contain or replace a frontend.

## Setup

Requirements: Node.js 20+ and a MongoDB Atlas cluster. Atlas must use a replica set (the standard Atlas deployment does) if you later add multi-document transactions. The current capacity strategy uses atomic single-document updates and does not require an explicit transaction.

```powershell
cd backend
npm install
Copy-Item .env.example .env.local
```

Set `MONGODB_URI` to the Atlas connection string and set `JWT_SECRET` to a random value of at least 32 characters. Do not commit `.env.local`.

Next.js loads `backend/.env`, `.env.local`, and other standard environment files when the backend process starts. This checkout currently uses the existing `backend/.env`; no backend `.env.local` is required. Restart the backend after changing environment variables. Keep whichever backend file contains the valid values private and never expose it through a `NEXT_PUBLIC_` variable.

If requests return `503 Database temporarily unavailable`, inspect the backend terminal for a sanitized connection diagnostic. For MongoDB Atlas, verify that the cluster is running, the connection string is current, the database user/password are valid, and the current public IP is present in Atlas Network Access. Corporate VPNs, firewalls, and DNS filters can also block MongoDB SRV or port 27017 traffic.

```powershell
npm run dev
```

The API is available at `http://localhost:3001/api`. Verify it is running with `GET /api/events`; an empty database returns a successful empty list.

## Authentication

Authentication is JWT-based, but the token is stored only in an HTTP-only `sc_auth` cookie. Browser clients must use `credentials: "include"` for every authenticated request. Cookies are `Secure` in production and use `SameSite=Lax`.

All responses use one of these shapes:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "message": "Description" } }
```

Endpoints:

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/events` | Organizer |
| GET | `/api/events` | Public, published events |
| GET | `/api/events/my-events` | Organizer |
| GET | `/api/events/:id` | Public, published events |
| PATCH | `/api/events/:id` | Owning organizer |
| DELETE | `/api/events/:id` | Owning organizer |
| GET | `/api/events/:id/participants` | Owning organizer |
| POST | `/api/events/:id/register` | Participant |
| DELETE | `/api/events/:id/register` | Registering participant |
| GET | `/api/registrations/my-registrations` | Participant |
| GET | `/api/analytics/organizer` | Organizer |

Registration body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "StrongPassword123",
  "role": "PARTICIPANT"
}
```

Event body:

```json
{
  "title": "Campus Workshop",
  "description": "A practical workshop",
  "category": "Workshop",
  "venue": "Innovation Lab",
  "startDate": "2026-11-10T10:00:00.000Z",
  "endDate": "2026-11-10T12:00:00.000Z",
  "registrationDeadline": "2026-11-09T23:59:59.000Z",
  "capacity": 100,
  "status": "PUBLISHED"
}
```

List filters include `search`, `category`, `organizer`, `startDate`, `endDate`, `page`, `limit`, and `sort=date|recently-created`. Limits are capped at 100.

## Capacity and consistency

Events maintain an `activeRegistrations` counter. Registration first performs an atomic MongoDB `findOneAndUpdate` whose filter requires `activeRegistrations < capacity`, incrementing the counter as the reservation. It then creates the registration. The unique partial index on `(event, participant)` for `REGISTERED` prevents duplicate active registrations. Failed registration creation rolls back the counter, and cancellation atomically changes the registration status before decrementing the counter. This prevents overbooking without relying on a count-then-insert race-prone sequence. MongoDB Atlas is still recommended for reliable index creation and production durability.

Deleting an event removes its registrations after deleting the event. For maximum cross-document atomicity, production deployments may wrap that operation in a MongoDB transaction on an Atlas replica set.

## Frontend integration

For local development, the frontend defaults to a Next.js rewrite and uses `/api`, while the backend listens on port 3001. For a separate deployment or direct browser requests, set the frontend `NEXT_PUBLIC_API_URL` to the backend origin and configure `FRONTEND_ORIGIN` to the exact frontend origin. The backend returns credentialed CORS headers only for that configured origin. Deploy both over HTTPS and use:

```ts
fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
```

The backend does not expose JWT secrets or password hashes. Participant identity is always taken from the cookie-authenticated user, never from a request body.

## Postman test plan

Use a collection variable `baseUrl=http://localhost:3000` and enable cookie handling. Run the tests in this order:

1. `POST {{baseUrl}}/api/auth/register` with a participant body: **201**, safe user and cookie.
2. Register with role `ORGANIZER`: **201**, safe user and cookie.
3. Repeat either email: **409**.
4. Omit a required field or use an invalid email: **400**.
5. `POST /api/auth/login` with valid credentials: **200**, cookie.
6. Login with a wrong password: **401**, generic error.
7. `GET /api/auth/me`: **200** and no password field.
8. As organizer, `POST /api/events` with the example body: **201**.
9. As participant, `POST /api/events`: **401** or **403**.
10. `GET /api/events?category=Workshop&page=1&limit=10`: **200** with pagination.
11. As the owner, `PATCH /api/events/:id`: **200**.
12. As another organizer, patch the same event: **404**.
13. As participant, `POST /api/events/:id/register`: **201**.
14. Repeat registration: **409**.
15. Set capacity to the active registration count and attempt another participant registration: **409**.
16. `DELETE /api/events/:id/register` as the registering participant: **200**.
17. `GET /api/registrations/my-registrations`: **200** with event and status.
18. As owner, `GET /api/events/:id/participants`: **200** with only management fields.
19. As organizer, `GET /api/analytics/organizer`: **200**, scoped to that organizer.
20. Call protected endpoints without the cookie: **401**.
21. Send concurrent `POST /api/events/:id/register` requests for an event with capacity 1 using two participant cookie jars: at most one succeeds with **201**; the other receives **409**.

Build/type validation:

```powershell
npm run typecheck
npm run build
```
