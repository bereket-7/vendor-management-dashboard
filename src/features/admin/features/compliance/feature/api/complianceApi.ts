import { vmsApi } from "@/features/shared/vms/api";
import type { CertificateModel } from "@/features/shared/vms/types";

export async function listCompliance(): Promise<CertificateModel[]> {
	return vmsApi.listCertificates();
}

export async function seedCompliance() {
	return vmsApi.seedCertificates();
}

export type CertificateApiStatus =
	| "valid"
	| "revoked"
	| "expired"
	| "expiring_soon"
	| "pending_verification";

export async function updateCompliance(
	id: string,
	status: CertificateApiStatus
): Promise<CertificateModel> {
	return vmsApi.updateCertificate(id, { status });
}
