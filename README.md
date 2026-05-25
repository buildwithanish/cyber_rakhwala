<<<<<<< HEAD
# Cyber Rakhwala Full Stack

This repository is now organized as a production-style full-stack workspace:

```text
root-project/
├── frontend/
├── backend/
├── docker/
├── nginx/
└── README.md
```

## Local Development

1. Install dependencies:

```bash
npm run install:all
```

2. Create environment files:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

If you are on macOS/Linux, you can use:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. Start MongoDB locally or point `backend/.env` at MongoDB Atlas.

4. Update the important values in `backend/.env`:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL=http://localhost:3000`
- `ADMIN_PANEL_PATH=deepaklogin`

5. Run the backend:

```bash
npm run dev:backend
```

6. Run the frontend:

```bash
npm run dev:frontend
```

7. Optional: seed demo data once the backend can connect to MongoDB:

```bash
npm run seed:backend
```

Frontend default URL: `http://localhost:3000`

Backend default URL: `http://localhost:5000`

API base URL: `http://localhost:5000/api`

Health check: `http://localhost:5000/health`

API docs: `http://localhost:5000/docs`

## Hidden Admin Access

- Frontend admin login route: `/${VITE_ADMIN_LOGIN_PATH}`
- Backend admin API base: `/api/${ADMIN_PANEL_PATH}`
- Default secret path: `deepaklogin`
- Public `/api/admin` is disabled by default. Set `ADMIN_ALLOW_LEGACY_ROUTE=true` only if you intentionally need the old path.

## Deployment Assets

- Docker images: [docker/frontend.Dockerfile](./docker/frontend.Dockerfile) and [docker/backend.Dockerfile](./docker/backend.Dockerfile)
- Compose stack: [docker-compose.yml](./docker-compose.yml)
- Nginx reverse proxy: [nginx/production.conf](./nginx/production.conf)
- Backend deployment docs: [backend/docs/DEPLOYMENT.md](./backend/docs/DEPLOYMENT.md)
- Production env templates: [backend/docs/PRODUCTION_ENV.md](./backend/docs/PRODUCTION_ENV.md)
- Provider setup docs: [backend/docs/PROVIDER_SETUP.md](./backend/docs/PROVIDER_SETUP.md)
- Backend API reference: [backend/docs/API_REFERENCE.md](./backend/docs/API_REFERENCE.md)
- Postman collection: [backend/docs/postman_collection.json](./backend/docs/postman_collection.json)

## Runtime Notes

- `frontend` now talks to the backend through `VITE_API_URL`.
- Investigation tools activate dynamically from backend tool catalog, provider configs, datasets, and admin-managed API credentials.
- Contact, feedback, chatbot, cases, evidence, payments, sessions, and search history flows are wired to backend APIs.

## Security Reminder

- Rotate any MongoDB password, JWT secret, or admin password that was pasted into a chat, screenshot, or shared note before going live.
=======
# cyber_rakhwala
>>>>>>> 0f1aba1f4905bef8e324019c3f5bb568ae4bb0da
