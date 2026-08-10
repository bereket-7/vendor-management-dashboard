import type { ApiExportsRecordDto } from "../../shared/dto/exportsRecordDto";

export type ApiExportsDto = ApiExportsRecordDto;

export type ExportsCreateDto = {
	name: string;
};

export type ExportsUpdateDto = Partial<ExportsCreateDto>;
