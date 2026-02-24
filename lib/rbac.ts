/**
 * RIZQ Role-Based Access Control (RBAC)
 * Defines immutable user roles and route access policies.
 */

export type UserRole = 'TUTOR' | 'STUDENT_PARENT';

export const ROLES: readonly UserRole[] = ['TUTOR', 'STUDENT_PARENT'] as const;

/** Maps each role to its home dashboard path (without locale prefix). */
export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
    TUTOR: '/dashboard/tutor',
    STUDENT_PARENT: '/dashboard/student',
};

/** Maps each role to the URL prefix it is allowed to access under /dashboard. */
export const ROLE_ROUTE_PREFIXES: Record<UserRole, string> = {
    TUTOR: '/dashboard/tutor',
    STUDENT_PARENT: '/dashboard/student',
};

/**
 * Checks if a given dashboard path is allowed for the specified role.
 * @param role The user's role.
 * @param pathname The path being accessed (without locale prefix, e.g. "/dashboard/tutor/setup").
 * @returns true if the route is accessible by the role.
 */
export function isRouteAllowedForRole(role: UserRole, pathname: string): boolean {
    const allowedPrefix = ROLE_ROUTE_PREFIXES[role];
    return pathname.startsWith(allowedPrefix);
}

/**
 * Returns the opposing role's route prefix — used for detecting violations.
 */
export function getOpposingRoutePrefix(role: UserRole): string {
    return role === 'TUTOR'
        ? ROLE_ROUTE_PREFIXES.STUDENT_PARENT
        : ROLE_ROUTE_PREFIXES.TUTOR;
}
