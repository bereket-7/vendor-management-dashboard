"use client";

import { PerformanceFeatureRoot } from "../components/PerformanceFeatureRoot";
import { usePerformanceQuery } from "../queries/usePerformanceQuery";

/**
 * Feature-layer page scaffold for performance.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function PerformanceFeaturePage() {
	const { data, isLoading, isError, error } = usePerformanceQuery();

	return (
		<PerformanceFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Performance</h2>
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
		</PerformanceFeatureRoot>
	);
}
