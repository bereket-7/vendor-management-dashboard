import type { ReactNode } from "react";

/** Feature-layer shell for file-management. Compose feature pages/components here. */
export function FileManagementFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
