import type { ApiActivityRecordDto } from "../../shared/dto/activityRecordDto";

export type ApiActivityDto = ApiActivityRecordDto;

export type ActivityCreateDto = {
	name: string;
};

export type ActivityUpdateDto = Partial<ActivityCreateDto>;
