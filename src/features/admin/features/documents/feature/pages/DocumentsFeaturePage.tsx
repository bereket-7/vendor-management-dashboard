"use client";

import { DocumentsFeatureRoot } from "../components/DocumentsFeatureRoot";
import { useDocumentsQuery } from "../queries/useDocumentsQuery";

/**
 * Feature-layer page scaffold for documents.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function DocumentsFeaturePage() {
	const { data, isLoading, isError, error } = useDocumentsQuery();

	return (
		<DocumentsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Documents</h2>
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
		</DocumentsFeatureRoot>
	);
}
