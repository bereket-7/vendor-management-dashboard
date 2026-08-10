"use client";

import { ClaimEncounterFeatureRoot } from "../components/ClaimEncounterFeatureRoot";
import { useClaimEncounterQuery } from "../queries/useClaimEncounterQuery";

/**
 * Feature-layer page scaffold for claim-encounter.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ClaimEncounterFeaturePage() {
	const { data, isLoading, isError, error } = useClaimEncounterQuery();

	return (
		<ClaimEncounterFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">ClaimEncounter</h2>
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
		</ClaimEncounterFeatureRoot>
	);
}
