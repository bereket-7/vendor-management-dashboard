import type { ReactNode } from "react";

/** Feature-layer shell for audit-trail. Compose feature pages/components here. */
export function AuditTrailFeatureRoot({ children }: { children?: ReactNode }) {
	return <>{children}</>;
}
