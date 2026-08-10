"use client";

import { AuditTrailFeatureRoot } from "../components/AuditTrailFeatureRoot";
import { useAuditTrailQuery } from "../queries/useAuditTrailQuery";

/**
 * Feature-layer page scaffold for audit-trail.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function AuditTrailFeaturePage() {
	const { data, isLoading, isError, error } = useAuditTrailQuery();

	return (
		<AuditTrailFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">AuditTrail</h2>
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
		</AuditTrailFeatureRoot>
	);
}
