"use client";

import { SourcingFeatureRoot } from "../components/SourcingFeatureRoot";
import { useSourcingQuery } from "../queries/useSourcingQuery";

/**
 * Feature-layer page scaffold for sourcing.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function SourcingFeaturePage() {
	const { data, isLoading, isError, error } = useSourcingQuery();

	return (
		<SourcingFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Sourcing</h2>
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
		</SourcingFeatureRoot>
	);
}
