import type { ApiPerformanceRecordDto } from "../../shared/dto/performanceRecordDto";

export type ApiPerformanceDto = ApiPerformanceRecordDto;

export type PerformanceCreateDto = {
	name: string;
};

export type PerformanceUpdateDto = Partial<PerformanceCreateDto>;
