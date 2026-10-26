# SereneSpace

A mental health and wellness web app for Indian users: an emotion-aware chatbot, a peer support forum where members appear under usernames, counselor appointment booking, wellness resources and an India-specific crisis helpline page.

> SereneSpace is a support tool, not a substitute for professional care. If you or someone you know is in crisis, call **112**, **AASRA** (+91 9820466726, 24x7) or see the helplines at the bottom of this page.

## Features

- **SereneBot chatbot**: classifies the user's emotion with OpenAI, then writes a short empathetic reply. If OpenAI is unavailable it falls back to keyword rules. Messages that match crisis phrases skip the model and always get a helpline reply. Anonymous use is allowed.
- **Peer Hub**: posts and comments, one like per user, flagging, and admin/counselor moderation (hide, unhide, unflag).
- **Appointments**: users book a counselor; counselors confirm, cancel or complete; admins manage everything.
- **Resources**: animated breathing guide, meditation audio, curated articles.
- **Crisis support**: AASRA, Vandrevala Foundation, iCall, NIMHANS and 112.
- **Admin dashboard**: platform analytics, flagged posts and comments, user list.

### Roles and privacy

| Role | Can do |
| --- | --- |
| `user` | Chat, post, comment, like, flag, book and cancel own appointments |
| `counselor` | Everything a user can, plus manage appointments assigned to them and moderate content |
| `admin` | Everything, including user management and analytics |

- **Dual identity**: the public `username` is shown in the forum; `fullName` and `email` are visible only to admins and to counselors who share an appointment with that user.
- **Self-registration always creates a `user`.** Counselor and admin roles are granted by an admin (`PUT /api/users/:id`), or directly in the database for the first admin.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 (Create React App), React Router 6, Bootstrap 5, react-icons |
| Backend | Node.js, Express 4 (ES modules) |
| Database | SQLite via Prisma 6 |
| Auth | JWT (2-hour tokens), bcryptjs |
| AI | OpenAI API (`openai` SDK), `sentiment` for the offline fallback |
| Hardening | `helmet`, CORS allow-list, `express-rate-limit` |

## Getting started

Requires Node.js 18+ and npm.

### 1. Backend

```bash
cd backend/express
npm install
cp .env.example .env     # then edit the values
npx prisma generate
npx prisma migrate dev
npm run dev              # or: npm start
```

The API runs on `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The app runs on `http://localhost:3000`.

### Environment variables

Backend (`backend/express/.env`):

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | **Yes** | Signing secret for tokens. The server will not start without it. Generate one with `openssl rand -base64 32`. |
| `OPENAI_API_KEY` | No | Enables AI replies. Without it the chatbot uses keyword fallbacks. |
| `OPENAI_MODEL` | No | Defaults to `gpt-3.5-turbo`. |
| `PORT` | No | Defaults to `4000`. |
| `CORS_ORIGIN` | No | Comma-separated allowed origins. Defaults to `http://localhost:3000`. |

Frontend (build time):

| Variable | Description |
| --- | --- |
| `REACT_APP_API_URL` | Backend base URL. Defaults to `http://localhost:4000`. |

### Creating the first admin

Register normally, then change the role in the database:

```bash
cd backend/express
npx prisma studio        # open the User table and set role to "admin"
```

Admins can then promote other users to `counselor` or `admin` through `PUT /api/users/:id`.

### Deployment

The root `Procfile` starts the Express app (`prisma migrate deploy`, then `node index.js`). The database is a local SQLite file, so use a platform with a persistent disk, or move to a hosted database, before deploying.

## Project structure

```
SereneSpace/
├── Procfile
├── backend/
│   ├── express/
│   │   ├── index.js              # Express API (routes, auth, chatbot)
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Data model
│   │   │   └── migrations/
│   │   ├── .env.example
│   │   └── package.json
│   ├── server.py, db.py          # Legacy Flask prototype (unused)
│   └── requirements.txt          # Legacy prototype dependencies
└── frontend/
    ├── public/
    └── src/
        ├── App.js                # Router, navbar, home page
        ├── config.js             # API base URL
        ├── Chatbot.js            # /chat
        ├── PeerHub.js            # /peerhub
        ├── Appointments.js       # /appointments
        ├── Resources.js          # /resources
        ├── AdminDashboard.js     # /admin
        ├── EmergencySupport.js   # Crisis helplines
        ├── Login.js, Register.js
        └── index.js
```

The Python files under `backend/` are an early prototype that nothing in the app uses.

## API reference

All routes are under `/api`. "Auth" means an `Authorization: Bearer <token>` header, with the token from `POST /api/login`.

### Authentication and users

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create a `user` account (password of 8+ characters) |
| POST | `/login` | Public | Returns a JWT and the user's own profile |
| GET | `/profile` | Auth | Current user |
| GET | `/users` | Auth | All users (public info; full details for admins) |
| GET | `/users/:id` | Auth | One user, filtered by the privacy rules above |
| PUT | `/users/:id` | Self or admin | Update profile; only admins can change `role` |
| DELETE | `/users/:id` | Self or admin | Delete a user |
| GET | `/admin/users` | Admin | Full user list |

### Chatbot

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/chatbot/emotion` | Optional auth | Emotion detection and reply. Body: `{ message, sessionId? }`. A `sessionId` is honored only if the caller owns that session. |
| POST | `/chatbot` | Optional auth | Older rule-based bot |

### Peer Hub

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/posts` | Public | Posts with comments (flagged posts hidden) |
| GET | `/posts/:id` | Public | One post with comments |
| POST | `/posts` | Auth | Create a post |
| PUT / DELETE | `/posts/:id` | Owner or admin | Edit / delete |
| POST | `/posts/:id/like` | Auth | Like, or unlike if already liked |
| POST | `/posts/:id/flag` | Auth | Flag for review (not your own post) |
| POST | `/posts/:id/comments` | Auth | Add a comment |
| PUT / DELETE | `/comments/:id` | Owner or admin | Edit / soft-delete |
| POST | `/comments/:id/like` | Auth | Like, or unlike if already liked |
| POST | `/comments/:id/flag` | Auth | Flag (once per user, not your own) |

### Moderation and analytics

| Method | Route | Access |
| --- | --- | --- |
| GET | `/posts/flagged`, `/comments/flagged` | Admin, counselor |
| GET | `/moderation/flagged-comments` | Admin, counselor |
| POST | `/moderation/comments/:id/hide`, `/moderation/comments/:id/unhide` | Admin, counselor |
| PATCH | `/posts/:id/unflag`, `/comments/:id/unflag` | Admin |
| DELETE | `/moderation/comments/:id/flags` | Admin |
| GET | `/analytics` | Admin |

### Appointments

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/appointments` | Auth | Book. Body: `{ counselorId, scheduledAt }`; the counselor must have the `counselor` role and the time must be in the future |
| GET | `/appointments` | Auth | Admins see all; counselors see ones they are part of; users see their own |
| GET | `/appointments/:id` | Participants, admin | One appointment |
| GET | `/appointments/counselor/:counselorId` | Counselor (own), admin | A counselor's appointments |
| PUT | `/appointments/:id` | Participants, admin | Status is `pending`, `confirmed`, `completed` or `cancelled`. Patients can only cancel; only admins can reassign the counselor. |
| DELETE | `/appointments/:id` | Owner, admin | Delete |

### Resources

| Method | Route | Access |
| --- | --- | --- |
| GET | `/resources` | Public |
| POST / PUT / DELETE | `/resources`, `/resources/:id` | Admin |

## Security notes

- `JWT_SECRET` is required; there is no default.
- Passwords are hashed with bcrypt. Login and register are rate limited (20 requests per 15 minutes), and the chatbot to 20 requests per minute.
- Responses use `helmet` headers, a CORS allow-list and a 100 KB JSON body limit.
- Error responses do not include internal error messages.
- Tokens are stored in `localStorage`, so an XSS bug would expose them. The frontend relies on React's escaping and does not inject raw HTML.
- Chat transcripts are stored in plaintext in the database. Treat the database file as sensitive and do not commit it (`*.db` is gitignored).

## Known limitations

- A single flag hides a post for everyone until an admin unflags it; posts have no per-user flag tracking.
- The Prisma datasource is fixed to `file:./dev.db` and ignores `DATABASE_URL`.
- The whole API lives in one file (`backend/express/index.js`).
- There are no automated tests yet.

## Crisis helplines (India)

| Service | Contact |
| --- | --- |
| AASRA | +91 9820466726 (24x7) |
| Vandrevala Foundation | 1860 2662 345 / 1800 2333 330 |
| iCall | +91 9152987821 |
| NIMHANS | 080-46110007 |
| Emergency | 112 |
