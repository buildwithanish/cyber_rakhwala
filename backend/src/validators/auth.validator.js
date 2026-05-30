import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const emptyToUndefined = (schema) =>
  z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  }, schema.optional());

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: passwordSchema,
    role: z.enum(['student', 'user']).default('student'),
    username: z.string().min(3).max(60).optional(),
    phone: z.string().min(6).max(30).optional(),
    organization: z.string().max(120).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    otpCode: z.string().length(6).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const demoLoginSchema = z.object({
  body: z.object({
    role: z.enum(['student', 'user', 'admin']).default('student')
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(20)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: emptyToUndefined(z.string().min(2).max(120)),
    username: emptyToUndefined(z.string().min(3).max(60)),
    email: emptyToUndefined(z.string().email()),
    phone: emptyToUndefined(z.string().min(6).max(30)),
    organization: emptyToUndefined(z.string().max(120)),
    bio: emptyToUndefined(z.string().max(500)),
    avatar: emptyToUndefined(z.string().url()),
    preferences: z
      .object({
        theme: z.string().optional(),
        notifications: z
          .object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            weeklyReport: z.boolean().optional()
          })
          .optional(),
        privacy: z
          .object({
            analyticsEnabled: z.boolean().optional(),
            saveSensitiveData: z.boolean().optional()
          })
          .optional(),
        ui: z
          .object({
            soundEffects: z.boolean().optional(),
            autoSave: z.boolean().optional()
          })
          .optional(),
        security: z
          .object({
            twoFactor: z.boolean().optional(),
            loginAlerts: z.boolean().optional()
          })
          .optional()
      })
      .optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const emailOnlySchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const verifyTokenSchema = z.object({
  body: z
    .object({
      token: z.string().min(10).optional(),
      email: z.string().email().optional(),
      code: z.string().length(6).optional()
    })
    .refine((data) => data.token || (data.email && data.code), {
      message: 'Provide either a verification token or an email + code pair'
    }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    newPassword: passwordSchema
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    purpose: z.enum(['login', 'signup', 'email_verification', 'password_reset', 'sensitive_action'])
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    purpose: z.enum(['login', 'signup', 'email_verification', 'password_reset', 'sensitive_action']),
    code: z.string().length(6)
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().optional() }).optional()
});

export const verifyLoginOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const sessionParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});
