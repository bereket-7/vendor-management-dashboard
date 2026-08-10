"use client";

import { CategoriesFeatureRoot } from "../components/CategoriesFeatureRoot";
import { useCategoriesQuery } from "../queries/useCategoriesQuery";

/**
 * Feature-layer page scaffold for categories.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function CategoriesFeaturePage() {
	const { data, isLoading, isError, error } = useCategoriesQuery();

	return (
		<CategoriesFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Categories</h2>
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
		</CategoriesFeatureRoot>
	);
}
