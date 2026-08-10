"use client";

import { ErrorManagementFeatureRoot } from "../components/ErrorManagementFeatureRoot";
import { useErrorManagementQuery } from "../queries/useErrorManagementQuery";

/**
 * Feature-layer page scaffold for error-management.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ErrorManagementFeaturePage() {
	const { data, isLoading, isError, error } = useErrorManagementQuery();

	return (
		<ErrorManagementFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">
					ErrorManagement
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
		</ErrorManagementFeatureRoot>
	);
}
