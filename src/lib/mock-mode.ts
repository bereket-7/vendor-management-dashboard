/**
 * Single switch for mock fixture data vs live APIs.
 *
 * Toggle via `.env`:
 * - `NEXT_PUBLIC_USE_MOCK=false` — live vendor-core (default if unset)
 * - `NEXT_PUBLIC_USE_MOCK=true` — local fixtures
 *
 * NestJS (`NEXT_PUBLIC_API_URL`) is off unless `NEXT_PUBLIC_USE_NEST=true`.
 * Staging uses vendor-core only — Nest is not deployed on api.vm.tillahealth.com.
 *
 * Live shell auth (Django JWT): `USE_MOCK=false`, Nest off, sign in at `/auth/login`.
 * `NEXT_PUBLIC_DEV_ADMIN` is ignored while Django shell auth is active.
 * Restart `pnpm dev` after changing `NEXT_PUBLIC_*` values.
 */
function envFlag(name: string): boolean {
	const value = process.env[name];
	if (value === undefined || value === "") return false;
	return value === "true" || value === "1";
}

export function isMockEnabled(): boolean {
	return envFlag("NEXT_PUBLIC_USE_MOCK");
}

/** Members fixtures without turning on global mock for other admin modules. */
export function isMembersMockEnabled(): boolean {
	if (isMockEnabled()) return true;
	const value = process.env.NEXT_PUBLIC_MEMBERS_USE_MOCK;
	if (value === "false" || value === "0") return false;
	// Default on: Ethiopian demo fixtures until live scrub deployed everywhere.
	return (
		value === undefined || value === "" || value === "true" || value === "1"
	);
}

/** Inverse of {@link isMockEnabled} — NestJS / vendor-core are expected. */
export function isLiveIntegrationEnabled(): boolean {
	return !isMockEnabled();
}

/**
 * NestJS Better Auth + `/api/admin/*` — opt-in.
 * Default off so live mode does not call a missing localhost:3001.
 */
export function isNestApiEnabled(): boolean {
	return process.env.NEXT_PUBLIC_USE_NEST === "true";
}

/**
 * Run mock data only when mocks are explicitly on.
 * When mocks are off: Nest if opted-in, otherwise `empty` — never silent fixture fallback.
 */
export async function withMockOrRemote<T>(
	mock: () => T | Promise<T>,
	remote: () => Promise<T>,
	empty?: T
): Promise<T> {
	if (isMockEnabled()) return mock();
	if (isNestApiEnabled()) return remote();
	if (arguments.length >= 3) return empty as T;
	// Never call mock() when USE_MOCK=false — empty list, no fixture leakage
	return [] as unknown as T;
}

/** Keep fixture arrays in source; return empty when the mock toggle is off. */
export function fixtureList<T>(items: T[]): T[] {
	return isMockEnabled() ? items : [];
}

/** Keep fixture maps in source; return `{}` when the mock toggle is off. */
export function fixtureRecord<T>(record: Record<string, T>): Record<string, T> {
	return isMockEnabled() ? record : {};
}

/** Pick fixture value or fallback based on the mock toggle. */
export function whenMock<T>(value: T, fallback: T): T {
	return isMockEnabled() ? value : fallback;
}
