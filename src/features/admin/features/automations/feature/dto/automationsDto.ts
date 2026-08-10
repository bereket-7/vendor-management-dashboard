import type { ApiAutomationsRecordDto } from "../../shared/dto/automationsRecordDto";

export type ApiAutomationsDto = ApiAutomationsRecordDto;

export type AutomationsCreateDto = {
	name: string;
};

export type AutomationsUpdateDto = Partial<AutomationsCreateDto>;
