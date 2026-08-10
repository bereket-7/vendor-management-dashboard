"use client";

import { OnboardingFeatureRoot } from "../components/OnboardingFeatureRoot";
import { useOnboardingQuery } from "../queries/useOnboardingQuery";

/**
 * Feature-layer page scaffold for onboarding.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function OnboardingFeaturePage() {
	const { data, isLoading, isError, error } = useOnboardingQuery();

	return (
		<OnboardingFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Onboarding</h2>
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
		</OnboardingFeatureRoot>
	);
}
