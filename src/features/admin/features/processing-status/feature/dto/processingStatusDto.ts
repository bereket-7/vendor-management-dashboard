import type { ApiProcessingStatusRecordDto } from "../../shared/dto/processingStatusRecordDto";

export type ApiProcessingStatusDto = ApiProcessingStatusRecordDto;

export type ProcessingStatusCreateDto = {
	name: string;
};

export type ProcessingStatusUpdateDto = Partial<ProcessingStatusCreateDto>;
