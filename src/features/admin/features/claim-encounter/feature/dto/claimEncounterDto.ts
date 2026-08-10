import type { ApiClaimEncounterRecordDto } from "../../shared/dto/claimEncounterRecordDto";

export type ApiClaimEncounterDto = ApiClaimEncounterRecordDto;

export type ClaimEncounterCreateDto = {
	name: string;
};

export type ClaimEncounterUpdateDto = Partial<ClaimEncounterCreateDto>;
