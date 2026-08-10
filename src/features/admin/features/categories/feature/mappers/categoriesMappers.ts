import type {
	CategoriesCreateDto,
	CategoriesUpdateDto,
} from "../dto/categoriesDto";
import type { CategoriesModel } from "../types/categoriesModel";

export { toCategoriesModel } from "../../shared/mappers/categoriesMappers";

export function toCategoriesCreateDto(
	model: Pick<CategoriesModel, "name">
): CategoriesCreateDto {
	return { name: model.name };
}

export function toCategoriesUpdateDto(
	model: Partial<Pick<CategoriesModel, "name">>
): CategoriesUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
