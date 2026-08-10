import type {
	ProcessingLogsCreateDto,
	ProcessingLogsUpdateDto,
} from "../dto/processingLogsDto";
import type { ProcessingLogsModel } from "../types/processingLogsModel";

export { toProcessingLogsModel } from "../../shared/mappers/processingLogsMappers";

export function toProcessingLogsCreateDto(
	model: Pick<ProcessingLogsModel, "name">
): ProcessingLogsCreateDto {
	return { name: model.name };
}

export function toProcessingLogsUpdateDto(
	model: Partial<Pick<ProcessingLogsModel, "name">>
): ProcessingLogsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
