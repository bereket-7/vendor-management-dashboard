import type {
	FileHistoryCreateDto,
	FileHistoryUpdateDto,
} from "../dto/fileHistoryDto";
import type { FileHistoryModel } from "../types/fileHistoryModel";

export { toFileHistoryModel } from "../../shared/mappers/fileHistoryMappers";

export function toFileHistoryCreateDto(
	model: Pick<FileHistoryModel, "name">
): FileHistoryCreateDto {
	return { name: model.name };
}

export function toFileHistoryUpdateDto(
	model: Partial<Pick<FileHistoryModel, "name">>
): FileHistoryUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
