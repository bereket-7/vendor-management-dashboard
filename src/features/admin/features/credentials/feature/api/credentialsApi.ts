import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { CredentialDto } from "@/lib/vendor-core/types";

import type { CredentialsCreateDto } from "../dto/credentialsDto";

export async function listCredentials(): Promise<CredentialDto[]> {
	const page = await vendorCoreApi.listCredentials();
	return page.results ?? [];
}

export async function getCredentials(id: string): Promise<CredentialDto> {
	return vendorCoreApi.getCredential(id);
}

export async function createCredentials(
	input: CredentialsCreateDto
): Promise<CredentialDto> {
	return vendorCoreApi.createCredential(input);
}

export async function updateCredentials(
	id: string,
	input: Record<string, unknown>
): Promise<CredentialDto> {
	return vendorCoreApi.updateCredential(id, input);
}

export async function deleteCredentials(id: string): Promise<void> {
	await vendorCoreApi.deleteCredential(id);
}

export async function restoreCredentials(id: string): Promise<CredentialDto> {
	return vendorCoreApi.restoreCredential(id);
}

export async function hardDeleteCredentials(id: string): Promise<void> {
	await vendorCoreApi.hardDeleteCredential(id);
}
