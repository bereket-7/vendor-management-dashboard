"use client";

import { SchedulesFeatureRoot } from "../components/SchedulesFeatureRoot";
import { useSchedulesQuery } from "../queries/useSchedulesQuery";

/**
 * Feature-layer page scaffold for schedules.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function SchedulesFeaturePage() {
	const { data, isLoading, isError, error } = useSchedulesQuery();

	return (
		<SchedulesFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Schedules</h2>
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
		</SchedulesFeatureRoot>
	);
}
