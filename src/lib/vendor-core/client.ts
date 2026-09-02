/**
 * HTTP client for services/vendor-management-core (Django JWT API).
 * Base URL: NEXT_PUBLIC_VENDOR_CORE_API_URL
 *
 * Live when mocks are off. Browser calls to a remote host go through
 * `/api/vendor-core/*` to avoid CORS.
 */
import { isLiveIntegrationEnabled } from "@/lib/mock-mode";

import {
	clearVendorCoreSessionCookie,
	setVendorCoreSessionCookie,
} from "./session-cookie";
import type { ApiEnvelope, MeResponseDto, MeUserDto, TokenPair } from "./types";

const ACCESS_KEY = "vendor_core_access_token";
const REFRESH_KEY = "vendor_core_refresh_token";
const BROWSER_PROXY_PREFIX = "/api/vendor-core";

export function getVendorCoreUpstreamUrl(): string {
	return (
		process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL ??
		"https://api.vm.tillahealth.com"
	).replace(/\/$/, "");
}

/** @deprecated Prefer getVendorCoreUpstreamUrl — kept for UI display */
export function getVendorCoreBaseUrl(): string {
	return getVendorCoreUpstreamUrl();
}

function isRemoteVendorCoreUrl(url: string): boolean {
	try {
		const host = new URL(url).hostname;
		return host !== "localhost" && host !== "127.0.0.1" && host !== "0.0.0.0";
	} catch {
		return false;
	}
}

/**
 * Vendor-core is live only when fixture mocks are off.
 * When USE_MOCK=true, all pages use local fixtures — no Django JWT required.
 */
export function isVendorCoreLive(): boolean {
	return isLiveIntegrationEnabled();
}

/** Use same-origin Next proxy when the browser would hit a remote Django host. */
function shouldUseBrowserProxy(): boolean {
	return (
		typeof window !== "undefined" &&
		isRemoteVendorCoreUrl(getVendorCoreUpstreamUrl())
	);
}

export function getStoredAccessToken(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(tokens: TokenPair) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(ACCESS_KEY, tokens.access);
	if (tokens.refresh) {
		window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
	} else {
		window.localStorage.removeItem(REFRESH_KEY);
	}
	setVendorCoreSessionCookie();
}

export function clearTokens() {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(ACCESS_KEY);
	window.localStorage.removeItem(REFRESH_KEY);
	clearVendorCoreSessionCookie();
}

export class VendorCoreApiError extends Error {
	status: number;
	body: unknown;
	code: string | null;

	constructor(message: string, status: number, body?: unknown) {
		super(message);
		this.name = "VendorCoreApiError";
		this.status = status;
		this.body = body;
		this.code = extractErrorCode(body);
	}
}

/** Flatten nested DRF / problem-details field errors for toasts. */
function flattenVendorCoreErrors(errors: unknown, prefix = ""): string | null {
	if (errors == null || errors === "") return null;
	if (typeof errors === "string")
		return prefix ? `${prefix}: ${errors}` : errors;
	if (Array.isArray(errors)) {
		const parts = errors
			.map((item) => flattenVendorCoreErrors(item, prefix))
			.filter(Boolean);
		return parts.length ? parts.join("; ") : null;
	}
	if (typeof errors === "object") {
		const parts: string[] = [];
		for (const [key, value] of Object.entries(
			errors as Record<string, unknown>
		)) {
			if (key === "_index") continue;
			const path =
				key === "non_field_errors" || key === "__all__"
					? prefix
					: prefix
						? `${prefix}.${key}`
						: key;
			const flat = flattenVendorCoreErrors(value, path);
			if (flat) parts.push(flat);
		}
		return parts.length ? parts.join("; ") : null;
	}
	return String(errors);
}

export function extractErrorCode(body: unknown): string | null {
	if (!body || typeof body !== "object") return null;
	const result = (body as { result?: { code?: unknown } }).result;
	if (result && typeof result === "object" && typeof result.code === "string") {
		return result.code;
	}
	const code = (body as { code?: unknown }).code;
	return typeof code === "string" ? code : null;
}

function parseJsonSafe(text: string): unknown {
	if (!text) return undefined;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}

function unwrapEnvelope<T>(data: unknown): T {
	if (data && typeof data === "object" && "result" in data) {
		return (data as ApiEnvelope<T>).result;
	}
	return data as T;
}

function parseTokenPair(data: unknown): TokenPair {
	const root = data as Record<string, unknown> | null | undefined;
	const nested =
		root && typeof root.result === "object" && root.result
			? (root.result as Record<string, unknown>)
			: null;
	const access = String(root?.access ?? nested?.access ?? "");
	const refreshRaw = root?.refresh ?? nested?.refresh;
	const refresh =
		typeof refreshRaw === "string" && refreshRaw ? refreshRaw : undefined;
	if (!access) {
		throw new VendorCoreApiError("Token response missing access", 500, data);
	}
	return { access, refresh };
}

type RequestOptions = RequestInit & {
	params?: Record<string, string | number | undefined | null>;
	auth?: boolean;
	raw?: boolean;
	/** Internal: skip refresh retry after one attempt */
	_retried?: boolean;
};

function buildUrl(path: string, params?: RequestOptions["params"]) {
	let normalized = path.startsWith("/") ? path : `/${path}`;
	// Next.js api routes 308-redirect trailing slashes; Django needs them upstream.
	// Strip here so the browser hits the proxy once; proxy re-adds before upstream fetch.
	if (shouldUseBrowserProxy() && normalized.endsWith("/")) {
		normalized = normalized.slice(0, -1);
	}
	const url = shouldUseBrowserProxy()
		? new URL(`${BROWSER_PROXY_PREFIX}${normalized}`, window.location.origin)
		: new URL(normalized, `${getVendorCoreUpstreamUrl()}/`);

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null || value === "") return;
			url.searchParams.set(key, String(value));
		});
	}
	return url.toString();
}

function errorMessageFromBody(data: unknown, fallback: string): string {
	const body = data as {
		result?: { detail?: string; errors?: unknown };
		detail?: string;
		message?: string;
	} | null;
	const fieldErrors = flattenVendorCoreErrors(body?.result?.errors);
	return (
		fieldErrors ||
		body?.result?.detail ||
		body?.message ||
		body?.detail ||
		fallback
	);
}

let refreshInFlight: Promise<TokenPair | null> | null = null;

/**
 * Rotate access (and refresh) via SimpleJWT. Returns null if refresh fails.
 */
export async function vendorCoreRefresh(): Promise<TokenPair | null> {
	const refresh = getStoredRefreshToken();
	if (!refresh) return null;

	if (refreshInFlight) return refreshInFlight;

	refreshInFlight = (async () => {
		try {
			const response = await fetch(
				buildUrl("/api/v1/authentication/token/refresh/"),
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refresh }),
				}
			);
			const data = parseJsonSafe(await response.text());
			if (!response.ok) {
				clearTokens();
				return null;
			}
			const tokens = parseTokenPair(data);
			// Rotation may omit refresh — keep previous if so
			storeTokens({
				access: tokens.access,
				refresh: tokens.refresh ?? refresh,
			});
			return {
				access: tokens.access,
				refresh: tokens.refresh ?? refresh,
			};
		} catch {
			clearTokens();
			return null;
		} finally {
			refreshInFlight = null;
		}
	})();

	return refreshInFlight;
}

export async function vendorCoreLogin(input: {
	username: string;
	password: string;
}): Promise<TokenPair> {
	const response = await fetch(buildUrl("/api/v1/authentication/token/"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const data = parseJsonSafe(await response.text());
	if (!response.ok) {
		throw new VendorCoreApiError(
			errorMessageFromBody(data, "Login failed"),
			response.status,
			data
		);
	}
	const tokens = parseTokenPair(data);
	storeTokens(tokens);
	return tokens;
}

export async function vendorCoreLogout(): Promise<void> {
	const refresh = getStoredRefreshToken();
	try {
		if (refresh) {
			await fetch(buildUrl("/api/v1/authentication/token/blacklist/"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refresh }),
			});
		}
	} catch {
		// Always clear local session even if blacklist fails
	} finally {
		clearTokens();
	}
}

export async function vendorCoreMe(): Promise<MeUserDto> {
	const result = await vendorCoreFetch<MeResponseDto>(
		"/api/v1/authentication/me/",
		{ auth: true }
	);
	if (!result?.user?.id) {
		throw new VendorCoreApiError("Invalid me response", 500, result);
	}
	return result.user;
}

export async function vendorCoreChangePassword(input: {
	current_password: string;
	new_password: string;
}): Promise<{ updated: boolean }> {
	return vendorCoreFetch<{ updated: boolean }>(
		"/api/v1/authentication/me/password/",
		{
			method: "POST",
			auth: true,
			body: JSON.stringify(input),
		}
	);
}

/** Public — request email OTP (always returns sent=true). */
export async function vendorCorePasswordResetRequest(input: {
	email: string;
}): Promise<{ sent: boolean }> {
	return vendorCoreFetch<{ sent: boolean }>(
		"/api/v1/authentication/password-reset/request/",
		{
			method: "POST",
			auth: false,
			body: JSON.stringify(input),
		}
	);
}

/** Public — validate OTP from email and set a new password. */
export async function vendorCorePasswordResetConfirm(input: {
	email: string;
	otp: string;
	new_password: string;
}): Promise<{ password_set: boolean }> {
	return vendorCoreFetch<{ password_set: boolean }>(
		"/api/v1/authentication/password-reset/confirm/",
		{
			method: "POST",
			auth: false,
			body: JSON.stringify(input),
		}
	);
}

export async function vendorCoreFetch<T>(
	path: string,
	options: RequestOptions = {}
): Promise<T> {
	const {
		params,
		auth = true,
		raw = false,
		headers,
		_retried = false,
		...init
	} = options;
	const isFormData =
		typeof FormData !== "undefined" && init.body instanceof FormData;
	const reqHeaders: HeadersInit = {
		Accept: "application/json",
		...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
		...headers,
	};
	if (isFormData && reqHeaders && typeof reqHeaders === "object") {
		delete (reqHeaders as Record<string, string>)["Content-Type"];
	}
	if (auth) {
		const token = getStoredAccessToken();
		if (token) {
			(reqHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
		}
	}

	const response = await fetch(buildUrl(path, params), {
		...init,
		cache: "no-store",
		headers: reqHeaders,
	});

	const data = parseJsonSafe(await response.text());

	// #region agent log
	if (path.includes("/accounts/")) {
		fetch("http://127.0.0.1:7619/ingest/2f252828-01b8-43ea-88bb-1263f3c1d386", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Debug-Session-Id": "6ffff2",
			},
			body: JSON.stringify({
				sessionId: "6ffff2",
				runId: "pre-fix",
				hypothesisId: "H4",
				location: "client.ts:vendorCoreFetch:accounts",
				message: "accounts API response",
				data: {
					path,
					method: init.method ?? "GET",
					status: response.status,
					url: buildUrl(path, params),
					resultCount:
						data &&
						typeof data === "object" &&
						"result" in data &&
						data.result &&
						typeof data.result === "object" &&
						"results" in data.result &&
						Array.isArray((data.result as { results?: unknown[] }).results)
							? (data.result as { results: unknown[] }).results.length
							: null,
				},
				timestamp: Date.now(),
			}),
		}).catch(() => {});
	}
	// #endregion

	if (
		response.status === 401 &&
		auth &&
		!_retried &&
		!path.includes("/authentication/token/")
	) {
		const refreshed = await vendorCoreRefresh();
		if (refreshed) {
			return vendorCoreFetch<T>(path, { ...options, _retried: true });
		}
		throw new VendorCoreApiError(
			errorMessageFromBody(data, "Session expired"),
			401,
			data
		);
	}

	if (!response.ok) {
		const err = new VendorCoreApiError(
			errorMessageFromBody(data, `Request failed (${response.status})`),
			response.status,
			data
		);
		if (
			typeof window !== "undefined" &&
			err.status === 403 &&
			err.code === "password_reset_required" &&
			!path.includes("/authentication/me")
		) {
			const locale = window.location.pathname.split("/")[1] || "en";
			window.location.assign(`/${locale}/auth/change-password`);
		}
		throw err;
	}

	if (raw) {
		return data as T;
	}

	return unwrapEnvelope<T>(data);
}

export type VendorCoreBlobResult = {
	blob: Blob;
	contentType: string;
	filename?: string;
};

function parseContentDispositionFilename(
	header: string | null
): string | undefined {
	if (!header) return undefined;
	const star = header.match(/filename\*=UTF-8''([^;]+)/i);
	if (star?.[1]) {
		try {
			return decodeURIComponent(star[1].trim());
		} catch {
			return star[1].trim();
		}
	}
	const plain = header.match(/filename="?([^";]+)"?/i);
	return plain?.[1]?.trim();
}

/** Binary download (CSV/PDF/HTML) — skips JSON envelope parsing. */
export async function vendorCoreFetchBlob(
	path: string,
	options: RequestOptions = {}
): Promise<VendorCoreBlobResult> {
	const { params, auth = true, headers, _retried = false, ...init } = options;
	const reqHeaders: HeadersInit = {
		Accept: "*/*",
		...headers,
	};
	if (auth) {
		const token = getStoredAccessToken();
		if (token) {
			(reqHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
		}
	}

	const response = await fetch(buildUrl(path, params), {
		...init,
		cache: "no-store",
		headers: reqHeaders,
	});

	if (
		response.status === 401 &&
		auth &&
		!_retried &&
		!path.includes("/authentication/token/")
	) {
		const refreshed = await vendorCoreRefresh();
		if (refreshed) {
			return vendorCoreFetchBlob(path, { ...options, _retried: true });
		}
		const data = parseJsonSafe(await response.text());
		throw new VendorCoreApiError(
			errorMessageFromBody(data, "Session expired"),
			401,
			data
		);
	}

	if (!response.ok) {
		const data = parseJsonSafe(await response.text());
		throw new VendorCoreApiError(
			errorMessageFromBody(data, `Request failed (${response.status})`),
			response.status,
			data
		);
	}

	const blob = await response.blob();
	return {
		blob,
		contentType: response.headers.get("content-type") ?? blob.type,
		filename: parseContentDispositionFilename(
			response.headers.get("content-disposition")
		),
	};
}
