import type { ReactNode } from "react";

/** Feature-layer shell for integration-intake. Compose feature pages/components here. */
export function IntegrationIntakeFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
