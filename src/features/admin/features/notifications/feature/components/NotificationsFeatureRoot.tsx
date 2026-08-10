import type { ReactNode } from "react";

/** Feature-layer shell for notifications. Compose feature pages/components here. */
export function NotificationsFeatureRoot({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
}
