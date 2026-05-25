# Cyber Rakhwala Backend

Production-ready Express/Mongo backend generated to match the existing Vite + React frontend.

## What Is Included

- JWT access tokens with rotating refresh tokens
- Role-aware auth for `student`, `user`, `admin`, `super_admin`
- Cases, evidence, search logs, notifications, activity logs
- Tool orchestration layer for `/tools/*` and `/osint/*`
- Billing with plans, coupons, subscriptions, invoices, Stripe/Razorpay flows
- Admin APIs for users, plans, payments, providers, datasets, content, settings, feature toggles, analytics
- Threat-map APIs, sockets, seed data, and simulator jobs
- Upload endpoints and dataset import pipeline

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

API base URL:

```text
http://localhost:5000/api
```

Local frontend URL:

```text
http://localhost:3000
```

Docs UI:

```text
http://localhost:5000/docs
```

Health check:

```text
http://localhost:5000/health
```

## Default Seed Accounts

- `admin@cyberrakhwala.com` / value of `DEMO_PASSWORD`
- `demo@cyberrakhwala.com` / value of `DEMO_PASSWORD`
- `student@cyberrakhwala.com` / value of `DEMO_PASSWORD`

Admin accounts must use the hidden admin entry path configured through `ADMIN_PANEL_PATH`.

Before any live deploy:

- rotate MongoDB credentials if they were ever pasted in plain text
- rotate JWT secrets
- change any seeded demo/admin passwords

## Core Route Groups

- `/api/auth`
- `/api/cases`
- `/api/evidence`
- `/api/account`
- `/api/<ADMIN_PANEL_PATH>/auth/login`
- `/api/<ADMIN_PANEL_PATH>`
- `/api/plans`
- `/api/payments/*`
- `/api/redeem/validate`
- `/api/tools/*`
- `/api/osint/*`
- `/api/threat-map/*`
- `/api/contact`
- `/api/feedback`
- `/api/chatbot/*`
- `/api/uploads/*`

## Key Commands

```bash
npm run dev
npm run start
npm run seed
```

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   ├── validators/
│   └── app.js
├── docs/
├── deploy/
├── server.js
└── package.json
```

## Additional Documentation

- [API Reference](./docs/API_REFERENCE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Production Env Templates](./docs/PRODUCTION_ENV.md)
- [Provider Setup Guide](./docs/PROVIDER_SETUP.md)
- [Postman Collection](./docs/postman_collection.json)
