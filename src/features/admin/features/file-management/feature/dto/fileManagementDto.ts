import type { ApiFileManagementRecordDto } from "../../shared/dto/fileManagementRecordDto";

export type ApiFileManagementDto = ApiFileManagementRecordDto;

export type FileManagementCreateDto = {
	name: string;
};

export type FileManagementUpdateDto = Partial<FileManagementCreateDto>;
