/**
 * Single switch for mock fixture data vs live APIs.
 *
 * Toggle via `.env`:
 * - `NEXT_PUBLIC_USE_MOCK=true` — local fixtures (default if unset)
 * - `NEXT_PUBLIC_USE_MOCK=false` — no fixture data; use remote vendor-core
 *
 * NestJS (`NEXT_PUBLIC_API_URL`) is off unless `NEXT_PUBLIC_USE_NEST=true`.
 * Staging uses vendor-core only — Nest is not deployed on api.vm.tillahealth.com.
 *
 * App shell without Nest: keep `NEXT_PUBLIC_DEV_ADMIN=true` (mock auth only).
 * With `NEXT_PUBLIC_USE_MOCK=true`, both Nest auth and vendor-core login are skipped.
 * Restart `pnpm dev` after changing `NEXT_PUBLIC_*` values.
 */
export function isMockEnabled(): boolean {
	const value = process.env.NEXT_PUBLIC_USE_MOCK;
	if (value === undefined || value === "") return true;
	return value !== "false" && value !== "0";
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
