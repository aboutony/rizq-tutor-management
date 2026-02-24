
// A simple in-memory rate limiter.
// For a production environment, a persistent solution like Redis would be more robust.
const requests = new Map<string, number[]>();

const TIME_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Checks if a request is allowed for a given identifier based on a max request count within a time window.
 * @param identifier A unique string to identify the requester (e.g., phone number, IP address).
 * @param maxRequests The maximum number of requests allowed in the time window.
 * @returns True if the request is allowed, false otherwise.
 */
export const isRequestAllowed = (identifier: string, maxRequests: number): boolean => {
  const now = Date.now();
  const timestamps = requests.get(identifier) || [];

  // Filter out timestamps that are outside the current time window
  const recentTimestamps = timestamps.filter(ts => (now - ts) < TIME_WINDOW_MS);

  if (recentTimestamps.length >= maxRequests) {
    // Limit exceeded, update map with filtered timestamps and deny request
    requests.set(identifier, recentTimestamps);
    return false;
  }

  // Request is allowed. Add the new timestamp and update the map.
  recentTimestamps.push(now);
  requests.set(identifier, recentTimestamps);
  return true;
};
