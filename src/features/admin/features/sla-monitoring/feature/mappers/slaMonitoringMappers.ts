import type {
	SlaMonitoringCreateDto,
	SlaMonitoringUpdateDto,
} from "../dto/slaMonitoringDto";
import type { SlaMonitoringModel } from "../types/slaMonitoringModel";

export { toSlaMonitoringModel } from "../../shared/mappers/slaMonitoringMappers";

export function toSlaMonitoringCreateDto(
	model: Pick<SlaMonitoringModel, "name">
): SlaMonitoringCreateDto {
	return { name: model.name };
}

export function toSlaMonitoringUpdateDto(
	model: Partial<Pick<SlaMonitoringModel, "name">>
): SlaMonitoringUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
