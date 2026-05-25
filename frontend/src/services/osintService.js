// OSINT Tools Service - API calls for OSINT investigation tools
import api, { ApiError } from './api';

const ENDPOINT = '/osint';

// Fallback to localStorage/mock if API is unavailable
const useFallback = false;
const RESULTS_STORAGE_KEY = 'cyberRakhwala_osintResults';

// Helper to get/save results from localStorage
const getStoredResults = () => {
  const stored = localStorage.getItem(RESULTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveResult = (result) => {
  const results = getStoredResults();
  results.unshift(result);
  // Keep last 100 results
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results.slice(0, 100)));
};

// Mock data generators for different tool types
const generateMockData = {
  emailLookup: (query) => ({
    email: query,
    valid: Math.random() > 0.2,
    deliverable: Math.random() > 0.3,
    provider: ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com'][Math.floor(Math.random() * 4)],
    breaches: Math.floor(Math.random() * 5),
    socialProfiles: [
      { platform: 'LinkedIn', found: Math.random() > 0.5 },
      { platform: 'Twitter', found: Math.random() > 0.6 },
      { platform: 'Facebook', found: Math.random() > 0.7 },
      { platform: 'Instagram', found: Math.random() > 0.5 }
    ].filter(p => p.found),
    firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }),

  phoneLookup: (query) => ({
    number: query,
    valid: Math.random() > 0.3,
    country: ['India', 'USA', 'UK', 'Canada'][Math.floor(Math.random() * 4)],
    carrier: ['Airtel', 'Jio', 'Vodafone', 'BSNL'][Math.floor(Math.random() * 4)],
    type: ['mobile', 'landline', 'voip'][Math.floor(Math.random() * 3)],
    location: {
      city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'][Math.floor(Math.random() * 4)],
      state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'][Math.floor(Math.random() * 4)]
    }
  }),

  domainLookup: (query) => ({
    domain: query,
    registered: Math.random() > 0.1,
    registrar: ['GoDaddy', 'Namecheap', 'Cloudflare', 'Google Domains'][Math.floor(Math.random() * 4)],
    created: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    expires: new Date(Date.now() + Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    ipAddresses: [`${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`],
    sslCertificate: {
      valid: Math.random() > 0.2,
      issuer: ['Let\'s Encrypt', 'DigiCert', 'Comodo'][Math.floor(Math.random() * 3)],
      expires: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    subdomains: ['www', 'mail', 'api', 'admin', 'blog'].slice(0, Math.floor(Math.random() * 5) + 1)
  }),

  ipLookup: (query) => ({
    ip: query,
    type: Math.random() > 0.5 ? 'IPv4' : 'IPv6',
    country: ['India', 'USA', 'China', 'Russia', 'Germany'][Math.floor(Math.random() * 5)],
    city: ['Mumbai', 'New York', 'Beijing', 'Moscow', 'Berlin'][Math.floor(Math.random() * 5)],
    isp: ['Airtel', 'Jio', 'AT&T', 'Comcast'][Math.floor(Math.random() * 4)],
    organization: ['Corporation', 'University', 'Government'][Math.floor(Math.random() * 3)],
    asn: `AS${Math.floor(Math.random() * 100000)}`,
    proxy: Math.random() > 0.8,
    vpn: Math.random() > 0.7,
    tor: Math.random() > 0.95,
    threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    blacklisted: Math.random() > 0.8
  }),

  usernameLookup: (query) => ({
    username: query,
    platforms: [
      { name: 'Twitter', url: `https://twitter.com/${query}`, found: Math.random() > 0.4 },
      { name: 'Instagram', url: `https://instagram.com/${query}`, found: Math.random() > 0.5 },
      { name: 'GitHub', url: `https://github.com/${query}`, found: Math.random() > 0.6 },
      { name: 'Reddit', url: `https://reddit.com/u/${query}`, found: Math.random() > 0.5 },
      { name: 'LinkedIn', url: `https://linkedin.com/in/${query}`, found: Math.random() > 0.7 },
      { name: 'Facebook', url: `https://facebook.com/${query}`, found: Math.random() > 0.6 },
      { name: 'TikTok', url: `https://tiktok.com/@${query}`, found: Math.random() > 0.7 },
      { name: 'YouTube', url: `https://youtube.com/@${query}`, found: Math.random() > 0.7 },
      { name: 'Telegram', found: Math.random() > 0.8 },
      { name: 'Discord', found: Math.random() > 0.7 }
    ].filter(p => p.found)
  }),

  imageLookup: (query) => ({
    url: query,
    analyzed: true,
    metadata: {
      width: Math.floor(Math.random() * 2000) + 500,
      height: Math.floor(Math.random() * 2000) + 500,
      format: ['JPEG', 'PNG', 'WebP'][Math.floor(Math.random() * 3)],
      size: `${Math.floor(Math.random() * 5000) + 100}KB`
    },
    exif: {
      camera: ['iPhone 14', 'Samsung S23', 'Canon EOS', 'Nikon D850'][Math.floor(Math.random() * 4)],
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      gps: Math.random() > 0.7 ? {
        lat: (Math.random() * 180 - 90).toFixed(6),
        lng: (Math.random() * 360 - 180).toFixed(6)
      } : null
    },
    reverseSearch: {
      matches: Math.floor(Math.random() * 20),
      sources: ['Google Images', 'TinEye', 'Yandex'].slice(0, Math.floor(Math.random() * 3) + 1)
    },
    faces: Math.floor(Math.random() * 5),
    text: Math.random() > 0.5 ? ['Sample text detected', 'Another text'] : []
  }),

  socialLookup: (query) => ({
    query: query,
    profiles: [
      {
        platform: 'Twitter',
        username: query,
        name: 'Sample User',
        followers: Math.floor(Math.random() * 10000),
        following: Math.floor(Math.random() * 1000),
        posts: Math.floor(Math.random() * 5000),
        verified: Math.random() > 0.9,
        created: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    mentions: Math.floor(Math.random() * 100),
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
  }),

  threatIntel: (query) => ({
    indicator: query,
    type: ['ip', 'domain', 'hash', 'url'][Math.floor(Math.random() * 4)],
    malicious: Math.random() > 0.6,
    confidence: Math.floor(Math.random() * 100),
    sources: [
      { name: 'VirusTotal', detected: Math.random() > 0.5, score: `${Math.floor(Math.random() * 70)}/70` },
      { name: 'AbuseIPDB', detected: Math.random() > 0.6, reports: Math.floor(Math.random() * 100) },
      { name: 'Shodan', detected: Math.random() > 0.4, ports: [22, 80, 443, 8080].slice(0, Math.floor(Math.random() * 4) + 1) }
    ],
    tags: ['malware', 'phishing', 'botnet', 'ransomware', 'spam'].slice(0, Math.floor(Math.random() * 3) + 1),
    firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date().toISOString()
  })
};

export const osintService = {
  // Email lookup
  emailLookup: async (email) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'emailLookup',
        query: email,
        data: generateMockData.emailLookup(email),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/email`, { email });
  },

  // Phone lookup
  phoneLookup: async (phone) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'phoneLookup',
        query: phone,
        data: generateMockData.phoneLookup(phone),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/phone`, { phone });
  },

  // Domain lookup
  domainLookup: async (domain) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'domainLookup',
        query: domain,
        data: generateMockData.domainLookup(domain),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/domain`, { domain });
  },

  // IP lookup
  ipLookup: async (ip) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'ipLookup',
        query: ip,
        data: generateMockData.ipLookup(ip),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/ip`, { ip });
  },

  // Username lookup
  usernameLookup: async (username) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Takes longer
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'usernameLookup',
        query: username,
        data: generateMockData.usernameLookup(username),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/username`, { username });
  },

  // Image analysis
  imageAnalysis: async (imageUrl) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'imageAnalysis',
        query: imageUrl,
        data: generateMockData.imageLookup(imageUrl),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/image`, { url: imageUrl });
  },

  // Social media lookup
  socialLookup: async (query, platform = null) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'socialLookup',
        query: query,
        platform,
        data: generateMockData.socialLookup(query),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/social`, { query, platform });
  },

  // Threat intelligence lookup
  threatIntel: async (indicator) => {
    if (useFallback) {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const result = {
        id: `osint_${Date.now()}`,
        tool: 'threatIntel',
        query: indicator,
        data: generateMockData.threatIntel(indicator),
        timestamp: new Date().toISOString()
      };
      saveResult(result);
      return result;
    }

    return api.post(`${ENDPOINT}/threat`, { indicator });
  },

  // Get search history
  getHistory: async (limit = 50) => {
    if (useFallback) {
      return getStoredResults().slice(0, limit);
    }

    return api.get(`${ENDPOINT}/history?limit=${limit}`);
  },

  // Clear history
  clearHistory: async () => {
    if (useFallback) {
      localStorage.removeItem(RESULTS_STORAGE_KEY);
      return { success: true };
    }

    return api.delete(`${ENDPOINT}/history`);
  },

  // Get a specific result
  getResult: async (id) => {
    if (useFallback) {
      const results = getStoredResults();
      const result = results.find(r => r.id === id);
      if (!result) {
        throw new ApiError('Result not found', 404);
      }
      return result;
    }

    return api.get(`${ENDPOINT}/results/${id}`);
  },

  // Export results
  exportResults: async (ids = null, format = 'json') => {
    if (useFallback) {
      let results = getStoredResults();
      
      if (ids && ids.length > 0) {
        results = results.filter(r => ids.includes(r.id));
      }
      
      if (format === 'json') {
        return JSON.stringify(results, null, 2);
      }
      
      return results;
    }

    const params = new URLSearchParams({ format });
    if (ids) {
      params.append('ids', ids.join(','));
    }
    return api.get(`${ENDPOINT}/export?${params.toString()}`);
  }
};

export default osintService;
