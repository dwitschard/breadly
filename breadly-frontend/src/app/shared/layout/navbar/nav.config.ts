export interface NavLink {
  labelKey: string;
  path: string;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { labelKey: 'NAV.RECIPES', path: '/recipes', requiresAuth: true },
];
