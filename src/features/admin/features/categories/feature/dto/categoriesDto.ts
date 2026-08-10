import type { ApiCategoriesRecordDto } from "../../shared/dto/categoriesRecordDto";

export type ApiCategoriesDto = ApiCategoriesRecordDto;

export type CategoriesCreateDto = {
	name: string;
};

export type CategoriesUpdateDto = Partial<CategoriesCreateDto>;
