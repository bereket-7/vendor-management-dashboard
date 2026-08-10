"use client";

import { ComplianceFeatureRoot } from "../components/ComplianceFeatureRoot";
import { useComplianceQuery } from "../queries/useComplianceQuery";

/**
 * Feature-layer page scaffold for compliance.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ComplianceFeaturePage() {
	const { data, isLoading, isError, error } = useComplianceQuery();

	return (
		<ComplianceFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Compliance</h2>
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
		</ComplianceFeatureRoot>
	);
}
