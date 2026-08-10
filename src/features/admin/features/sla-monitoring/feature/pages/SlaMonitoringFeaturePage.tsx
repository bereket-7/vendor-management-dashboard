"use client";

import { SlaMonitoringFeatureRoot } from "../components/SlaMonitoringFeatureRoot";
import { useSlaMonitoringQuery } from "../queries/useSlaMonitoringQuery";

/**
 * Feature-layer page scaffold for sla-monitoring.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function SlaMonitoringFeaturePage() {
	const { data, isLoading, isError, error } = useSlaMonitoringQuery();

	return (
		<SlaMonitoringFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">SlaMonitoring</h2>
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
		</SlaMonitoringFeatureRoot>
	);
}
