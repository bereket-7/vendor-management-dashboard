import type { ReactNode } from "react";

/** Feature-layer shell for purchase-orders. Compose feature pages/components here. */
export function PurchaseOrdersFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
