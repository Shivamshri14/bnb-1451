# Deployment Guide — Og Stays (1451)

Live URL: **https://1451.edugeniushub.com**  
Host: **Hostinger** (Node.js)  
Stack: **Next.js 15 (App Router) + MongoDB Atlas + Auth.js (next-auth v5)**

This app is already complete. This guide only covers going live.

---

## 1. How to deploy on Hostinger

### Option A — Hostinger Node.js App (recommended)

1. Log in to **hPanel** → **Websites** → select `edugeniushub.com` (or create/use Node.js hosting).
2. Open **Node.js** / **Web Apps** (wording varies by plan) → **Create application**.
3. Settings:
   - **Node.js version:** `20.x` (or `22.x` if offered; minimum Node 20)
   - **Application root:** folder where you upload this project (contains `package.json`)
   - **Application URL / domain:** `1451.edugeniushub.com`
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. Upload the project (Git clone or ZIP via File Manager). Do **not** upload `.env.local` or `node_modules`.
5. In Hostinger **Environment Variables**, add every variable from `.env.example` with real production values (see section 2).
6. Install & build (Hostinger may run this automatically, or use SSH / “Rebuild”):
   ```bash
   npm install
   npm run build
   npm start
   ```
7. Ensure the app is **Running**, then open https://1451.edugeniushub.com/login

### Option B — Git deploy (if enabled)

1. Push this repo to GitHub/GitLab (without secrets).
2. Connect the repo in Hostinger Node.js app.
3. Set build/start commands and env vars as above.
4. Deploy / rebuild after each push.

### Local production smoke test (before upload)

```bash
npm install
npm run build
# Set production-like env in .env.local first
npm start
```

Open http://localhost:3000

---

## 2. Required environment variables

Set these in Hostinger (never commit real values). Template: `.env.example`

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `https://1451.edugeniushub.com` |
| `AUTH_TRUST_HOST` | Yes | `true` (needed behind Hostinger proxy) |
| `MONGODB_URI` | Yes | Atlas `mongodb+srv://...` connection string |
| `ADMIN_USERNAME` | Optional | Seed admin username if DB has no users |
| `ADMIN_PASSWORD` | Optional | Seed admin password (change after first login) |

Notes:

- This app uses **Auth.js v5** (`AUTH_SECRET`). `JWT_SECRET` is **not** used.
- `NEXTAUTH_SECRET` is optional if `AUTH_SECRET` is set.
- Do not point production at `mongodb://127.0.0.1` — use **MongoDB Atlas**.

---

## 3. MongoDB Atlas configuration

1. [MongoDB Atlas](https://cloud.mongodb.com/) → your cluster → **Connect** → Drivers → copy URI.
2. Database user: strong password; escape special characters in the URI if needed.
3. **Network Access** → add:
   - Hostinger app outbound IPs if known, **or**
   - Temporarily `0.0.0.0/0` for testing (tighten later).
4. Use a clear DB name in the URI (e.g. `/bnb`).
5. Paste URI into Hostinger as `MONGODB_URI`.

Connection caching is already implemented in `lib/db.ts` (global mongoose cache). No code change required for Atlas.

---

## 4. Build command

```bash
npm run build
```

---

## 5. Start command

```bash
npm start
```

(`next start` — uses `PORT` from the host if Hostinger sets it.)

---

## 6. DNS setup for `1451.edugeniushub.com`

In Hostinger DNS for **edugeniushub.com**:

| Type | Name | Value | TTL |
|------|------|--------|-----|
| **A** | `1451` | Hostinger Node/VPS IP shown in hPanel | Auto / 300 |
| or **CNAME** | `1451` | Hostname Hostinger shows for the Node app | Auto |

Then:

1. Attach subdomain **1451.edugeniushub.com** to the Node.js application in hPanel.
2. Enable **SSL** (Let’s Encrypt) for that subdomain.
3. Set `NEXTAUTH_URL=https://1451.edugeniushub.com` (HTTPS, no trailing slash).
4. Wait for DNS propagation (often minutes; can take up to 24–48h).

No OAuth / Google login in this project — only credentials. No extra OAuth callback URLs to register.

---

## 7. Common errors and fixes

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Build OK, site 500 / blank | Missing env vars | Set `AUTH_SECRET`, `MONGODB_URI`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST` |
| Login loops / CSRF / host errors | Wrong URL or untrusted host | `NEXTAUTH_URL=https://1451.edugeniushub.com` and `AUTH_TRUST_HOST=true` |
| DB / Mongo errors | Atlas network or bad URI | Whitelist Hostinger IP (or `0.0.0.0/0` for test); check user/password encoding |
| `ECONNREFUSED 127.0.0.1:27017` | Still using local Mongo fallback | Set real Atlas `MONGODB_URI` in Hostinger |
| Wrong Node version | Node &lt; 18/20 | Select **Node 20** in Hostinger |
| Port / app not reachable | Wrong start or SSL not bound | Use `npm start`; ensure subdomain points to the Node app + SSL on |
| Upload size huge | Uploaded `node_modules` / `.next` | Upload source only; run `npm install` + `npm run build` on server |
| Seed admin not created | Users already exist | Create account via `/signup` or set admin in Atlas |

---

## Hostinger quick reference

| Item | Value |
|------|--------|
| **Node version** | `20.x` (engines: `>=20`) |
| **Build command** | `npm run build` |
| **Start command** | `npm start` |
| **Package manager** | npm (`package-lock.json`) |
| **Production URL** | `https://1451.edugeniushub.com` |

---

## Security checklist

- [ ] `.env.local` / Hostinger secrets never committed
- [ ] `.gitignore` ignores `.env*` but allows `.env.example`
- [ ] Strong unique `AUTH_SECRET` in production
- [ ] Strong Atlas password; Network Access restricted when possible
- [ ] Change default seed `ADMIN_PASSWORD` after first deploy
- [ ] SSL enabled on `1451.edugeniushub.com`
