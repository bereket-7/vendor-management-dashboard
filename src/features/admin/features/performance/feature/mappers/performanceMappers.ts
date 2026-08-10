import type {
	PerformanceCreateDto,
	PerformanceUpdateDto,
} from "../dto/performanceDto";
import type { PerformanceModel } from "../types/performanceModel";

export { toPerformanceModel } from "../../shared/mappers/performanceMappers";

export function toPerformanceCreateDto(
	model: Pick<PerformanceModel, "name">
): PerformanceCreateDto {
	return { name: model.name };
}

export function toPerformanceUpdateDto(
	model: Partial<Pick<PerformanceModel, "name">>
): PerformanceUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
