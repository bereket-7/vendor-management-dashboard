"use client";

import { DashboardFeatureRoot } from "../components/DashboardFeatureRoot";
import { useDashboardQuery } from "../queries/useDashboardQuery";

/**
 * Feature-layer page scaffold for dashboard.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function DashboardFeaturePage() {
	const { data, isLoading, isError, error } = useDashboardQuery();

	return (
		<DashboardFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Dashboard</h2>
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
		</DashboardFeatureRoot>
	);
}
