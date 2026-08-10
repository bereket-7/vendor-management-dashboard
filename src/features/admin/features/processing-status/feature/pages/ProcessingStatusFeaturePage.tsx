"use client";

import { ProcessingStatusFeatureRoot } from "../components/ProcessingStatusFeatureRoot";
import { useProcessingStatusQuery } from "../queries/useProcessingStatusQuery";

/**
 * Feature-layer page scaffold for processing-status.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ProcessingStatusFeaturePage() {
	const { data, isLoading, isError, error } = useProcessingStatusQuery();

	return (
		<ProcessingStatusFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">
					ProcessingStatus
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
		</ProcessingStatusFeatureRoot>
	);
}
