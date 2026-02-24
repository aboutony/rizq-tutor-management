/**
 * RIZQ Security Logger
 * Logs access violation events for audit trail.
 */

export interface AccessViolationEntry {
    userId: string;
    role: string;
    attemptedPath: string;
    redirectedTo: string;
    timestamp: string;
    ip?: string;
}

/**
 * Logs an access violation when a user attempts to access a route
 * outside their role's permitted scope.
 */
export function logAccessViolation(entry: AccessViolationEntry): void {
    const logPayload = {
        level: 'SECURITY',
        event: 'ACCESS_VIOLATION',
        ...entry,
    };

    // Structured JSON logging — in production, pipe to external SIEM / logging service
    console.warn(
        `[RIZQ SECURITY] Access Violation: User "${entry.userId}" (role: ${entry.role}) attempted "${entry.attemptedPath}" → redirected to "${entry.redirectedTo}"`,
    );
    console.warn(JSON.stringify(logPayload));
}
