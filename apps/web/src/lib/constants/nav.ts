/**
 * Navigation config for the dashboard sub-routes (per-election shell).
 */
import type { LucideIcon } from 'lucide-react';
import {
  Flag,
  LayoutDashboard,
  Replace,
  Settings,
  Users,
  UserSearch,
} from 'lucide-react';

export interface DashboardNavItem {
  /** Sub-path under `/dashboard/$electionDashboardSlug/`. Empty string means
   *  the parent route itself (Overview). */
  to: string;
  label: string;
  icon: LucideIcon;
  /** Whether the active-link match should be exact (defaults to false). */
  exact?: boolean;
}

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  { to: '', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: 'partylist', label: 'Partylists', icon: Flag },
  { to: 'position', label: 'Positions', icon: Replace },
  { to: 'candidate', label: 'Candidates', icon: UserSearch },
  { to: 'voter', label: 'Voters', icon: Users },
  { to: 'settings', label: 'Settings', icon: Settings },
];
