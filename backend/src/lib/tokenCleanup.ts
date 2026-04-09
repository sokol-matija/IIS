import { prisma } from "./prisma";

/**
 * Clean up expired refresh tokens from the database.
 * Should be run periodically (e.g., daily or hourly).
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(), // Delete tokens that expired before now
      },
    },
  });

  console.log(`[TokenCleanup] Deleted ${result.count} expired refresh tokens`);
  return result.count;
}

/**
 * Start a periodic cleanup job.
 * @param intervalMs Interval in milliseconds between cleanup runs (default: 1 hour)
 */
export function startTokenCleanupJob(intervalMs: number = 60 * 60 * 1000): NodeJS.Timer {
  console.log(`[TokenCleanup] Starting cleanup job (interval: ${intervalMs}ms)`);

  // Run cleanup immediately on startup
  cleanupExpiredTokens().catch((err) => console.error("[TokenCleanup] Error during cleanup:", err));

  // Then run periodically
  return setInterval(() => {
    cleanupExpiredTokens().catch((err) => console.error("[TokenCleanup] Error during cleanup:", err));
  }, intervalMs);
}
