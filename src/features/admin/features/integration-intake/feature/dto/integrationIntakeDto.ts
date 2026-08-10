import type { ApiIntegrationIntakeRecordDto } from "../../shared/dto/integrationIntakeRecordDto";

export type ApiIntegrationIntakeDto = ApiIntegrationIntakeRecordDto;

export type IntegrationIntakeCreateDto = {
	name: string;
};

export type IntegrationIntakeUpdateDto = Partial<IntegrationIntakeCreateDto>;
