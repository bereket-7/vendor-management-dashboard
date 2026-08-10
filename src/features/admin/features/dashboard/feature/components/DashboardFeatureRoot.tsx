import type { ReactNode } from "react";

/** Feature-layer shell for dashboard. Compose feature pages/components here. */
export function DashboardFeatureRoot({ children }: { children?: ReactNode }) {
	return <>{children}</>;
}
