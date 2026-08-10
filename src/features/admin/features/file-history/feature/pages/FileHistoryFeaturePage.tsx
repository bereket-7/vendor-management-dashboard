"use client";

import { FileHistoryFeatureRoot } from "../components/FileHistoryFeatureRoot";
import { useFileHistoryQuery } from "../queries/useFileHistoryQuery";

/**
 * Feature-layer page scaffold for file-history.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function FileHistoryFeaturePage() {
	const { data, isLoading, isError, error } = useFileHistoryQuery();

	return (
		<FileHistoryFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">FileHistory</h2>
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
		</FileHistoryFeatureRoot>
	);
}
