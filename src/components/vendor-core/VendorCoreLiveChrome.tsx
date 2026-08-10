"use client";

import { Loader2, RefreshCw } from "lucide-react";

import { useVendorCoreSession } from "@/components/vendor-core/VendorCoreGate";
import { Button } from "@/components/ui/button";
import { getVendorCoreBaseUrl } from "@/lib/vendor-core/client";
import { cn } from "@/lib/utils";

export function VendorCoreLiveChrome({
	title,
	subtitle,
	onRefresh,
	refreshing,
	children,
}: {
	title: string;
	subtitle?: string;
	onRefresh?: () => void;
	refreshing?: boolean;
	children: React.ReactNode;
}) {
	const { signOut } = useVendorCoreSession();

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						{subtitle ?? `Live from ${getVendorCoreBaseUrl()}`}
					</p>
				</div>
				<div className="flex gap-2">
					{onRefresh ? (
						<Button
							variant="outline"
							size="sm"
							onClick={onRefresh}
							disabled={refreshing}
						>
							<RefreshCw className={cn(refreshing && "animate-spin")} />
							Refresh
						</Button>
					) : null}
					<Button variant="ghost" size="sm" onClick={signOut}>
						Disconnect
					</Button>
				</div>
			</div>
			{children}
		</div>
	);
}

export function VendorCoreLoadingRow({ label = "Loading…" }: { label?: string }) {
	return (
		<div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
			<Loader2 className="size-4 animate-spin" />
			{label}
		</div>
	);
}

export function VendorCoreErrorBanner({ message }: { message: string }) {
	return (
		<div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
			{message}
		</div>
	);
}
