"use client";

import { ApprovalsFeatureRoot } from "../components/ApprovalsFeatureRoot";
import { useApprovalsQuery } from "../queries/useApprovalsQuery";

/**
 * Feature-layer page scaffold for approvals.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ApprovalsFeaturePage() {
	const { data, isLoading, isError, error } = useApprovalsQuery();

	return (
		<ApprovalsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Approvals</h2>
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
		</ApprovalsFeatureRoot>
	);
}
