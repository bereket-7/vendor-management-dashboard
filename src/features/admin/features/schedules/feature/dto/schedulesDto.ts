import type { ApiSchedulesRecordDto } from "../../shared/dto/schedulesRecordDto";

export type ApiSchedulesDto = ApiSchedulesRecordDto;

export type SchedulesCreateDto = {
	name: string;
};

export type SchedulesUpdateDto = Partial<SchedulesCreateDto>;
