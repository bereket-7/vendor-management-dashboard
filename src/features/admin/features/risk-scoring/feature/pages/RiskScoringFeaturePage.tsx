"use client";

import { RiskScoringFeatureRoot } from "../components/RiskScoringFeatureRoot";
import { useRiskScoringQuery } from "../queries/useRiskScoringQuery";

/**
 * Feature-layer page scaffold for risk-scoring.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function RiskScoringFeaturePage() {
	const { data, isLoading, isError, error } = useRiskScoringQuery();

	return (
		<RiskScoringFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">RiskScoring</h2>
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
		</RiskScoringFeatureRoot>
	);
}
