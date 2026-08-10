"use client";

import { VmsFeatureRoot } from "../components/VmsFeatureRoot";
import { useVmsQuery } from "../queries/useVmsQuery";

/**
 * Feature-layer page scaffold for vms.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function VmsFeaturePage() {
	const { data, isLoading, isError, error } = useVmsQuery();

	return (
		<VmsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Vms</h2>
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
		</VmsFeatureRoot>
	);
}
