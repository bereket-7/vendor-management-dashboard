import { vmsApi } from "@/features/shared/vms/api";
import type { ContractModel } from "@/features/shared/vms/types";
import { isLiveIntegrationEnabled, isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import type {
	ContractsCreateDto,
	ContractsUpdateDto,
} from "../dto/contractsDto";
import { contractDtoToModel } from "../mappers/contractCoreMappers";

function requireRecord<T>(record: T | null): T {
	if (!record) throw new Error("VMS record was not found");
	return record;
}

export async function listContracts(
	vendorId?: string
): Promise<ContractModel[]> {
	if (isMockEnabled()) return vmsApi.listContracts(vendorId);
	if (isLiveIntegrationEnabled()) {
		const page = await vendorCoreApi.listContracts(
			vendorId ? { vendor_id: vendorId } : undefined
		);
		return (page.results ?? []).map(contractDtoToModel);
	}
	return vmsApi.listContracts(vendorId);
}

export async function getContracts(id: string): Promise<ContractModel> {
	if (isLiveIntegrationEnabled() && !isMockEnabled()) {
		const dto = await vendorCoreApi.getContract(id);
		return contractDtoToModel(dto);
	}
	return requireRecord(await vmsApi.getContract(id));
}

export async function createContracts(
	input: ContractsCreateDto
): Promise<ContractModel> {
	if (isLiveIntegrationEnabled() && !isMockEnabled()) {
		const dto = await vendorCoreApi.createContract({
			vendor_id: input.vendorId,
			contract_number: input.number,
			title: input.title,
			contract_type: input.contractType ?? "master",
			effective_date: input.startDate,
			expiration_date: input.endDate || null,
			status: input.status,
			total_contract_value: input.value,
			currency: input.currency,
		});
		return contractDtoToModel(dto);
	}
	return vmsApi.createContract(input);
}

export async function updateContracts(
	id: string,
	patch: ContractsUpdateDto
): Promise<ContractModel> {
	if (isLiveIntegrationEnabled() && !isMockEnabled()) {
		const dto = await vendorCoreApi.updateContract(id, {
			...(patch.vendorId != null ? { vendor_id: patch.vendorId } : {}),
			...(patch.number != null ? { contract_number: patch.number } : {}),
			...(patch.title != null ? { title: patch.title } : {}),
			...(patch.contractType != null
				? { contract_type: patch.contractType }
				: {}),
			...(patch.startDate != null ? { effective_date: patch.startDate } : {}),
			...(patch.endDate != null ? { expiration_date: patch.endDate } : {}),
			...(patch.status != null ? { status: patch.status } : {}),
			...(patch.value != null ? { total_contract_value: patch.value } : {}),
			...(patch.currency != null ? { currency: patch.currency } : {}),
		});
		return contractDtoToModel(dto);
	}
	return requireRecord(await vmsApi.updateContract(id, patch));
}
