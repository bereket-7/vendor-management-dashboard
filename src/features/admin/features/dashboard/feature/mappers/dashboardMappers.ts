import type {
	DashboardCreateDto,
	DashboardUpdateDto,
} from "../dto/dashboardDto";
import type { DashboardModel } from "../types/dashboardModel";

export { toDashboardModel } from "../../shared/mappers/dashboardMappers";

export function toDashboardCreateDto(
	model: Pick<DashboardModel, "name">
): DashboardCreateDto {
	return { name: model.name };
}

export function toDashboardUpdateDto(
	model: Partial<Pick<DashboardModel, "name">>
): DashboardUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
