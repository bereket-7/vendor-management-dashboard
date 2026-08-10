import type { ReactNode } from "react";

/** Feature-layer shell for claim-encounter. Compose feature pages/components here. */
export function ClaimEncounterFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
