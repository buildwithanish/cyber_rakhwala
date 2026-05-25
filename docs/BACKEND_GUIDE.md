# Backend Development Guide

This document helps backend developers implement the API for Cyber Rakhwala tools.

## Quick Start

1. Review [API Documentation](./API.md) for all endpoints
2. Use mock data from `frontend/src/mock-api/mockToolData.js` as reference
3. Implement endpoints in priority order (see below)
4. Test with frontend by disabling mock mode

## Implementation Priority

### Phase 1 - Core (Week 1)
1. **Authentication** - `/auth/*`
   - Register, login, token refresh
   - JWT with 24h expiry
   
2. **User Management** - `/users/*`
   - Profile, settings, credits

3. **IP Intelligence** - `/tools/ip/*`
   - Most frequently used tool
   - Simple external API integration (ipapi.co, ipinfo.io)

4. **Domain Analysis** - `/tools/domain/*`
   - WHOIS integration
   - DNS lookups

### Phase 2 - OSINT Tools (Week 2)
5. **Email Forensics** - `/tools/email/*`
6. **Phone Lookup** - `/tools/phone/*`
7. **URL Scanner** - `/tools/url/*`
8. **Hash Analyzer** - `/tools/hash/*`
9. **Breach Database** - `/tools/breach-database/*`

### Phase 3 - Advanced (Week 3)
10. **Social Profiler** - `/tools/social/*`
11. **DNS Records** - `/tools/dns/*`
12. **Geolocation** - `/tools/geolocation/*`
13. **Data Mining** - `/tools/data-mining/*`

### Phase 4 - Real-time (Week 4)
14. **Threat Map** - `/threat-map/*`
    - WebSocket for live updates
    - Static data initially, then live feeds

## Data Models

### User
```javascript
{
  id: UUID,
  name: String,
  email: String (unique, indexed),
  password: String (bcrypt hash),
  role: Enum['student', 'user', 'law'],
  credits: Number (default: 100),
  createdAt: DateTime,
  lastLogin: DateTime
}
```

### Credit Transaction
```javascript
{
  id: UUID,
  userId: UUID (foreign key),
  amount: Number (negative for deduction),
  tool: String,
  description: String,
  timestamp: DateTime
}
```

### Activity Log
```javascript
{
  id: UUID,
  userId: UUID,
  tool: String,
  action: String,
  input: JSON,
  result: JSON (optional),
  credits: Number,
  timestamp: DateTime,
  ip: String,
  userAgent: String
}
```

### Case (for law/user roles)
```javascript
{
  id: UUID,
  userId: UUID,
  title: String,
  description: Text,
  status: Enum['open', 'closed'],
  evidence: JSON[], // Array of evidence items
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## External APIs Needed

### Recommended Services
- **IP Intelligence**: ipinfo.io, ipapi.co (free tiers available)
- **WHOIS**: whois-api.com, whoisxmlapi.com
- **Breach Data**: haveibeenpwned.com API
- **Phone**: numverify.com, twilio lookups
- **Hash/Malware**: VirusTotal API (free tier)
- **Email Validation**: hunter.io, zerobounce
- **URL Scanning**: Google Safe Browsing API, urlscan.io
- **Geolocation**: opencagedata.com, positionstack.com

### API Key Management
Store in environment variables:
```env
IPINFO_API_KEY=
VIRUSTOTAL_API_KEY=
HIBP_API_KEY=
WHOIS_API_KEY=
PHONE_API_KEY=
```

## Rate Limiting

Implement per-user rate limits:

```javascript
// Redis-based rate limiter example
const rateLimiter = {
  student: { requests: 50, window: 3600 },  // 50/hour
  user: { requests: 200, window: 3600 },    // 200/hour
  law: { requests: 1000, window: 3600 }     // 1000/hour
}
```

## Credit System

### Tool Costs
```javascript
const toolCredits = {
  'ip-intelligence': 1,
  'domain-analysis': 2,
  'email-forensics': 2,
  'phone-lookup': 3,
  'url-scanner': 2,
  'hash-analyzer': 3,
  'breach-database': 1,
  'social-profiler': 5,
  'dns-records': 1,
  'geolocation': 1,
  'data-mining': 10,
  'image-exif': 2
}
```

### Enforcement
Before executing tool:
```javascript
async function executeTool(userId, tool, input) {
  const cost = toolCredits[tool];
  const user = await getUserCredits(userId);
  
  if (user.credits < cost) {
    throw new Error('Insufficient credits');
  }
  
  // Execute tool
  const result = await toolFunction(input);
  
  // Deduct credits
  await deductCredits(userId, cost, tool);
  
  // Log activity
  await logActivity(userId, tool, input, result, cost);
  
  return result;
}
```

## Error Handling

Return consistent error format:

```javascript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: 'INVALID_INPUT',
    message: 'IP address is invalid',
    details: { field: 'ip', value: 'invalid' }
  }
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient credits/permissions)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Database Schema

### PostgreSQL
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  credits INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  tool VARCHAR(100),
  description TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tool VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  input JSONB,
  result JSONB,
  credits INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
```

## WebSocket Implementation

For Threat Map real-time updates:

```javascript
// Server-side (Node.js + ws)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'STATS_UPDATE',
    payload: getGlobalStats()
  }));
  
  // Broadcast attacks every 2 seconds
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'ATTACK',
      payload: generateRandomAttack()
    }));
  }, 2000);
  
  ws.on('close', () => {
    clearInterval(interval);
  });
});
```

## Testing Checklist

For each endpoint:
- [ ] Input validation works
- [ ] Authentication required
- [ ] Credits deducted correctly
- [ ] Activity logged
- [ ] Rate limiting enforced
- [ ] Error handling consistent
- [ ] Response matches schema

## Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=<random-secret>
CORS_ORIGIN=https://app.cyberrakhwala.com
REDIS_URL=redis://...

# External API Keys
IPINFO_API_KEY=
VIRUSTOTAL_API_KEY=
...
```

### CORS Configuration
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

## Performance Tips

1. **Caching**: Cache external API responses (Redis, 1-24h TTL)
2. **Batch Processing**: Support batch endpoints for bulk lookups
3. **Async Workers**: Use job queue (Bull/BullMQ) for heavy tasks
4. **Database Indexing**: Index frequently queried fields
5. **Connection Pooling**: Use pg-pool for PostgreSQL

## Security Requirements

1. **Password Hashing**: bcrypt with 12 rounds
2. **JWT**: 24h expiry, RS256 algorithm
3. **Input Sanitization**: Validate/sanitize all inputs
4. **SQL Injection**: Use parameterized queries
5. **XSS Protection**: Helmet.js middleware
6. **HTTPS Only**: Force HTTPS in production
7. **API Key Rotation**: Rotate external API keys quarterly

## Monitoring

Log these metrics:
- Request rate per endpoint
- Error rate
- Response time (p50, p95, p99)
- Credit consumption rate
- External API failures

## Support

Frontend team contact: 
- Slack: #cyber-rakhwala-dev
- Email: dev@cyberrakhwala.com

Questions? Check `/docs/API.md` first or reach out on Slack.
