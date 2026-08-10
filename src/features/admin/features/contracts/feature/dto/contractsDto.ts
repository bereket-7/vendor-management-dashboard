import type { ApiContractsRecordDto } from "../../shared/dto/contractsRecordDto";

export type ApiContractsDto = ApiContractsRecordDto;

export type ContractsCreateDto = {
	name: string;
};

export type ContractsUpdateDto = Partial<ContractsCreateDto>;
