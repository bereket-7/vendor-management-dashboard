import type { ApiVmsRecordDto } from "../../shared/dto/vmsRecordDto";

export type ApiVmsDto = ApiVmsRecordDto;

export type VmsCreateDto = {
	name: string;
};

export type VmsUpdateDto = Partial<VmsCreateDto>;
