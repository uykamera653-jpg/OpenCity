export const PRODUCTION_BACKEND_ENABLED = true;

/**
 * OpenCity is expected to use Supabase for persistence in production.
 * This flag is intentionally not a mock/demo switch; it documents that
 * production code must never silently fall back to local mock persistence.
 */
