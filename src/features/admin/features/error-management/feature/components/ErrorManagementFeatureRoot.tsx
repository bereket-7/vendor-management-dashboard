import type { ReactNode } from "react";

/** Feature-layer shell for error-management. Compose feature pages/components here. */
export function ErrorManagementFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
