"use client";

import { ActivityFeatureRoot } from "../components/ActivityFeatureRoot";
import { useActivityQuery } from "../queries/useActivityQuery";

/**
 * Feature-layer page scaffold for activity.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ActivityFeaturePage() {
	const { data, isLoading, isError, error } = useActivityQuery();

	return (
		<ActivityFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Activity</h2>
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
		</ActivityFeatureRoot>
	);
}
