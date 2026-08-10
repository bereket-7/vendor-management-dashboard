import type {
	DocumentsCreateDto,
	DocumentsUpdateDto,
} from "../dto/documentsDto";
import type { DocumentsModel } from "../types/documentsModel";

export { toDocumentsModel } from "../../shared/mappers/documentsMappers";

export function toDocumentsCreateDto(
	model: Pick<DocumentsModel, "name">
): DocumentsCreateDto {
	return { name: model.name };
}

export function toDocumentsUpdateDto(
	model: Partial<Pick<DocumentsModel, "name">>
): DocumentsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
