"use client";

import { RolesFeatureRoot } from "../components/RolesFeatureRoot";
import { useRolesQuery } from "../queries/useRolesQuery";

/**
 * Feature-layer page scaffold for roles.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function RolesFeaturePage() {
	const { data, isLoading, isError, error } = useRolesQuery();

	return (
		<RolesFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Roles</h2>
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
		</RolesFeatureRoot>
	);
}
