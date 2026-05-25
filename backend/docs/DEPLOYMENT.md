# Deployment Guide

## 1. Environment

Required production values:

- `NODE_ENV=production`
- `PORT`
- `APP_URL`
- `FRONTEND_URL`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none` when frontend is on another origin
- Stripe and/or Razorpay credentials if billing is live
- SMTP credentials for verification/reset emails
- `ADMIN_PANEL_PATH` for the hidden admin route, for example `deepaklogin`

Before going live:

- rotate any MongoDB password or JWT secret that was exposed during testing
- change the seeded admin password
- remove demo-only values

## 2. MongoDB Atlas

1. Create a cluster in MongoDB Atlas.
2. Create a database user and allow network access.
3. Copy the connection string into `MONGODB_URI`.
4. Run `npm run seed` once against the production database only if you want seed plans/demo content.
5. If you pasted Atlas credentials in a chat or screenshot, rotate them before deployment.

## 3. Docker

```bash
docker build -t cyber-rakhwala-backend .
docker run --env-file .env -p 5000:5000 cyber-rakhwala-backend
```

For local Docker with Mongo:

```bash
docker compose up --build
```

## 4. PM2

```bash
npm install
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5. Nginx Reverse Proxy

Use the sample config in `deploy/nginx.conf`.

Important points:

- proxy `/` or `/api` to the Node process
- enable websocket upgrade headers for Socket.IO
- terminate SSL at Nginx
- forward `X-Forwarded-*` headers

## 6. Render

1. Create a new Web Service.
2. Point Render at the `backend` directory as the service root.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`.
6. Set the health check path to `/health`.

Recommended Render values:

- `NODE_ENV=production`
- `APP_URL=https://your-backend.onrender.com`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `OPENAPI_SERVER_URL=https://your-backend.onrender.com`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`
- `ADMIN_PANEL_PATH=deepaklogin`

Provider setup after deploy:

1. Sign in through the hidden admin route
2. Open `Providers`
3. Add the provider base URL, auth type, secret, and tool assignments
4. Enable each provider only after a real health test

Reference: [Provider Setup Guide](./PROVIDER_SETUP.md)

Optional config file: `render.yaml`.

## 7. Railway

1. Create a Railway service rooted at `backend`.
2. Set environment variables from `.env.example`.
3. Use `npm install` and `npm start`.
4. Add MongoDB or point to Atlas.

Optional config file: `railway.json`.

## 8. VPS

Recommended stack:

- Ubuntu 22.04+
- Node 20
- PM2
- Nginx
- MongoDB Atlas or dedicated Mongo server

Typical flow:

```bash
git clone <repo>
cd <repo>/backend
npm install
cp .env.example .env
pm2 start ecosystem.config.cjs
```

After that:

1. Set all production env values in `backend/.env`
2. Run the seed only if you want default plans/tools/content:

```bash
npm run seed
```

3. Put Nginx in front of the backend
4. Point your frontend domain or subdomain to the frontend build or Vercel app
5. Attach SSL with Certbot

For a split deployment:

- Frontend on Vercel: `https://your-frontend.vercel.app`
- Backend on VPS: `https://api.yourdomain.com`
- Set frontend `VITE_API_URL=https://api.yourdomain.com/api`
- Set backend `FRONTEND_URL=https://your-frontend.vercel.app`
- Keep `COOKIE_SECURE=true`
- If frontend and backend stay on different subdomains, keep `COOKIE_SAME_SITE=none`
- If you later move both frontend and backend under the same root domain, you can revisit cookie settings

## 9. SSL

Use Let’s Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

After SSL:

- keep `COOKIE_SECURE=true`
- set `APP_URL=https://api.example.com`
- ensure frontend uses `https://api.example.com/api`

## 10. Webhooks

Stripe:

- URL: `https://api.example.com/api/payments/webhooks/stripe`
- subscribe to at least `checkout.session.completed`

Razorpay:

- URL: `https://api.example.com/api/payments/webhooks/razorpay`
- use the same `RAZORPAY_WEBHOOK_SECRET` configured in the backend

## 11. Post-Deploy Checks

- `GET /health`
- `POST /api/auth/login`
- `POST /api/<ADMIN_PANEL_PATH>/auth/login`
- `GET /api/plans`
- `POST /api/payments/create-order`
- `GET /api/account/dashboard`
- websocket connection for threat-map events
- verify at least one enabled provider from `Admin > Providers`
