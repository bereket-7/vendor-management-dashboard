/** Local-only mock auth — no NestJS / Better Auth required. */
import { isMockEnabled } from "@/lib/mock-mode";

export const MOCK_ADMIN_USER = {
	id: "mock-admin",
	email: "admin@tilla.local",
	name: "Admin User",
	role: "admin",
	roles: ["admin"],
	image: null as string | null,
};

/**
 * App-shell session without NestJS.
 * - Full mocks on (`NEXT_PUBLIC_USE_MOCK=true`) — skips Nest login entirely, or
 * - Dev admin bypass (`NEXT_PUBLIC_DEV_ADMIN=true`) for remote vendor-core without Nest.
 */
export function isMockAuthEnabled(): boolean {
	if (isMockEnabled()) return true;
	return process.env.NEXT_PUBLIC_DEV_ADMIN === "true";
}
