"use client";

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	clearTokens,
	getStoredAccessToken,
	getVendorCoreBaseUrl,
	isVendorCoreLive,
	vendorCoreLogin,
} from "@/lib/vendor-core/client";

export type VendorCoreSessionValue = {
	live: boolean;
	authed: boolean;
	loading: boolean;
	bootstrapping: boolean;
	error: string | null;
	signIn: (username: string, password: string) => Promise<void>;
	signOut: () => void;
	markUnauthed: () => void;
};

const VendorCoreSessionContext = createContext<VendorCoreSessionValue | null>(
	null
);

export function useVendorCoreSession(): VendorCoreSessionValue {
	const ctx = useContext(VendorCoreSessionContext);
	if (!ctx) {
		throw new Error(
			"useVendorCoreSession must be used within VendorCoreSessionProvider"
		);
	}
	return ctx;
}

/** Safe when provider is missing (e.g. outside admin). */
export function useVendorCoreSessionOptional(): VendorCoreSessionValue | null {
	return useContext(VendorCoreSessionContext);
}

/**
 * App-wide vendor-core JWT session. Wrap the admin shell so dashboard /
 * shared queries can call the remote API after one login.
 */
export function VendorCoreSessionProvider({
	children,
}: {
	children: ReactNode;
}) {
	const live = isVendorCoreLive();
	const [authed, setAuthed] = useState(false);
	const [loading, setLoading] = useState(false);
	const [bootstrapping, setBootstrapping] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!live) {
			setBootstrapping(false);
			return;
		}
		setAuthed(Boolean(getStoredAccessToken()));
		setBootstrapping(false);
	}, [live]);

	const signIn = useCallback(async (user: string, pass: string) => {
		setLoading(true);
		setError(null);
		try {
			await vendorCoreLogin({ username: user, password: pass });
			setAuthed(true);
		} catch (err) {
			setAuthed(false);
			setError(err instanceof Error ? err.message : "Login failed");
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const signOut = useCallback(() => {
		clearTokens();
		setAuthed(false);
		setError(null);
	}, []);

	const markUnauthed = useCallback(() => {
		clearTokens();
		setAuthed(false);
	}, []);

	const value = useMemo(
		() => ({
			live,
			authed,
			loading,
			bootstrapping,
			error,
			signIn,
			signOut,
			markUnauthed,
		}),
		[live, authed, loading, bootstrapping, error, signIn, signOut, markUnauthed]
	);

	return (
		<VendorCoreSessionContext.Provider value={value}>
			{children}
		</VendorCoreSessionContext.Provider>
	);
}

/** Compact sign-in strip when live data needs a Django JWT. */
export function VendorCoreAuthBanner() {
	const session = useVendorCoreSessionOptional();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [open, setOpen] = useState(true);

	if (!session?.live || session.bootstrapping || session.authed || !open) {
		return null;
	}

	return (
		<div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3">
			<form
				className="mx-auto flex max-w-4xl flex-wrap items-end gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					void session.signIn(username, password).catch(() => undefined);
				}}
			>
				<div className="min-w-[12rem] flex-1">
					<p className="text-sm font-medium text-foreground">
						Connect to vendor-core API
					</p>
					<p className="text-muted-foreground text-xs">
						{getVendorCoreBaseUrl()} — required to load remote vendors &amp;
						files
					</p>
				</div>
				<Input
					className="h-9 w-36 bg-background"
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					autoComplete="username"
					required
				/>
				<Input
					className="h-9 w-36 bg-background"
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="current-password"
					required
				/>
				<Button type="submit" size="sm" disabled={session.loading}>
					{session.loading ? (
						<>
							<Loader2 className="animate-spin" /> Connecting…
						</>
					) : (
						"Connect"
					)}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={() => setOpen(false)}
				>
					Dismiss
				</Button>
				{session.error ? (
					<p className="basis-full text-sm text-destructive">{session.error}</p>
				) : null}
			</form>
		</div>
	);
}

export function VendorCoreGate({
	children,
	title = "Vendor Core API",
	description,
}: {
	children: ReactNode;
	title?: string;
	description?: string;
}) {
	const session = useVendorCoreSessionOptional();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	// Standalone gate when provider is absent (shouldn't happen in admin)
	const live = session?.live ?? isVendorCoreLive();
	const authed = session?.authed ?? false;
	const loading = session?.loading ?? false;
	const bootstrapping = session?.bootstrapping ?? false;
	const error = session?.error ?? null;
	const signIn = session?.signIn;

	if (!live) {
		return (
			<div className="space-y-4 p-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						{description ??
							"Point NEXT_PUBLIC_VENDOR_CORE_API_URL at the deployed Django API to enable live integration data."}
					</p>
				</div>
				<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
					{`NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_VENDOR_CORE_API_URL=https://api.vm.tillahealth.com
NEXT_PUBLIC_DEV_ADMIN=true`}
				</pre>
			</div>
		);
	}

	if (bootstrapping) {
		return (
			<div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
				<Loader2 className="size-4 animate-spin" />
				Connecting…
			</div>
		);
	}

	if (!authed) {
		return (
			<div className="mx-auto flex max-w-md flex-col gap-4 p-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Sign in to {getVendorCoreBaseUrl()}
					</p>
				</div>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						void signIn?.(username, password).catch(() => undefined);
					}}
				>
					<Input
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
						required
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
					/>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
					<Button type="submit" disabled={loading || !signIn} className="w-full">
						{loading ? (
							<>
								<Loader2 className="animate-spin" /> Connecting…
							</>
						) : (
							"Connect"
						)}
					</Button>
				</form>
			</div>
		);
	}

	return <>{children}</>;
}
