import { vendorCoreApi } from "@/lib/vendor-core/api";
import type {
	ConnectionDto,
	ErrorRecordDto,
	IntakeJobDto,
	IntakeJobRunDto,
	MonitoringDashboardDto,
	VendorDto,
} from "@/lib/vendor-core/types";

export async function getIntegrationMonitoring(): Promise<MonitoringDashboardDto> {
	return vendorCoreApi.getMonitoring();
}

export async function listIntegrationConnections(
	vendorId?: string
): Promise<ConnectionDto[]> {
	const page = await vendorCoreApi.listConnections(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
}

export async function listIntegrationJobs(
	vendorId?: string
): Promise<IntakeJobDto[]> {
	const page = await vendorCoreApi.listIntakeJobs(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
}

export async function listIntegrationJobRuns(params?: {
	job_id?: string;
	stage?: string;
}): Promise<IntakeJobRunDto[]> {
	const page = await vendorCoreApi.listIntakeJobRuns(params);
	return page.results ?? [];
}

export async function listIntegrationErrors(
	status?: string
): Promise<ErrorRecordDto[]> {
	const page = await vendorCoreApi.listErrors(
		status && status !== "all" ? { status } : undefined
	);
	return page.results ?? [];
}

export async function listIntegrationVendors(): Promise<VendorDto[]> {
	const page = await vendorCoreApi.listVendors();
	return page.results ?? [];
}

export async function createIntegrationIntakeJob(
	body: Record<string, unknown>
) {
	return vendorCoreApi.createIntakeJob(body);
}

export async function updateIntegrationIntakeJob(
	id: string,
	body: Record<string, unknown>
) {
	return vendorCoreApi.updateIntakeJob(id, body);
}

export async function runIntegrationIntakeJob(id: string) {
	return vendorCoreApi.runIntakeJob(id);
}

export async function disableIntegrationIntakeJob(id: string) {
	return vendorCoreApi.disableIntakeJob(id);
}

export async function getIntakeCompletionSftp() {
	return vendorCoreApi.getIntakeCompletionSftp();
}

export async function getIntakeCompletionEdi() {
	return vendorCoreApi.getIntakeCompletionEdi();
}
