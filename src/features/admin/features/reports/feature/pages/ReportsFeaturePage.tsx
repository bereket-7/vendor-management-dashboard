"use client";

import { ReportsFeatureRoot } from "../components/ReportsFeatureRoot";
import { useReportsQuery } from "../queries/useReportsQuery";

/**
 * Feature-layer page scaffold for reports.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ReportsFeaturePage() {
	const { data, isLoading, isError, error } = useReportsQuery();

	return (
		<ReportsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Reports</h2>
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
		</ReportsFeatureRoot>
	);
}
