/**
 * Template dashboard types.
 * Extend with your app-specific types.
 * Note: DashboardStats is defined in api/dashboard.fn.ts to co-locate it with the server function.
 */
// Re-export from the canonical source to avoid duplicate declarations
export type { DashboardStats } from '../api/dashboard.fn'
