# Cyber Rakhwala API Documentation

## Base URL
```
Production: https://api.cyberrakhwala.com/api
Development: http://localhost:5000/api
```

## Authentication
All endpoints (except auth endpoints) require Bearer token authentication:
```
Authorization: Bearer <token>
```

## Rate Limiting
- Free tier: 100 requests/hour
- Premium tier: 1000 requests/hour
- Enterprise: Unlimited

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student" | "user" | "law"
}
```

**Response:**
```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### POST /auth/login
Authenticate user and get token.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "string",
  "user": { ... }
}
```

---

## Breach Database Tool

### POST /tools/breach-database/email
Check if email has been compromised in data breaches.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "breached": true,
  "breaches": [
    {
      "name": "LinkedIn",
      "date": "2021-06-22",
      "records": 700000000,
      "dataClasses": ["Email addresses", "Full names"]
    }
  ],
  "totalRecords": 3
}
```

### POST /tools/breach-database/password
Check if password hash has been breached (pwned).

**Request:**
```json
{
  "password": "string",
  "isHash": false
}
```

**Response:**
```json
{
  "breached": true,
  "occurrences": 142567
}
```

---

## DNS Records Tool

### POST /tools/dns/lookup
Lookup DNS records for a domain.

**Request:**
```json
{
  "domain": "example.com",
  "recordTypes": ["A", "AAAA", "MX", "NS", "TXT"]
}
```

**Response:**
```json
{
  "domain": "example.com",
  "records": {
    "A": ["93.184.216.34"],
    "AAAA": ["2606:2800:220:1:248:1893:25c8:1946"],
    "MX": [{ "priority": 10, "exchange": "mail.example.com" }],
    "NS": ["ns1.example.com"],
    "TXT": ["v=spf1 include:_spf.example.com ~all"]
  }
}
```

---

## Domain Analysis Tool

### POST /tools/domain/whois
Get WHOIS information for a domain.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "domain": "example.com",
  "registrar": "GoDaddy",
  "createdDate": "1995-08-14T04:00:00Z",
  "expiryDate": "2024-08-13T04:00:00Z",
  "nameServers": ["ns1.example.com"],
  "registrant": {
    "organization": "Example Inc",
    "country": "US"
  }
}
```

### POST /tools/domain/subdomains
Enumerate subdomains for a domain.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "subdomains": [
    "www.example.com",
    "mail.example.com",
    "api.example.com"
  ]
}
```

---

## Email Forensics Tool

### POST /tools/email/analyze-headers
Analyze email headers for forensics.

**Request:**
```json
{
  "headers": "Received: from mail.example.com..."
}
```

**Response:**
```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "Test Email",
  "receivedPath": [
    {
      "server": "mail.example.com",
      "ip": "192.0.2.1",
      "timestamp": "2024-01-07T10:30:00Z"
    }
  ],
  "spf": "pass",
  "dkim": "pass"
}
```

### POST /tools/email/verify
Verify if email address is valid and deliverable.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "valid": true,
  "deliverable": true,
  "disposable": false,
  "role": false
}
```

---

## Geolocation Tool

### POST /tools/geolocation/ip
Lookup IP geolocation and ISP information.

**Request:**
```json
{
  "ip": "8.8.8.8"
}
```

**Response:**
```json
{
  "ip": "8.8.8.8",
  "country": "United States",
  "region": "California",
  "city": "Mountain View",
  "latitude": 37.386,
  "longitude": -122.0838,
  "timezone": "America/Los_Angeles",
  "isp": "Google LLC"
}
```

---

## Hash Analyzer Tool

### POST /tools/hash/analyze
Analyze file hash for malware detection.

**Request:**
```json
{
  "hash": "44d88612fea8a8f36de82e1278abb02f",
  "type": "MD5"
}
```

**Response:**
```json
{
  "hash": "44d88612fea8a8f36de82e1278abb02f",
  "malicious": true,
  "detections": 58,
  "vendors": [
    {
      "name": "Kaspersky",
      "result": "Trojan.Win32.Generic",
      "detected": true
    }
  ],
  "firstSeen": "2023-12-15T14:22:00Z"
}
```

---

## IP Intelligence Tool

### POST /tools/ip/lookup
Comprehensive IP intelligence lookup.

**Request:**
```json
{
  "ip": "1.1.1.1"
}
```

**Response:**
```json
{
  "ip": "1.1.1.1",
  "hostname": "one.one.one.one",
  "country": "Australia",
  "isp": "Cloudflare Inc",
  "asn": "AS13335",
  "geolocation": { ... }
}
```

### POST /tools/ip/reputation
Check IP reputation and threat status.

**Request:**
```json
{
  "ip": "1.1.1.1"
}
```

**Response:**
```json
{
  "score": 95,
  "blacklisted": false,
  "threats": [],
  "category": "CDN/Proxy"
}
```

---

## Phone Lookup Tool

### POST /tools/phone/lookup
Lookup phone number information.

**Request:**
```json
{
  "phone": "+1 (650) 253-0000"
}
```

**Response:**
```json
{
  "phone": "+1 650-253-0000",
  "country": "United States",
  "carrier": "Google Voice",
  "type": "voip",
  "valid": true
}
```

---

## Social Profiler Tool

### POST /tools/social/search
Search for profiles across social platforms.

**Request:**
```json
{
  "query": "johndoe"
}
```

**Response:**
```json
{
  "profiles": [
    {
      "platform": "github",
      "username": "johndoe",
      "url": "https://github.com/johndoe",
      "followers": 1234
    }
  ]
}
```

### POST /tools/social/username
Check username availability across platforms.

**Request:**
```json
{
  "username": "johndoe"
}
```

**Response:**
```json
{
  "platforms": [
    {
      "name": "GitHub",
      "available": false,
      "url": "https://github.com/johndoe"
    }
  ]
}
```

---

## URL Scanner Tool

### POST /tools/url/scan
Scan URL for threats and malicious content.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "safe": true,
  "threats": [],
  "score": 92,
  "categories": ["Technology"]
}
```

---

## Image EXIF Tool

### POST /tools/image/exif
Extract EXIF metadata from image (multipart/form-data).

**Request:**
```
POST /tools/image/exif
Content-Type: multipart/form-data

image: <file>
```

**Response:**
```json
{
  "camera": {
    "make": "Apple",
    "model": "iPhone 15 Pro"
  },
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "location": "San Francisco, CA, USA"
  },
  "timestamp": "2024-01-07T14:30:00Z"
}
```

---

## Data Mining Tool

### POST /tools/data-mining/extract
Extract structured data from text.

**Request:**
```json
{
  "text": "Contact us at info@example.com or call 555-0123",
  "patterns": ["email", "phone"]
}
```

**Response:**
```json
{
  "emails": ["info@example.com"],
  "phones": ["555-0123"]
}
```

---

## Threat Map

### GET /threat-map/cities
Get all monitored cities with threat data.

**Query Parameters:**
- `threatLevel` (optional): Filter by threat level (critical, high, medium, low)
- `region` (optional): Filter by region

**Response:**
```json
[
  {
    "id": "nyc",
    "name": "New York",
    "country": "USA",
    "coords": [-74.006, 40.7128],
    "threat": "high",
    "attacks": 2847,
    "type": "Financial Hub"
  }
]
```

### GET /threat-map/attacks/live
Get real-time attack feed.

**Query Parameters:**
- `limit` (optional): Number of attacks (default: 10)
- `type` (optional): Filter by attack type

**Response:**
```json
[
  {
    "id": "string",
    "source": { ... },
    "target": { ... },
    "type": "APT",
    "packets": 45000,
    "timestamp": 1704628800000
  }
]
```

### GET /threat-map/stats/global
Get current global statistics.

**Response:**
```json
{
  "attacksPerSec": 147,
  "activeThreats": 234,
  "blockedIPs": 45892,
  "dataExfiltrated": 2.7,
  "botnets": 23,
  "compromised": 156892
}
```

### GET /threat-map/threat-level
Get current global threat level.

**Response:**
```json
{
  "level": 72,
  "defcon": "DEFCON3",
  "status": "ELEVATED",
  "trend": "increasing"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## WebSocket

### Connection
```
wss://api.cyberrakhwala.com/ws/threat-map
```

### Message Types
```json
{
  "type": "ATTACK",
  "payload": { ... }
}
```

```json
{
  "type": "THREAT_INTEL",
  "payload": { ... }
}
```

```json
{
  "type": "STATS_UPDATE",
  "payload": { ... }
}
```
