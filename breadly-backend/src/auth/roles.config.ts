export const Roles = {
  ADMIN: {
    name: 'ADMIN',
    description: 'Full administrative access',
  },
  USER: {
    name: 'USER',
    description: 'Standard user access',
  },
  PREMIUM_USER: {
    name: 'PREMIUM_USER',
    description: 'Premium tier user access',
  },
} as const;

export type Role = (typeof Roles)[keyof typeof Roles]['name'];
// Resolves to: 'ADMIN' | 'USER' | 'PREMIUM_USER'
