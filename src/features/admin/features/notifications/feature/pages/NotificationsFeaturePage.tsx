"use client";

import { NotificationsFeatureRoot } from "../components/NotificationsFeatureRoot";
import { useNotificationsQuery } from "../queries/useNotificationsQuery";

/**
 * Feature-layer page scaffold for notifications.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function NotificationsFeaturePage() {
	const { data, isLoading, isError, error } = useNotificationsQuery();

	return (
		<NotificationsFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
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
		</NotificationsFeatureRoot>
	);
}
