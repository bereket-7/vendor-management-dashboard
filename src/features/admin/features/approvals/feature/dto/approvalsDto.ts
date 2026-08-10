import type { ApiApprovalsRecordDto } from "../../shared/dto/approvalsRecordDto";

export type ApiApprovalsDto = ApiApprovalsRecordDto;

export type ApprovalsCreateDto = {
	name: string;
};

export type ApprovalsUpdateDto = Partial<ApprovalsCreateDto>;
