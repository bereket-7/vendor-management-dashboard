import { AUTH_PATHS } from "@/lib/auth/paths";

export type VendorInviteStatus = "pending" | "accepted" | "expired";

export type VendorInviteRecord = {
	token: string;
	vendorId: string;
	legalName: string;
	email: string;
	categories: string[];
	note?: string;
	expiresAt: string;
	status: VendorInviteStatus;
	createdAt: string;
	acceptedAt?: string;
};

export type CreateVendorInviteInput = {
	vendorId: string;
	legalName: string;
	email: string;
	categories: string[];
	note?: string;
	/** Days until expiry; default 14 */
	expiresInDays?: number;
};

const STORAGE_KEY = "tilla-vendor-invites-v1";
const DEFAULT_EXPIRY_DAYS = 14;

function canUseStorage() {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): VendorInviteRecord[] {
	if (!canUseStorage()) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as VendorInviteRecord[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeAll(invites: VendorInviteRecord[]) {
	if (!canUseStorage()) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(invites));
}

function refreshStatus(invite: VendorInviteRecord): VendorInviteRecord {
	if (invite.status === "accepted") return invite;
	if (new Date(invite.expiresAt).getTime() < Date.now()) {
		return { ...invite, status: "expired" };
	}
	return invite;
}

function randomToken() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID().replaceAll("-", "");
	}
	return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function buildAcceptPath(token: string) {
	return `${AUTH_PATHS.invite}?token=${encodeURIComponent(token)}`;
}

export function buildAcceptUrl(locale: string, token: string) {
	const path = `/${locale}${buildAcceptPath(token)}`;
	if (typeof window === "undefined") return path;
	return `${window.location.origin}${path}`;
}

export function createVendorInvite(
	input: CreateVendorInviteInput
): VendorInviteRecord {
	const now = new Date();
	const days = input.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
	const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

	const invite: VendorInviteRecord = {
		token: randomToken(),
		vendorId: input.vendorId,
		legalName: input.legalName.trim(),
		email: input.email.trim().toLowerCase(),
		categories: input.categories,
		note: input.note?.trim() || undefined,
		expiresAt: expiresAt.toISOString(),
		status: "pending",
		createdAt: now.toISOString(),
	};

	return persistVendorInvite(invite);
}

/** Persist an invite record (server-issued or client-generated). */
export function persistVendorInvite(
	invite: VendorInviteRecord
): VendorInviteRecord {
	const others = readAll().filter(
		(item) =>
			!(
				item.vendorId === invite.vendorId &&
				item.status === "pending" &&
				item.email === invite.email
			)
	);
	writeAll([invite, ...others]);
	return invite;
}

export function saveVendorInviteFromServer(input: {
	token: string;
	vendorId: string;
	legalName: string;
	email: string;
	categories: string[];
	expiresAt: string;
	note?: string;
	createdAt?: string;
}): VendorInviteRecord {
	const now = input.createdAt ?? new Date().toISOString();
	return persistVendorInvite({
		token: input.token,
		vendorId: input.vendorId,
		legalName: input.legalName.trim(),
		email: input.email.trim().toLowerCase(),
		categories: input.categories,
		note: input.note?.trim() || undefined,
		expiresAt: input.expiresAt,
		status: "pending",
		createdAt: now,
	});
}

export function getInviteByToken(token: string | null | undefined) {
	if (!token?.trim()) return null;
	const invite = readAll().find((item) => item.token === token.trim());
	if (!invite) return null;
	const refreshed = refreshStatus(invite);
	if (refreshed.status !== invite.status) {
		writeAll(
			readAll().map((item) =>
				item.token === refreshed.token ? refreshed : item
			)
		);
	}
	return refreshed;
}

export function getPendingInviteByVendorId(vendorId: string) {
	const matches = readAll()
		.map(refreshStatus)
		.filter((item) => item.vendorId === vendorId && item.status === "pending")
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	return matches[0] ?? null;
}

export function markInviteAccepted(token: string) {
	const invites = readAll();
	const index = invites.findIndex((item) => item.token === token);
	if (index < 0) return null;
	const current = refreshStatus(invites[index]!);
	if (current.status !== "pending") return current;
	const updated: VendorInviteRecord = {
		...current,
		status: "accepted",
		acceptedAt: new Date().toISOString(),
	};
	invites[index] = updated;
	writeAll(invites);
	return updated;
}

export function regenerateVendorInvite(
	input: CreateVendorInviteInput
): VendorInviteRecord {
	return createVendorInvite(input);
}

export type InviteResolveState =
	| { state: "missing" }
	| { state: "invalid" }
	| { state: "expired"; invite: VendorInviteRecord }
	| { state: "accepted"; invite: VendorInviteRecord }
	| { state: "valid"; invite: VendorInviteRecord };

export function resolveInviteToken(
	token: string | null | undefined
): InviteResolveState {
	if (!token?.trim()) return { state: "missing" };
	const invite = getInviteByToken(token);
	if (!invite) return { state: "invalid" };
	if (invite.status === "expired") return { state: "expired", invite };
	if (invite.status === "accepted") return { state: "accepted", invite };
	return { state: "valid", invite };
}
