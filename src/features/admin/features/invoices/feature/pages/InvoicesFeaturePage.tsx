"use client";

import { InvoicesFeatureRoot } from "../components/InvoicesFeatureRoot";
import { useInvoicesQuery } from "../queries/useInvoicesQuery";

/**
 * Feature-layer page scaffold for invoices.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function InvoicesFeaturePage() {
	const { data, isLoading, isError, error } = useInvoicesQuery();

	return (
		<InvoicesFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Invoices</h2>
				{isLoading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : isError ? (
					<p className="text-sm text-destructive">
						{error instanceof Error ? error.message : "Failed to load"}
					</p>
				) : (
					<p className="text-sm text-muted-foreground">
						{data?.total ?? 0} record(s) from API layer
					</p>
				)}
			</div>
		</InvoicesFeatureRoot>
	);
}
