# Provider Setup Guide

This platform uses a database-driven provider engine. For most tools, the production workflow is:

1. Keep the backend-level application secrets in `backend/.env`
2. Log in to the hidden admin panel
3. Open `Providers`
4. Create or update a provider record
5. Assign that provider to one or more tools
6. Enable the provider only after the key works

This avoids redeploying every time a provider key changes.

## Important Security Rule

- Do not commit live provider keys
- Do not leave real secrets in chat history
- Rotate any key or database password that was pasted in plain text before going live

## Admin Fields

The current provider model supports:

- `name`
- `slug`
- `type`
- `toolIds`
- `baseUrl`
- `authType`
- `secretRef`
- `headers`
- `queryTemplate`
- `bodyTemplate`
- `method`
- `enabled`
- `priority`
- `metadata`

## Recommended Mapping

- `slug`: short lowercase identifier like `ipinfo` or `virustotal`
- `type`: usually `http`
- `toolIds`: tool keys such as `phone-lookup`, `domain-analysis`, `ip-intelligence`
- `baseUrl`: official provider API base or direct endpoint
- `authType`: `bearer`, `api_key_header`, `query`, or `none`
- `secretRef`: the live key/token currently stored in the provider record
- `headers`: static headers as JSON
- `queryTemplate`: query params as JSON with placeholders like `{{query}}`
- `bodyTemplate`: request body as JSON with placeholders like `{{query}}`
- `priority`: lower number = higher priority

## Suggested Templates

### Bearer Token Provider

```json
{
  "name": "VirusTotal",
  "slug": "virustotal",
  "type": "http",
  "toolIds": ["domain-analysis", "url-scanner"],
  "baseUrl": "https://www.virustotal.com/api/v3/domains/{{query}}",
  "authType": "bearer",
  "secretRef": "paste-live-token-here",
  "headers": {
    "Accept": "application/json"
  },
  "queryTemplate": {},
  "bodyTemplate": {},
  "method": "GET",
  "enabled": true,
  "priority": 10,
  "metadata": {
    "source": "manual-admin-config"
  }
}
```

### API Key Header Provider

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
  "priority": 20,
  "metadata": {
    "source": "manual-admin-config"
  }
}
```

## Provider Links

Use only lawful, licensed, or user-authorized sources.

### Phone Intelligence

- Abstract Phone Validation API: [https://www.abstractapi.com/phone-validation-api](https://www.abstractapi.com/phone-validation-api)
- Twilio Lookup: [https://www.twilio.com/lookup](https://www.twilio.com/lookup)

### Breach Notification / Email Risk

- Have I Been Pwned API key: [https://haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)
- EmailRep: [https://emailrep.io/](https://emailrep.io/)
- Hunter API: [https://hunter.io/api](https://hunter.io/api)

### Domain / DNS / Threat

- SecurityTrails API docs: [https://docs.securitytrails.com/](https://docs.securitytrails.com/)
- VirusTotal API overview: [https://docs.virustotal.com/reference/overview](https://docs.virustotal.com/reference/overview)
- Shodan developer API: [https://developer.shodan.io/](https://developer.shodan.io/)
- Cloudflare API tokens: [https://developers.cloudflare.com/fundamentals/api/get-started/create-token/](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

### IP / Network Intelligence

- IPinfo developers: [https://ipinfo.io/developers](https://ipinfo.io/developers)
- AbuseIPDB API docs: [https://docs.abuseipdb.com/](https://docs.abuseipdb.com/)

### Maps / Geolocation

- Mapbox access tokens: [https://docs.mapbox.com/help/getting-started/access-tokens/](https://docs.mapbox.com/help/getting-started/access-tokens/)

### Billing

- Stripe API keys: [https://docs.stripe.com/keys](https://docs.stripe.com/keys)
- Razorpay API keys: [https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/)

## Deployment Notes

- For today's deploy, keep the backend core secrets in `.env`
- Add provider records from `Admin > Providers`
- Add plans from `Admin > Plans`
- If payment keys are not ready, grant credits or subscriptions manually from the admin panel until the gateway is enabled
