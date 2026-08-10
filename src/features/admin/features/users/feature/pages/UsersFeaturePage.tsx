"use client";

import { UsersFeatureRoot } from "../components/UsersFeatureRoot";
import { useUsersQuery } from "../queries/useUsersQuery";

/**
 * Feature-layer page scaffold for users.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function UsersFeaturePage() {
	const { data, isLoading, isError, error } = useUsersQuery();

	return (
		<UsersFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Users</h2>
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
		</UsersFeatureRoot>
	);
}
