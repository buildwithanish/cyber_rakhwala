import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { FeatureToggle } from '../models/FeatureToggle.js';
import { Plan } from '../models/Plan.js';
import { RoleProfile } from '../models/RoleProfile.js';
import { Setting } from '../models/Setting.js';
import { ThreatAlert } from '../models/ThreatAlert.js';
import { ThreatEvent } from '../models/ThreatEvent.js';
import { ToolCatalog } from '../models/ToolCatalog.js';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadFrontendTools = async () => {
  const toolsPath = path.resolve(__dirname, '..', '..', '..', 'frontend', 'src', 'mock-api', 'tools.json');
  const raw = await fs.readFile(toolsPath, 'utf8');
  const payload = JSON.parse(raw);
  return payload.tools || [];
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash(env.demoPassword, 10);
  const records = [
    {
      name: 'Demo User',
      email: 'demo@cyberrakhwala.com',
      role: 'user',
      passwordHash,
      credits: 250,
      isEmailVerified: true
    },
    {
      name: 'Admin User',
      email: 'admin@cyberrakhwala.com',
      role: 'admin',
      department: 'operations',
      passwordHash,
      credits: 999,
      isEmailVerified: true
    },
    {
      name: 'Student Demo',
      email: 'student@cyberrakhwala.com',
      role: 'student',
      passwordHash,
      credits: 100,
      isEmailVerified: true
    },
    {
      name: 'Support Admin',
      email: 'support@cyberrakhwala.com',
      role: 'support_admin',
      department: 'support',
      passwordHash,
      credits: 200,
      isEmailVerified: true
    },
    {
      name: 'Provider Manager',
      email: 'provider@cyberrakhwala.com',
      role: 'provider_manager',
      department: 'providers',
      passwordHash,
      credits: 200,
      isEmailVerified: true
    },
    {
      name: 'Content Manager',
      email: 'content@cyberrakhwala.com',
      role: 'content_manager',
      department: 'content',
      passwordHash,
      credits: 200,
      isEmailVerified: true
    }
  ];

  for (const record of records) {
    await User.updateOne({ email: record.email }, { $set: record }, { upsert: true });
  }
};

const seedRoleProfiles = async () => {
  const roles = [
    {
      name: 'Super Admin',
      slug: 'super-admin',
      baseRole: 'super_admin',
      department: 'executive',
      description: 'Full system ownership and unrestricted access.',
      permissions: ['*'],
      accessibleModules: ['all'],
      isSystem: true,
      isActive: true
    },
    {
      name: 'Operations Admin',
      slug: 'operations-admin',
      baseRole: 'admin',
      department: 'operations',
      description: 'Manages users, billing, subscriptions, and global operations.',
      permissions: ['admin:access', 'users:read', 'users:update', 'users:ban', 'plans:manage', 'payments:manage', 'subscriptions:manage', 'analytics:read', 'searchLogs:read', 'tickets:manage'],
      accessibleModules: ['overview', 'users', 'payments', 'subscriptions', 'plans', 'tickets', 'analytics'],
      isSystem: true,
      isActive: true
    },
    {
      name: 'Support Team',
      slug: 'support-team',
      baseRole: 'support_admin',
      department: 'support',
      description: 'Handles support queue, user verification, and ticket workflows.',
      permissions: ['admin:access', 'users:read', 'users:update', 'tickets:manage', 'analytics:read'],
      accessibleModules: ['overview', 'users', 'tickets'],
      isSystem: true,
      isActive: true
    },
    {
      name: 'Provider Manager',
      slug: 'provider-manager',
      baseRole: 'provider_manager',
      department: 'providers',
      description: 'Controls provider endpoints, API keys, datasets, and tool connectivity.',
      permissions: ['admin:access', 'providers:manage', 'apiKeys:manage', 'datasets:manage', 'featureToggles:manage', 'analytics:read'],
      accessibleModules: ['overview', 'providers', 'apiKeys', 'datasets', 'featureToggles'],
      isSystem: true,
      isActive: true
    },
    {
      name: 'Content Manager',
      slug: 'content-manager',
      baseRole: 'content_manager',
      department: 'content',
      description: 'Manages public content blocks, settings, offers, and homepage messaging.',
      permissions: ['admin:access', 'content:manage', 'settings:manage', 'featureToggles:manage', 'coupons:manage'],
      accessibleModules: ['overview', 'content', 'settings', 'featureToggles', 'coupons'],
      isSystem: true,
      isActive: true
    },
    {
      name: 'Security Analyst',
      slug: 'security-analyst',
      baseRole: 'analyst',
      department: 'intelligence',
      description: 'Reviews search activity, analytics, and threat map operations.',
      permissions: ['admin:access', 'analytics:read', 'searchLogs:read', 'threatMap:manage', 'users:read'],
      accessibleModules: ['overview', 'analytics', 'searchLogs', 'threatMap'],
      isSystem: true,
      isActive: true
    }
  ];

  for (const role of roles) {
    await RoleProfile.updateOne({ slug: role.slug }, { $set: role }, { upsert: true });
  }
};

const seedPlans = async () => {
  const plans = [
    {
      slug: 'starter',
      name: 'Starter',
      category: 'credits',
      billingInterval: 'one_time',
      currency: 'INR',
      price: 99,
      credits: 100,
      features: ['Basic lookup access', 'Single-user workspace'],
      isActive: true,
      displayOrder: 1
    },
    {
      slug: 'basic',
      name: 'Basic',
      category: 'credits',
      billingInterval: 'one_time',
      currency: 'INR',
      price: 199,
      credits: 250,
      features: ['Standard lookup access', 'Search history'],
      isActive: true,
      displayOrder: 2
    },
    {
      slug: 'pro',
      name: 'Pro',
      category: 'credits',
      billingInterval: 'one_time',
      currency: 'INR',
      price: 349,
      credits: 500,
      features: ['Advanced lookup access', 'Evidence workflows'],
      isPopular: true,
      isActive: true,
      displayOrder: 3
    },
    {
      slug: 'enterprise',
      name: 'Enterprise',
      category: 'credits',
      billingInterval: 'one_time',
      currency: 'INR',
      price: 599,
      credits: 1000,
      features: ['High-volume investigations', 'Priority support'],
      isActive: true,
      displayOrder: 4
    },
    {
      slug: 'professional-monthly',
      name: 'Professional Monthly',
      category: 'subscription',
      billingInterval: 'monthly',
      currency: 'INR',
      price: 1499,
      credits: 1000,
      quotas: {
        searchesPerDay: 200,
        monthlySearches: 6000,
        teamMembers: 5,
        storageMb: 5120
      },
      features: ['Recurring subscription', 'Priority tools', 'Team collaboration'],
      isActive: true,
      displayOrder: 10
    }
  ];

  for (const plan of plans) {
    await Plan.updateOne({ slug: plan.slug }, { $set: plan }, { upsert: true });
  }
};

const seedTools = async () => {
  const tools = await loadFrontendTools();
  for (const tool of tools) {
    await ToolCatalog.updateOne(
      { toolId: tool.id },
      {
        $set: {
          toolId: tool.id,
          name: tool.name,
          category: tool.category,
          description: tool.description || '',
          inputType: tool.inputType || 'search-query',
          creditCost: tool.creditCost || { student: 0, user: 0 },
          outputDepth: tool.outputDepth || {},
          correlationLayers: tool.correlationLayers || {},
          simulatedDelay: tool.simulatedDelay || 0,
          tags: tool.tags || [],
          isEnabled: tool.enabled !== false
        }
      },
      { upsert: true }
    );
  }
};

const seedContent = async () => {
  const blocks = [
    {
      key: 'homepage.hero',
      section: 'homepage',
      title: 'Hero',
      body: {
        heading: 'Cyber Rakhwala',
        subheading: 'Investigation workflows, search tooling, and audit-grade operations in one platform.'
      }
    },
    {
      key: 'homepage.pricing',
      section: 'homepage',
      title: 'Pricing',
      body: {
        currency: 'INR',
        featuredPlan: 'pro'
      }
    }
  ];

  for (const block of blocks) {
    await ContentBlock.updateOne({ key: block.key }, { $set: block }, { upsert: true });
  }
};

const seedSettings = async () => {
  const settings = [
    {
      group: 'public',
      key: 'support_email',
      value: 'support@cyberrakhwala.com',
      isPublic: true,
      description: 'Public support email'
    },
    {
      group: 'threat_map',
      key: 'actors',
      value: [
        {
          id: 'apt-lotus',
          name: 'APT Lotus',
          origin: 'Unknown',
          targets: ['Finance', 'Public Sector'],
          ttps: ['Phishing', 'Credential Theft'],
          status: 'active',
          threatScore: 81
        }
      ],
      isPublic: false,
      description: 'Threat actor catalog'
    },
    {
      group: 'threat_map',
      key: 'ioc_feed',
      value: [
        {
          id: 'ioc-1',
          type: 'domain',
          value: 'suspicious-phish.example',
          severity: 'HIGH'
        }
      ],
      isPublic: false,
      description: 'Threat map IOC feed'
    }
  ];

  for (const setting of settings) {
    await Setting.updateOne(
      { group: setting.group, key: setting.key },
      { $set: setting },
      { upsert: true }
    );
  }
};

const seedFeatureToggles = async () => {
  const toggles = [
    { key: 'chatbot', description: 'Chatbot availability', enabled: true, roles: ['user', 'admin'] },
    { key: 'dataset-search', description: 'Dataset-backed searches', enabled: true, roles: ['user', 'admin'] },
    { key: 'threat-map', description: 'Threat map pages', enabled: true, roles: ['student', 'user', 'admin'] }
  ];

  for (const toggle of toggles) {
    await FeatureToggle.updateOne({ key: toggle.key }, { $set: toggle }, { upsert: true });
  }
};

const seedThreatData = async () => {
  if ((await ThreatEvent.countDocuments()) === 0) {
    await ThreatEvent.insertMany([
      {
        sourceCity: { id: 'mumbai', name: 'Mumbai', country: 'India', coords: [72.8777, 19.076] },
        targetCity: { id: 'london', name: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5072] },
        attackType: 'Phishing',
        severity: 7,
        packets: 18000,
        protocol: 'HTTPS',
        region: 'EMEA',
        source: 'seed'
      },
      {
        sourceCity: { id: 'new-york', name: 'New York', country: 'United States', coords: [-74.006, 40.7128] },
        targetCity: { id: 'delhi', name: 'Delhi', country: 'India', coords: [77.1025, 28.7041] },
        attackType: 'DDoS',
        severity: 9,
        packets: 56000,
        protocol: 'TCP',
        region: 'APAC',
        source: 'seed'
      }
    ]);
  }

  if ((await ThreatAlert.countDocuments()) === 0) {
    await ThreatAlert.insertMany([
      {
        title: 'Credential phishing surge detected',
        message: 'A spike in credential phishing domains has been detected across APAC.',
        severity: 'HIGH',
        regions: ['APAC'],
        attackTypes: ['Phishing']
      }
    ]);
  }
};

const run = async () => {
  await connectDatabase();
  await seedUsers();
  await seedRoleProfiles();
  await seedPlans();
  await seedTools();
  await seedContent();
  await seedSettings();
  await seedFeatureToggles();
  await seedThreatData();
  logger.info('Seed script completed successfully');
  process.exit(0);
};

run().catch((error) => {
  logger.error({ err: error }, 'Seed script failed');
  process.exit(1);
});
