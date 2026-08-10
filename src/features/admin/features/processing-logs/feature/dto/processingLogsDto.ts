import type { ApiProcessingLogsRecordDto } from "../../shared/dto/processingLogsRecordDto";

export type ApiProcessingLogsDto = ApiProcessingLogsRecordDto;

export type ProcessingLogsCreateDto = {
	name: string;
};

export type ProcessingLogsUpdateDto = Partial<ProcessingLogsCreateDto>;
