"use client";

import { ExportsFeatureRoot } from "../components/ExportsFeatureRoot";
import { useExportsQuery } from "../queries/useExportsQuery";

/**
 * Feature-layer page scaffold for exports.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function ExportsFeaturePage() {
	const { data, isLoading, isError, error } = useExportsQuery();

	return (
		<ExportsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Exports</h2>
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
		</ExportsFeatureRoot>
	);
}
