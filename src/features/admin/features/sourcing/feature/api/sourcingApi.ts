import { vmsApi } from "@/features/shared/vms/api";
import type { BidModel, RfxModel } from "@/features/shared/vms/types";

import type { SourcingCreateDto, SourcingUpdateDto } from "../dto/sourcingDto";

function requireRecord<T>(record: T | null): T {
	if (!record) throw new Error("VMS record was not found");
	return record;
}

export async function listSourcing(): Promise<RfxModel[]> {
	return vmsApi.listRfx();
}

export async function getSourcing(id: string): Promise<RfxModel> {
	return requireRecord(await vmsApi.getRfx(id));
}

export async function listSourcingBids(rfxId?: string): Promise<BidModel[]> {
	return vmsApi.listBids(rfxId);
}

export async function createSourcing(
	input: SourcingCreateDto
): Promise<RfxModel> {
	return vmsApi.createRfx(input);
}

export async function updateSourcing(
	id: string,
	patch: SourcingUpdateDto
): Promise<RfxModel> {
	return requireRecord(await vmsApi.updateRfx(id, patch));
}

export async function awardSourcing(
	id: string,
	bidId: string
): Promise<RfxModel> {
	return vmsApi.awardRfx(id, bidId);
}

export async function submitSourcingBid(
	input: Omit<BidModel, "id" | "submittedAt" | "status">
): Promise<BidModel> {
	return vmsApi.submitBid(input);
}
