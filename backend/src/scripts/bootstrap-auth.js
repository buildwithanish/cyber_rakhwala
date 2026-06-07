import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { User } from '../models/User.js';

const CORE_ACCOUNTS = [
  {
    name: 'Admin User',
    email: 'admin@cyberrakhwala.com',
    role: 'admin',
    department: 'operations'
  },
  {
    name: 'Student Demo',
    email: 'student@cyberrakhwala.com',
    role: 'student'
  },
  {
    name: 'Law Enforcement Demo',
    email: 'lawenforcement@cyberrakhwala.com',
    role: 'law_enforcement',
    department: 'intelligence'
  },
  {
    name: 'Law Enforcement Demo',
    email: 'law-enforcement@cyberrakhwala.com',
    role: 'law_enforcement',
    department: 'intelligence'
  },
  {
    name: 'Support Admin',
    email: 'support@cyberrakhwala.com',
    role: 'support_admin',
    department: 'support'
  },
  {
    name: 'Provider Manager',
    email: 'provider@cyberrakhwala.com',
    role: 'provider_manager',
    department: 'providers'
  },
  {
    name: 'Content Manager',
    email: 'content@cyberrakhwala.com',
    role: 'content_manager',
    department: 'content'
  }
];

export const ensureCoreAuthAccounts = async () => {
  const passwordHash = await bcrypt.hash(env.demoPassword, 10);

  for (const account of CORE_ACCOUNTS) {
    await User.updateOne(
      { email: account.email.toLowerCase() },
      {
        $set: {
          ...account,
          email: account.email.toLowerCase(),
          passwordHash,
          credits: account.role === 'student' ? 100 : 250,
          isEmailVerified: true,
          isActive: true,
          isBanned: false,
          approvalStatus: 'approved',
          approvalRequestedAt: null,
          approvalReviewedAt: new Date(),
          approvalReviewedBy: null
        }
      },
      { upsert: true }
    );
  }

  logger.info(
    { accounts: CORE_ACCOUNTS.map((account) => account.email) },
    'Core auth accounts ensured'
  );
};

export default ensureCoreAuthAccounts;
