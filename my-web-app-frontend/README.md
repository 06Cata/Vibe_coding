# my-web-app-frontend

Next.js frontend for the split architecture.

## Environment variables

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_BACKEND_API_BASE_URL=http://localhost:3001
BACKEND_API_BASE_URL=http://localhost:3001
```

## Local development

```bash
npm install
npm run dev
```

## Current migration scope

- `stock` is connected to backend API
- `weather`, `food`, `qrcode`, and `quiz` remain to be migrated
