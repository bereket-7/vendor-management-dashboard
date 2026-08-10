"use client";

import { ProcessingLogsFeatureRoot } from "../components/ProcessingLogsFeatureRoot";
import { useProcessingLogsQuery } from "../queries/useProcessingLogsQuery";

/**
 * Feature-layer page scaffold for processing-logs.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ProcessingLogsFeaturePage() {
	const { data, isLoading, isError, error } = useProcessingLogsQuery();

	return (
		<ProcessingLogsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">ProcessingLogs</h2>
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
		</ProcessingLogsFeatureRoot>
	);
}
