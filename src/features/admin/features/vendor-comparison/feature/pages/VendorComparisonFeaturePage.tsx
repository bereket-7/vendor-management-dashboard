"use client";

import { VendorComparisonFeatureRoot } from "../components/VendorComparisonFeatureRoot";
import { useVendorComparisonQuery } from "../queries/useVendorComparisonQuery";

/**
 * Feature-layer page scaffold for vendor-comparison.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function VendorComparisonFeaturePage() {
	const { data, isLoading, isError, error } = useVendorComparisonQuery();

	return (
		<VendorComparisonFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">
					VendorComparison
				</h2>
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
		</VendorComparisonFeatureRoot>
	);
}
