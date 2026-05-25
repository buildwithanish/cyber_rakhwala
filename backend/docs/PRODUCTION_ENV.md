# Production Environment Templates

Use this file as a safe template reference only. Replace every placeholder before deploying.

## Backend `.env` for Render or VPS

```env
NODE_ENV=production
PORT=5000
APP_NAME=Cyber Rakhwala API
APP_URL=https://api.yourdomain.com
OPENAPI_SERVER_URL=https://api.yourdomain.com
FRONTEND_URL=https://your-frontend.vercel.app
DNS_SERVERS=1.1.1.1,8.8.8.8
DEBUG_PANEL_ENABLED=false

MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@your-cluster.mongodb.net/cyberrakhwala?retryWrites=true&w=majority

JWT_ACCESS_SECRET=replace-with-a-long-random-production-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-production-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
JWT_ISSUER=cyber-rakhwala
JWT_AUDIENCE=cyber-rakhwala-web

COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=none

ADMIN_PANEL_PATH=deepaklogin
ADMIN_ALLOW_LEGACY_ROUTE=false

ENABLE_DEMO_AUTH=false
DEMO_PASSWORD=change-me-and-do-not-use-in-production
SEED_DEMO_USERS=false

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME=Cyber Rakhwala
EMAIL_FROM_ADDRESS=no-reply@yourdomain.com

UPLOAD_STORAGE=cloudinary
UPLOAD_LOCAL_PATH=./src/uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_BASIC=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

RECAPTCHA_SECRET_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=

DEFAULT_CURRENCY=INR
TRIAL_DAYS=7

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
SEARCH_RATE_LIMIT_MAX=60

FEATURE_ENABLE_CHATBOT=true
FEATURE_ENABLE_DATASET_SEARCH=true
FEATURE_ENABLE_PROVIDER_CONNECTORS=true
FEATURE_ENABLE_THREAT_SIMULATOR=true

LOG_LEVEL=info
```

## Frontend `.env` for Vercel

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
VITE_ADMIN_LOGIN_PATH=deepaklogin
VITE_ADMIN_API_PATH=deepaklogin
VITE_ENABLE_DEMO_AUTH=false
```

## Five Provider Records for `Admin > Providers`

These are example records. Adjust `toolIds`, `method`, and endpoint paths to match the exact action you want to call first.

### 1. Abstract Phone Validation

```json
{
  "name": "Abstract Phone Validation",
  "slug": "abstract-phone",
  "type": "http",
  "toolIds": ["phone-lookup"],
  "baseUrl": "https://phonevalidation.abstractapi.com/v1/",
  "authType": "none",
  "secretRef": "",
  "headers": {
    "Accept": "application/json"
  },
  "queryTemplate": {
    "api_key": "{{secret}}",
    "phone": "{{query}}"
  },
  "bodyTemplate": {},
  "method": "GET",
  "enabled": true,
  "priority": 10,
  "metadata": {
    "providerKind": "phone"
  }
}
```

### 2. Have I Been Pwned

```json
{
  "name": "Have I Been Pwned",
  "slug": "hibp",
  "type": "http",
  "toolIds": ["breach-database", "email-forensics"],
  "baseUrl": "https://haveibeenpwned.com/api/v3/breachedaccount/{{query}}",
  "authType": "none",
  "secretRef": "",
  "headers": {
    "Accept": "application/json",
    "hibp-api-key": "{{secret}}",
    "user-agent": "Cyber-Rakhwala"
  },
  "queryTemplate": {
    "truncateResponse": "false"
  },
  "bodyTemplate": {},
  "method": "GET",
  "enabled": true,
  "priority": 10,
  "metadata": {
    "providerKind": "breach"
  }
}
```

### 3. IPinfo

```json
{
  "name": "IPinfo",
  "slug": "ipinfo",
  "type": "http",
  "toolIds": ["ip-intelligence", "geolocation"],
  "baseUrl": "https://ipinfo.io/{{query}}/json",
  "authType": "none",
  "secretRef": "",
  "headers": {
    "Accept": "application/json"
  },
  "queryTemplate": {
    "token": "{{secret}}"
  },
  "bodyTemplate": {},
  "method": "GET",
  "enabled": true,
  "priority": 10,
  "metadata": {
    "providerKind": "ip"
  }
}
```

### 4. SecurityTrails

```json
{
  "name": "SecurityTrails",
  "slug": "securitytrails",
  "type": "http",
  "toolIds": ["domain-analysis", "dns-records"],
  "baseUrl": "https://api.securitytrails.com/v1/domain/{{query}}",
  "authType": "api_key_header",
  "secretRef": "paste-live-key-here",
  "headers": {
    "Accept": "application/json"
  },
  "queryTemplate": {},
  "bodyTemplate": {},
  "method": "GET",
  "enabled": true,
  "priority": 10,
  "metadata": {
    "providerKind": "domain"
  }
}
```

### 5. VirusTotal

```json
{
  "name": "VirusTotal",
  "slug": "virustotal",
  "type": "http",
  "toolIds": ["url-scanner", "domain-analysis"],
  "baseUrl": "https://www.virustotal.com/api/v3/urls",
  "authType": "bearer",
  "secretRef": "paste-live-token-here",
  "headers": {
    "Accept": "application/json"
  },
  "queryTemplate": {},
  "bodyTemplate": {
    "url": "{{query}}"
  },
  "method": "POST",
  "enabled": true,
  "priority": 20,
  "metadata": {
    "providerKind": "threat"
  }
}
```

## Final Production Reminder

- Rotate any leaked or pasted secrets before deploy
- Change the seeded admin password
- Test one provider at a time from the hidden admin route
