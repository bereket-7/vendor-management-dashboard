"use client";

import { IntegrationIntakeFeatureRoot } from "../components/IntegrationIntakeFeatureRoot";
import { useIntegrationIntakeQuery } from "../queries/useIntegrationIntakeQuery";

/**
 * Feature-layer page scaffold for integration-intake.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function IntegrationIntakeFeaturePage() {
	const { data, isLoading, isError, error } = useIntegrationIntakeQuery();

	return (
		<IntegrationIntakeFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">
					IntegrationIntake
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
		</IntegrationIntakeFeatureRoot>
	);
}
