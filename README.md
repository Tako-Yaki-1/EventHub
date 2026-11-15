# EventHub

Campus event registration system: a Laravel JSON API (`backend/`) and a React + Vite app (`frontend/`). Students browse and register for events, cancel registrations, manage their profile, see in-app notifications, and ask an AI assistant about upcoming events; admins create and cancel events, see attendee lists, read an analytics dashboard with an AI summary, manage users and sessions, and inspect an append-only audit log.

## What you need

- PHP 8.2+ and Composer (XAMPP's `C:\xampp\php` works)
- Node.js 20+ and npm
- MySQL 8 (XAMPP or Laragon) — or SQLite for a quick local run
- No helper scripts: run the commands below in two terminals.

`vendor/` and `node_modules/` are **not** included in the repository. Run `composer install` (in `backend`) and `npm install` (in `frontend`) once before the first start.

The commands below are PowerShell. On macOS or Linux, use `cp .env.example .env` instead of `Copy-Item`, and export variables with `export NAME=value` instead of `$env:NAME='value'`; everything else is the same.

## Setup, in order

### 1. Start MySQL

Start **MySQL** in the XAMPP Control Panel (or your own MySQL service). Apache is not needed for development.

### 2. Backend

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

`backend\.env` already matches a default XAMPP MySQL install. Change these keys only if yours differs:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eventhub
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:5173
TOKEN_TTL_MINUTES=480
```

### AI provider (optional)

The AI features work without a key: they fall back to event search and a rule-based summary. To use a real model, put your own key and model in `backend\.env` (never commit them):

```ini
AI_DRIVER=openai
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=your-key-here
AI_MODEL=openai/gpt-4o-mini
AI_TIMEOUT_SECONDS=15
AI_MAX_OUTPUT_TOKENS=500
AI_LOG_PROMPTS=false
```

`openai` means any OpenAI-compatible endpoint: OpenRouter (default), Groq, Gemini's compatibility endpoint, or a local Ollama server. Use `AI_DRIVER=anthropic` for `api.anthropic.com`. Admins can switch features on or off and set the daily token budget on `/admin/ai`; the key is never sent to the browser.

Create the database (XAMPP: open phpMyAdmin, or run `mysql -u root -e "CREATE DATABASE eventhub"`), then:

```powershell
php artisan migrate --seed
php artisan serve
```

The API is at `http://localhost:8000/api/v1`; `GET http://localhost:8000/up` should return the health page.

### 3. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The API URL comes from `VITE_API_URL` in `frontend\.env` (default `http://localhost:8000/api/v1`). Vite only reads it at startup, so restart `npm run dev` after changing it.

### 4. Open the app

Open `http://localhost:5173` and log in with one of the demo accounts below.

## Demo accounts
| Role | Login | Password |
|---|---|---|
| Admin | `admin@eventhub.test` | `password` |
| Student | `jan.nino@school.edu` or `2023-00123` | `password` |

Seeded data is relative to the day you seed: three named events plus several upcoming and past events, about 60 students, and registrations/cancellations spread over 30 days.

## Security and AI

- [`docs/SECURITY.md`](docs/SECURITY.md) maps every control — CIA triad, accountability/audit log, tokens, admin role matrix, AI risks — to the code and the test that proves it.
- New admin pages: `/admin/ai` (AI switches, per-user daily token budget, usage charts), `/admin/audit` (filterable append-only log with "Verify log"), and `/admin/users` (active sessions and force logout).
- Students get `/assistant` ("Ask AI"); admins get an "AI summary" card on the analytics dashboard.
- Login tokens expire after `TOKEN_TTL_MINUTES` and can be revoked from the profile page. The token lives in `localStorage` — see known limits in `docs/SECURITY.md`.
- AI answers are plainly labelled "AI-generated", rendered as text, and fall back to event search / rule-based insights when AI is off, unconfigured, or failing.

## Running it with XAMPP

XAMPP supplies the PHP and MySQL this project needs; Apache is optional.

**Easiest — XAMPP for MySQL only (recommended).** Start **MySQL** in the XAMPP Control Panel, then run `php artisan serve` and `npm run dev` as above. On a normal XAMPP install, `php` on PATH is `C:\xampp\php\php.exe`, so the API already runs on XAMPP's PHP.

**Apache instead of both terminals.** Apache can host the finished app, but it cannot replace the Vite dev server (`npm run dev` is Node). Build the frontend once and serve the static files:

1. Point `frontend\.env` at the API and rebuild:

   ```powershell
   cd frontend
   'VITE_API_URL=http://eventhub.local/api/v1' | Set-Content .env
   npm run build
   ```

2. Add two vhosts to `C:\xampp\apache\conf\extra\httpd-vhosts.conf`, and make sure `Include conf/extra/httpd-vhosts.conf` is uncommented in `C:\xampp\apache\conf\httpd.conf`:

   ```apache
   <VirtualHost *:80>
       ServerName eventhub.local
       DocumentRoot "C:/path/to/EventHub/backend/public"
       <Directory "C:/path/to/EventHub/backend/public">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>

   <VirtualHost *:80>
       ServerName eventhub.test
       DocumentRoot "C:/path/to/EventHub/frontend/dist"
       <Directory "C:/path/to/EventHub/frontend/dist">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

   The document root must be `backend/public`, never `backend`, or `.env` becomes downloadable.

3. Add both names to your hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows, `/etc/hosts` elsewhere; needs admin), then set `FRONTEND_URL=http://eventhub.test` in `backend\.env` — CORS only allows that one origin:

   ```
   127.0.0.1 eventhub.local
   127.0.0.1 eventhub.test
   ```

4. Create `frontend\dist\.htaccess` so React Router's URLs do not 404 on refresh:

   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
   </IfModule>
   ```

5. Start **Apache** and **MySQL** in the XAMPP Control Panel and open `http://eventhub.test`.

## SQLite instead of MySQL

`phpunit.xml` already uses in-memory SQLite for tests. To run the app without MySQL in one PowerShell session:

```powershell
cd backend
New-Item database\database.sqlite -Force
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=(Resolve-Path database\database.sqlite)
php artisan migrate --seed
php artisan serve
```

## Password reset locally

`MAIL_MAILER=log`, so the reset email is written to `backend\storage\logs\laravel.log` instead of being sent. Submit the form on `/forgot-password`, then search the log for `reset-password?token=` and open that link.

## Tests and checks

Backend (uses in-memory SQLite, does not touch your dev database):

```powershell
cd backend
php artisan test
.\vendor\bin\pint --test
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

`npm test` runs Vitest once; `npm run dev`, `npm run build`, and `npm run preview` are the other scripts.

## Project layout

```
backend/app
  Actions/           registration + cancellation transactions
  Http/Controllers   thin JSON controllers
  Http/Requests      validation
  Http/Resources     response shapes
  Models/            User, Event, Registration, Notification, AuditLog, AiRequest, Setting
  Policies/          admin event actions, owner-only cancel
  Services/          analytics SQL aggregation, audit log, tokens, AI drivers/gateway
docs/SECURITY.md     security and AI design, controls, tests, known limits
frontend/src
  api/               one module per resource (all HTTP lives here)
  components/        shared UI kit and route guards
  features/          auth, home, events, registrations, profile, notifications, assistant, admin
  layouts/           student and admin shells
```

## Troubleshooting

- **CORS error in the browser console.** `FRONTEND_URL` in `backend\.env` must exactly match the address you open the app at (scheme, host, and port). It is the only allowed origin.
- **Blank page or every request fails.** The API is probably not running on port 8000, or `VITE_API_URL` in `frontend\.env` is wrong. Restart `npm run dev` after changing it.
- **`SQLSTATE[HY000] [2002]` when migrating.** MySQL is not running, or the port in `DB_PORT` is wrong.
- **`Unknown database 'eventhub'`.** Create the database first; `migrate` does not create it.
- **Port already in use.** Stop the other process, or run `php artisan serve --port=8001` (then update `VITE_API_URL`) and `npm run dev -- --port=5174` (then update `FRONTEND_URL`).
- **Reset email never arrives.** That is expected: mail is written to `backend\storage\logs\laravel.log`.
- **Changes to `backend\.env` have no effect.** Run `php artisan config:clear`.

## Notes and limits

- Dates are stored UTC and displayed in the browser's local timezone.
- Access tokens are kept in `localStorage` and sent as a Bearer header; an XSS bug on the site would expose them.
- AI is optional. Without `AI_API_KEY` and `AI_MODEL`, the assistant returns matching events and the analytics card returns a rule-based summary; both are labelled. Prompts are not stored unless `AI_LOG_PROMPTS=true`.
- The AI summary is cached for 10 minutes per data fingerprint and only when the model answered; a rule-based fallback is recomputed on every request.
- Notifications are database-only (no email or push).
- Only published events that have not started yet can be cancelled. The admin Events list hides the button for past events, and the API rejects the request with `422` ("Only upcoming events can be cancelled.") so the UI is not the only protection.
- My Registrations is ordered by the server: active registrations first by event date (soonest first), then cancelled ones (most recently cancelled first).
- The analytics bundle includes `recharts`; the production build is one ~800 kB chunk with an advisory size warning.
- The test suite runs on in-memory SQLite; the app itself was verified against MySQL 8 (XAMPP) as well, including migrations, seeding, registrations, and the analytics endpoints.
