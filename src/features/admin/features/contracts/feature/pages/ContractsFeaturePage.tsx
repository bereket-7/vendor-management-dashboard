"use client";

import { ContractsFeatureRoot } from "../components/ContractsFeatureRoot";
import { useContractsQuery } from "../queries/useContractsQuery";

/**
 * Feature-layer page scaffold for contracts.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ContractsFeaturePage() {
	const { data, isLoading, isError, error } = useContractsQuery();

	return (
		<ContractsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Contracts</h2>
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
		</ContractsFeatureRoot>
	);
}
