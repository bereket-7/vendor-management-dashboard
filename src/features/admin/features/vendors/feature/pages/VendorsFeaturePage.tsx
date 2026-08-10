"use client";

import { VendorsFeatureRoot } from "../components/VendorsFeatureRoot";
import { useVendorsQuery } from "../queries/useVendorsQuery";

/**
 * Feature-layer page scaffold for vendors.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function VendorsFeaturePage() {
	const { data, isLoading, isError, error } = useVendorsQuery();

	return (
		<VendorsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Vendors</h2>
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
		</VendorsFeatureRoot>
	);
}
