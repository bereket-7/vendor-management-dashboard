"use client";

import { SettingsFeatureRoot } from "../components/SettingsFeatureRoot";
import { useSettingsQuery } from "../queries/useSettingsQuery";

/**
 * Feature-layer page scaffold for settings.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function SettingsFeaturePage() {
	const { data, isLoading, isError, error } = useSettingsQuery();

	return (
		<SettingsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Settings</h2>
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
		</SettingsFeatureRoot>
	);
}
