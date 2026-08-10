import type { ReactNode } from "react";

/** Feature-layer shell for sla-monitoring. Compose feature pages/components here. */
export function SlaMonitoringFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
