import { defaultLocale } from "@/i18n/config";
import { localePath } from "@/lib/routes";
import { MODULE_HOME_HREF } from "@/stores/admin-module-store";
import type { AdminModuleId } from "@/types/UI/system.types";

const ADMIN_MODULE_STORAGE_KEY = "adminModule:v2";
const DEFAULT_MODULE_ID: AdminModuleId = "eligibility_operations";

export function getModuleHomeHref(moduleId: AdminModuleId): string {
	return MODULE_HOME_HREF[moduleId];
}

export function readPersistedModuleId(): AdminModuleId {
	if (typeof window === "undefined") {
		return DEFAULT_MODULE_ID;
	}

	try {
		const raw = localStorage.getItem(ADMIN_MODULE_STORAGE_KEY);
		if (!raw) return DEFAULT_MODULE_ID;

		const parsed = JSON.parse(raw) as {
			state?: { moduleId?: AdminModuleId };
		};
		const moduleId = parsed.state?.moduleId;
		if (moduleId && MODULE_HOME_HREF[moduleId]) {
			return moduleId;
		}
	} catch {
		// ignore corrupt storage
	}

	return DEFAULT_MODULE_ID;
}

export function getPostLoginPath(locale: string = defaultLocale): string {
	return localePath(locale, getModuleHomeHref(readPersistedModuleId()));
}
