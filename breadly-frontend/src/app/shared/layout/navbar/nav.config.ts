export interface NavLink {
  label: string;
  path: string;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Recipes', path: '/recipes', requiresAuth: true },
  { label: 'Health', path: '/health', requiresAuth: true },
];
