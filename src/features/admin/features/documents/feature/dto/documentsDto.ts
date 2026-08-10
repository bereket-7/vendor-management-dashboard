import type { ApiDocumentsRecordDto } from "../../shared/dto/documentsRecordDto";

export type ApiDocumentsDto = ApiDocumentsRecordDto;

export type DocumentsCreateDto = {
	name: string;
};

export type DocumentsUpdateDto = Partial<DocumentsCreateDto>;
