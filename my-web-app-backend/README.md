# my-web-app-backend

NestJS backend for the split architecture.

## Endpoints

- `GET /health`
- `GET /api/stocks/dashboard?days=60`
- `GET /api/weather/forecast?lat=25.04&lng=121.53`
- `POST /internal/jobs/stocks-sync`

## Environment variables

Create `.env` from `.env.example`:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INTERNAL_CRON_TOKEN=replace-me
```

## Local development

```bash
npm install
npm run start:dev
```

## Cron trigger

GitHub Actions workflow:

- `/.github/workflows/sync-stock-backend.yml`

Required GitHub secrets:

- `BACKEND_SYNC_URL`
- `INTERNAL_CRON_TOKEN`
