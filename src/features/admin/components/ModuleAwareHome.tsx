"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPage } from "@/features/admin/features/dashboard/pages/DashboardPage";
import { useRouter } from "@/i18n/navigation";
import {
	MODULE_HOME_HREF,
	useAdminModuleStore,
} from "@/stores/admin-module-store";

/**
 * Locale home (`/en`) — vendor dashboard only for vendor_management module.
 * Other modules redirect to their configured home route.
 */
export function ModuleAwareHome() {
	const router = useRouter();
	const moduleId = useAdminModuleStore((state) => state.moduleId);
	const homeHref = MODULE_HOME_HREF[moduleId];
	const [hydrated, setHydrated] = useState(() =>
		useAdminModuleStore.persist.hasHydrated()
	);

	useEffect(() => {
		if (hydrated) return;
		return useAdminModuleStore.persist.onFinishHydration(() => {
			setHydrated(true);
		});
	}, [hydrated]);

	useEffect(() => {
		if (!hydrated) return;
		if (homeHref !== "/") {
			router.replace(homeHref);
		}
	}, [hydrated, homeHref, router]);

	if (!hydrated || homeHref !== "/") {
		return <Skeleton className="h-64 w-full rounded-sm" />;
	}

	return <DashboardPage />;
}
