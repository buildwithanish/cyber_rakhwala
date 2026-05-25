const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  return [value];
};

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const uniqueStrings = (values = []) =>
  [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];

const pickDateString = (value, fallback = 'Unavailable') => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
};

const formatLocalTime = (timezone) => {
  if (!timezone) {
    return 'Unavailable';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date());
  } catch (_error) {
    return 'Unavailable';
  }
};

const calculateAge = (createdAt) => {
  if (!createdAt) {
    return 'Unavailable';
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return 'Unavailable';
  }

  const diffMs = Date.now() - created.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

  if (years <= 0 && months <= 0) {
    return 'Less than a month';
  }

  if (years <= 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  return `${years} year${years === 1 ? '' : 's'}${months > 0 ? `, ${months} month${months === 1 ? '' : 's'}` : ''}`;
};

const toFlagEmoji = (countryCode) => {
  const code = String(countryCode || '').trim().toUpperCase();
  if (code.length !== 2) {
    return 'GL';
  }

  return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
};

const getResponseList = (responseMap = {}) =>
  Object.values(responseMap).filter((value) => value && typeof value === 'object');

const getBuiltIn = (responseMap = {}) =>
  Object.assign({}, ...getResponseList(responseMap).map((item) => item?.builtIn || {}));

const getDatasetMatches = (responseMap = {}) =>
  getResponseList(responseMap).flatMap((item) => (Array.isArray(item?.datasetMatches) ? item.datasetMatches : []));

const getProviderResults = (responseMap = {}) =>
  getResponseList(responseMap).flatMap((item) => (Array.isArray(item?.providerResults) ? item.providerResults : []));

const getProviderErrors = (responseMap = {}) => getProviderResults(responseMap).filter((item) => item?.error);

const getProviderData = (response) => {
  const direct = response?.data;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct;
  }

  const provider = (response?.providerResults || []).find(
    (item) => item?.data && typeof item.data === 'object' && !Array.isArray(item.data)
  );

  return provider?.data || {};
};

const getListData = (response) => {
  const direct = response?.data;
  if (Array.isArray(direct)) {
    return direct;
  }

  const provider = (response?.providerResults || []).find((item) => Array.isArray(item?.data));
  return provider?.data || [];
};

const summarizeSources = (responseMap = {}) => {
  const datasetMatches = getDatasetMatches(responseMap);
  const providerResults = getProviderResults(responseMap);
  const providerErrors = providerResults.filter((item) => item?.error);

  const limited =
    datasetMatches.length === 0 ||
    providerResults.length === 0 ||
    providerResults.every((item) => !item?.data || item?.error);

  return {
    datasetMatches,
    providerResults,
    providerErrors,
    sourceNotice: limited
      ? 'Limited intelligence: configure datasets and licensed providers from the admin panel for deeper results.'
      : ''
  };
};

const buildThreatLevel = ({ severityScore, providerErrors, datasetMatches }) => {
  if (severityScore >= 70 || datasetMatches.length >= 3) {
    return 'high';
  }

  if (severityScore >= 35 || providerErrors.length > 0 || datasetMatches.length > 0) {
    return 'medium';
  }

  return 'low';
};

export const adaptPhoneLookupResponse = (query, responseMap = {}) => {
  const lookupData = getProviderData(responseMap.lookup);
  const carrierData = getProviderData(responseMap.carrier);
  const validationData = getProviderData(responseMap.validate);
  const reputationData = getProviderData(responseMap.reputation);
  const builtIn = getBuiltIn(responseMap);
  const { datasetMatches, providerResults, providerErrors, sourceNotice } = summarizeSources(responseMap);

  const spamScore = asNumber(
    reputationData.spamScore ?? reputationData.score ?? lookupData.spamScore ?? lookupData.score,
    0
  );
  const reportsCount = datasetMatches.length + asNumber(reputationData.reportsCount ?? lookupData.reportsCount, 0);
  const riskScore = asNumber(reputationData.riskScore ?? reputationData.score ?? spamScore, 0);

  return {
    number: query,
    formatted: lookupData.formatted || validationData.formatted || builtIn.normalized || query,
    valid: validationData.valid ?? builtIn.valid ?? lookupData.valid ?? false,
    type: lookupData.type || carrierData.type || 'Unavailable',
    carrier: carrierData.carrier || lookupData.carrier || lookupData.networkName || 'Unavailable',
    lineType: carrierData.lineType || lookupData.lineType || lookupData.type || 'Unavailable',
    country: lookupData.country || carrierData.country || builtIn.countryHint || 'Unavailable',
    countryCode: lookupData.countryCode || carrierData.countryCode || builtIn.countryHint || 'N/A',
    region: lookupData.region || lookupData.state || 'Unavailable',
    city: lookupData.city || 'Unavailable',
    timezone: lookupData.timezone || 'Unavailable',
    localTime: formatLocalTime(lookupData.timezone),
    coordinates: {
      lat: asNumber(lookupData.lat ?? lookupData.latitude, 0),
      lng: asNumber(lookupData.lng ?? lookupData.longitude, 0)
    },
    owner: {
      name: lookupData.ownerName || lookupData.name || 'Unavailable',
      type: lookupData.ownerType || 'Unavailable',
      age: lookupData.ownerAge || 'Unavailable'
    },
    spamScore,
    robocall: Boolean(reputationData.robocall ?? lookupData.robocall),
    reputation:
      reputationData.reputation ||
      lookupData.reputation ||
      (providerErrors.length ? 'Provider issues detected' : reportsCount > 0 ? 'Needs review' : 'No confirmed threats'),
    reportsCount,
    lastReported: pickDateString(datasetMatches[0]?.updatedAt || reputationData.lastReported || lookupData.lastReported),
    portedStatus: lookupData.portedStatus || carrierData.portedStatus || 'Unavailable',
    roaming: Boolean(lookupData.roaming),
    reachable: lookupData.reachable ?? builtIn.valid ?? false,
    relatedNumbers: uniqueStrings(lookupData.relatedNumbers || reputationData.relatedNumbers || []),
    socialProfiles: asArray(lookupData.socialProfiles || reputationData.socialProfiles).map((item) => ({
      platform: item?.platform || item?.name || 'Unknown',
      registered: Boolean(item?.registered ?? item?.found ?? item?.active)
    })),
    networkDetails: {
      mcc: carrierData.mcc || 'Unavailable',
      mnc: carrierData.mnc || 'Unavailable',
      networkName: carrierData.networkName || carrierData.carrier || 'Unavailable',
      networkType: carrierData.networkType || lookupData.networkType || 'Unavailable',
      signalStrength: lookupData.signalStrength || 'Unavailable',
      connectionStatus: providerErrors.length ? 'Degraded' : 'Available'
    },
    simInfo: {
      simType: lookupData.simType || 'Unavailable',
      simStatus: lookupData.simStatus || 'Unavailable',
      imsi: lookupData.imsi || 'Unavailable',
      iccid: lookupData.iccid || 'Unavailable',
      activationDate: pickDateString(lookupData.activationDate)
    },
    deviceInfo: {
      deviceType: lookupData.deviceType || 'Unavailable',
      osType: lookupData.osType || 'Unavailable',
      lastSeen: lookupData.lastSeen || reputationData.lastSeen || '',
      deviceAge: lookupData.deviceAge || 'Unavailable'
    },
    mnpHistory: {
      originalCarrier: carrierData.originalCarrier || 'Unavailable',
      portDate: pickDateString(carrierData.portDate),
      portCount: asNumber(carrierData.portCount, 0),
      isPortedRecently: Boolean(carrierData.isPortedRecently)
    },
    callActivity: {
      avgDailyUsage: lookupData.avgDailyUsage || 'Unavailable',
      lastActivity: lookupData.lastActivity || reputationData.lastActivity || 'Unavailable',
      primaryUsage: lookupData.primaryUsage || 'Unavailable',
      internationalCalls: Boolean(lookupData.internationalCalls),
      smsCapable: lookupData.smsCapable ?? true,
      mmsCapable: lookupData.mmsCapable ?? false,
      voicemailEnabled: lookupData.voicemailEnabled ?? false
    },
    fraudIndicators: {
      riskLevel:
        reputationData.riskLevel ||
        (reportsCount > 2 ? 'Medium' : builtIn.valid === false ? 'High' : 'Low'),
      riskScore,
      fraudReports: reportsCount,
      blacklistStatus: reputationData.blacklistStatus || (reportsCount > 0 ? 'Watchlist match' : 'Clean'),
      disposableNumber: Boolean(reputationData.disposableNumber),
      virtualNumber: Boolean(reputationData.virtualNumber),
      tollFree: Boolean(lookupData.tollFree),
      premium: Boolean(lookupData.premium)
    },
    additionalInfo: {
      numberAge: lookupData.numberAge || 'Unavailable',
      firstSeen: pickDateString(lookupData.firstSeen),
      lastVerified: pickDateString(validationData.lastVerified || lookupData.lastVerified || new Date().toISOString()),
      confidenceScore: asNumber(lookupData.confidenceScore ?? validationData.confidenceScore, 0),
      dataSource: providerResults.length ? providerResults.map((item) => item.provider).join(', ') : 'Built-in intelligence',
      lastUpdated: new Date().toLocaleString()
    },
    sourceNotice
  };
};

export const adaptDomainAnalysisResponse = (query, responseMap = {}) => {
  const whoisData = getProviderData(responseMap.whois);
  const subdomainData = getProviderData(responseMap.subdomains);
  const sslData = getProviderData(responseMap.ssl);
  const reputationData = getProviderData(responseMap.reputation);
  const techData = getProviderData(responseMap.techStack);
  const builtIn = getBuiltIn(responseMap);
  const { datasetMatches, providerResults, providerErrors, sourceNotice } = summarizeSources(responseMap);

  const technologies = asArray(techData.technologies || techData.stack || getListData(responseMap.techStack)).map(
    (item, index) => ({
      name: item?.name || item?.technology || item?.label || `Technology ${index + 1}`,
      category: item?.category || item?.type || 'Detected',
      icon: item?.icon || 'Stack',
      confidence: asNumber(item?.confidence, 60)
    })
  );

  const dnsSource = subdomainData.dns || subdomainData.records || {};
  const reputationScore = asNumber(reputationData.score ?? reputationData.reputation, 0);

  return {
    domain: query,
    status: reputationData.status || whoisData.status || (providerResults.length ? 'resolved' : 'limited'),
    registrar: whoisData.registrar || 'Unavailable',
    created: pickDateString(whoisData.created || whoisData.creationDate),
    expires: pickDateString(whoisData.expires || whoisData.expirationDate),
    updated: pickDateString(whoisData.updated || whoisData.updatedDate),
    age: calculateAge(whoisData.created || whoisData.creationDate),
    nameservers: uniqueStrings(
      whoisData.nameservers || whoisData.nameServers || dnsSource.ns || asArray(subdomainData.nameservers)
    ),
    whois: {
      registrant: whoisData.registrant || 'Unavailable',
      admin: whoisData.admin || 'Unavailable',
      tech: whoisData.tech || 'Unavailable',
      dnssec: whoisData.dnssec || 'Unavailable'
    },
    dns: {
      a: uniqueStrings(dnsSource.a || dnsSource.A || []),
      aaaa: uniqueStrings(dnsSource.aaaa || dnsSource.AAAA || []),
      mx: uniqueStrings(dnsSource.mx || dnsSource.MX || []),
      txt: uniqueStrings(dnsSource.txt || dnsSource.TXT || []),
      ns: uniqueStrings(dnsSource.ns || dnsSource.NS || whoisData.nameservers || [])
    },
    ssl: {
      issuer: sslData.issuer || 'Unavailable',
      valid: sslData.valid ?? null,
      expires: pickDateString(sslData.expires || sslData.validTo),
      grade: sslData.grade || 'Unavailable',
      protocol: sslData.protocol || 'Unavailable',
      cipher: sslData.cipher || 'Unavailable'
    },
    security: {
      malware: Boolean(reputationData.malware),
      phishing: Boolean(reputationData.phishing),
      spam: Boolean(reputationData.spam),
      reputation: reputationScore,
      status:
        reputationData.status ||
        (datasetMatches.length ? 'watchlist-match' : providerErrors.length ? 'degraded' : 'clean')
    },
    technologies,
    subdomains: uniqueStrings(
      subdomainData.subdomains || subdomainData.items || getListData(responseMap.subdomains)
    ),
    sourceNotice,
    sourceSummary: {
      datasetMatches: datasetMatches.length,
      providers: providerResults.length,
      providerErrors: providerErrors.length,
      rootDomain: builtIn.root || query
    }
  };
};

export const adaptIpIntelligenceResponse = (query, responseMap = {}) => {
  const lookupData = getProviderData(responseMap.lookup);
  const reputationData = getProviderData(responseMap.reputation);
  const whoisData = getProviderData(responseMap.whois);
  const asnData = getProviderData(responseMap.asn);
  const threatData = getProviderData(responseMap.threatIntel);
  const portsData = getProviderData(responseMap.ports);
  const builtIn = getBuiltIn(responseMap);
  const { datasetMatches, providerResults, providerErrors, sourceNotice } = summarizeSources(responseMap);

  const severityScore = asNumber(
    threatData.score ?? reputationData.score ?? reputationData.reputation,
    Math.max(0, 70 - datasetMatches.length * 12 - providerErrors.length * 10)
  );

  const history = [
    ...datasetMatches.slice(0, 4).map((match) => ({
      date: pickDateString(match.updatedAt || match.createdAt || new Date().toISOString()),
      event: `Dataset match: ${match.datasetName || match.name || 'Configured dataset'}`,
      type: 'security'
    })),
    ...providerErrors.slice(0, 3).map((item) => ({
      date: pickDateString(new Date().toISOString()),
      event: `Provider issue: ${item.provider || 'provider'} returned ${item.error}`,
      type: 'change'
    }))
  ];

  if (!history.length) {
    history.push({
      date: pickDateString(new Date().toISOString()),
      event: 'Lookup completed with currently configured sources',
      type: 'info'
    });
  }

  const location = lookupData.location || lookupData;
  const latitude = asNumber(location.lat ?? location.latitude, 0);
  const longitude = asNumber(location.lng ?? location.longitude, 0);

  return {
    ip: query,
    location: {
      country: location.country || 'Unavailable',
      countryCode: location.countryCode || 'N/A',
      city: location.city || 'Unavailable',
      region: location.region || location.state || 'Unavailable',
      lat: latitude,
      lng: longitude,
      timezone: location.timezone || 'Unavailable',
      flag: toFlagEmoji(location.countryCode)
    },
    isp: {
      name: asnData.org || lookupData.isp || whoisData.org || 'Unavailable',
      asn: asnData.asn || whoisData.asn || 'Unavailable',
      org: asnData.org || whoisData.org || 'Unavailable',
      type: lookupData.type || (builtIn.private ? 'private' : 'network')
    },
    security: {
      vpn: Boolean(threatData.vpn || reputationData.vpn),
      proxy: Boolean(threatData.proxy || reputationData.proxy),
      tor: Boolean(threatData.tor || reputationData.tor),
      datacenter: Boolean(threatData.datacenter || reputationData.datacenter),
      threatLevel: threatData.threatLevel || buildThreatLevel({ severityScore, providerErrors, datasetMatches }),
      reputation: severityScore,
      blacklisted: Boolean(threatData.blacklisted || reputationData.blacklisted || datasetMatches.length)
    },
    network: {
      hostname: lookupData.hostname || whoisData.hostname || 'Unavailable',
      ports: uniqueStrings(portsData.openPorts || portsData.ports || []).map((value) => asNumber(value)),
      protocols: uniqueStrings(portsData.protocols || threatData.protocols || []),
      ssl: threatData.ssl ?? lookupData.ssl ?? false
    },
    history,
    sourceNotice
  };
};

const collectDataTypes = (entries = []) => {
  const counts = new Map();

  entries.forEach((entry) => {
    asArray(entry?.dataTypes || entry?.fields || entry?.types).forEach((value) => {
      const key = String(value || '').trim();
      if (!key) {
        return;
      }
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  return counts;
};

export const adaptBreachResponse = (query, searchType, responseMap = {}) => {
  const searchData = getProviderData(responseMap.search);
  const statsData = getProviderData(responseMap.stats);
  const { datasetMatches, providerResults, providerErrors, sourceNotice } = summarizeSources(responseMap);

  const providerBreaches = asArray(searchData.breaches || searchData.results || searchData.items);
  const datasetBreaches = datasetMatches.map((match) => ({
    name: match.datasetName || match.name || 'Configured dataset',
    date: pickDateString(match.updatedAt || match.createdAt),
    records: match.recordCount || match.records || 'N/A',
    dataTypes: asArray(match.dataTypes || match.fields || []),
    severity: match.severity || 'Medium',
    verified: true,
    description: match.summary || match.notes || 'Matched a configured enterprise dataset.'
  }));

  const breaches = [...providerBreaches, ...datasetBreaches].map((entry, index) => ({
    name: entry?.name || entry?.title || `Source ${index + 1}`,
    date: pickDateString(entry?.date || entry?.breachDate || entry?.updatedAt),
    records: entry?.records || entry?.recordCount || entry?.totalRecords || 'N/A',
    dataTypes: uniqueStrings(entry?.dataTypes || entry?.fields || []),
    severity: entry?.severity || (datasetMatches.length > 2 ? 'High' : 'Medium'),
    verified: entry?.verified ?? true,
    description: entry?.description || entry?.summary || 'Reported by the currently configured source.'
  }));

  const dataTypeCounts = collectDataTypes(breaches);
  const exposedData = [
    { type: 'Email', count: dataTypeCounts.get('Email') || dataTypeCounts.get('email') || 0 },
    { type: 'Password', count: dataTypeCounts.get('Password') || dataTypeCounts.get('password') || 0 },
    { type: 'Phone', count: dataTypeCounts.get('Phone') || dataTypeCounts.get('phone') || 0 },
    { type: 'Address', count: dataTypeCounts.get('Address') || dataTypeCounts.get('address') || 0 },
    { type: 'Credit Card', count: dataTypeCounts.get('Credit Card') || dataTypeCounts.get('card') || 0 }
  ];

  const totalBreaches = breaches.length;
  const totalRecords =
    asNumber(searchData.totalRecords ?? statsData.totalRecords, 0) ||
    breaches.reduce((total, item) => total + asNumber(item.records, 0), 0);

  return {
    query,
    type: searchType,
    found: totalBreaches > 0,
    totalBreaches,
    totalRecords,
    firstBreach: breaches[0]?.date || 'Unavailable',
    lastBreach: breaches.at(-1)?.date || 'Unavailable',
    riskLevel: totalBreaches >= 5 ? 'Critical' : totalBreaches >= 3 ? 'High' : totalBreaches > 0 ? 'Medium' : 'Low',
    exposedData,
    breaches,
    recommendations: [
      'Rotate affected credentials immediately and enforce unique passwords.',
      'Enable multi-factor authentication for all impacted services.',
      'Review enterprise identity and access logs for suspicious sign-ins.',
      'Notify affected users through your approved breach response workflow.',
      'Update monitoring rules for reused credentials and phishing follow-up attempts.'
    ],
    darkWebMentions: asNumber(searchData.darkWebMentions, providerResults.length),
    pastebin: asNumber(searchData.pastebinMentions ?? searchData.pastebin, datasetMatches.length),
    sourceNotice
  };
};
