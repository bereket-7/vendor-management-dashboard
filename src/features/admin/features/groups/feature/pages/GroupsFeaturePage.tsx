"use client";

import { GroupsFeatureRoot } from "../components/GroupsFeatureRoot";
import { useGroupsQuery } from "../queries/useGroupsQuery";

/**
 * Feature-layer page scaffold for groups.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function GroupsFeaturePage() {
	const { data, isLoading, isError, error } = useGroupsQuery();

	return (
		<GroupsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Groups</h2>
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
		</GroupsFeatureRoot>
	);
}
