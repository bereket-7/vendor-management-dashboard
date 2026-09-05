import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { onboardingEndpoints } from "../../onboarding-endpoints";
import type { ApiOnboardingRecordDto } from "../dto/onboardingRecordDto";

export { onboardingEndpoints };

export type OnboardingListResponse = {
	results?: ApiOnboardingRecordDto[] | null;
	count?: number | null;
};

export async function listOnboardingRecords(params?: Record<string, string>) {
	if (isVendorCoreLive()) {
		const page = await vendorCoreApi.listOnboardingCases({
			limit: 100,
			status: params?.status,
			vendor_id: params?.vendor_id,
		});
		return { results: page.results ?? [], count: page.count ?? 0 };
	}
	return { results: [], count: 0 };
}

export async function getOnboardingRecord(id: string) {
	if (isVendorCoreLive()) {
		return vendorCoreApi.getOnboardingCase(id);
	}
	throw new Error("Onboarding detail requires the live API.");
}
