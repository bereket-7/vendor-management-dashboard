import type { ApiFileHistoryRecordDto } from "../../shared/dto/fileHistoryRecordDto";

export type ApiFileHistoryDto = ApiFileHistoryRecordDto;

export type FileHistoryCreateDto = {
	name: string;
};

export type FileHistoryUpdateDto = Partial<FileHistoryCreateDto>;
