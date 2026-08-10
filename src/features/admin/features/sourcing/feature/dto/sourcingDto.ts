import type { ApiSourcingRecordDto } from "../../shared/dto/sourcingRecordDto";

export type ApiSourcingDto = ApiSourcingRecordDto;

export type SourcingCreateDto = {
	name: string;
};

export type SourcingUpdateDto = Partial<SourcingCreateDto>;
