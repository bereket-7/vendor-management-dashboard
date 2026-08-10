import type { ApiReportsRecordDto } from "../../shared/dto/reportsRecordDto";

export type ApiReportsDto = ApiReportsRecordDto;

export type ReportsCreateDto = {
	name: string;
};

export type ReportsUpdateDto = Partial<ReportsCreateDto>;
