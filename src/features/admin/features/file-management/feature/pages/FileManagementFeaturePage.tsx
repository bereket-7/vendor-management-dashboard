"use client";

import { FileManagementFeatureRoot } from "../components/FileManagementFeatureRoot";
import { useFileManagementQuery } from "../queries/useFileManagementQuery";

/**
 * Feature-layer page scaffold for file-management.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function FileManagementFeaturePage() {
	const { data, isLoading, isError, error } = useFileManagementQuery();

	return (
		<FileManagementFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">FileManagement</h2>
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
		</FileManagementFeatureRoot>
	);
}
