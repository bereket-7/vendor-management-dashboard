const storageKey = (vendorId: string) => `vms:vendor-account-ids:${vendorId}`;

function readIds(vendorId: string): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.sessionStorage.getItem(storageKey(vendorId));
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
	} catch {
		return [];
	}
}

function writeIds(vendorId: string, ids: string[]): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(storageKey(vendorId), JSON.stringify(ids));
	} catch {
		// ignore quota / private mode
	}
}

/** Track account ids created in this browser when list API lags behind detail/create. */
export function rememberVendorAccountId(vendorId: string, accountId: string): void {
	const ids = readIds(vendorId);
	if (ids.includes(accountId)) return;
	writeIds(vendorId, [...ids, accountId]);
}

export function forgetVendorAccountId(vendorId: string, accountId: string): void {
	writeIds(
		vendorId,
		readIds(vendorId).filter((id) => id !== accountId)
	);
}

export function listRememberedVendorAccountIds(vendorId: string): string[] {
	return readIds(vendorId);
}
