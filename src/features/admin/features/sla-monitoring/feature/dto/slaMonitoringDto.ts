import type { ApiSlaMonitoringRecordDto } from "../../shared/dto/slaMonitoringRecordDto";

export type ApiSlaMonitoringDto = ApiSlaMonitoringRecordDto;

export type SlaMonitoringCreateDto = {
	name: string;
};

export type SlaMonitoringUpdateDto = Partial<SlaMonitoringCreateDto>;
