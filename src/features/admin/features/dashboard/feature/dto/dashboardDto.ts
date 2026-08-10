import type { ApiDashboardRecordDto } from "../../shared/dto/dashboardRecordDto";

export type ApiDashboardDto = ApiDashboardRecordDto;

export type DashboardCreateDto = {
	name: string;
};

export type DashboardUpdateDto = Partial<DashboardCreateDto>;
