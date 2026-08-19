/**
 * Data barrel — re-exports fixtures for backward compatibility.
 *
 * NOTE: Production code should use the service layer (src/services/*) which now
 * reads real data from Supabase. This barrel only re-exports the fixtures
 * (dummy data) kept for testing/seed purposes.
 */
export * from "@/fixtures";
