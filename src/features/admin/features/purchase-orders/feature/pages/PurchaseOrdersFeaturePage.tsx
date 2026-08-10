"use client";

import { PurchaseOrdersFeatureRoot } from "../components/PurchaseOrdersFeatureRoot";
import { usePurchaseOrdersQuery } from "../queries/usePurchaseOrdersQuery";

/**
 * Feature-layer page scaffold for purchase-orders.
 * Route pages under `pages/` can adopt this once wired to the API.
 */
export function PurchaseOrdersFeaturePage() {
	const { data, isLoading, isError, error } = usePurchaseOrdersQuery();

	return (
		<PurchaseOrdersFeatureRoot>
			<div className="space-y-4">
				<h2 className="text-sm font-semibold tracking-tight">PurchaseOrders</h2>
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
		</PurchaseOrdersFeatureRoot>
	);
}
