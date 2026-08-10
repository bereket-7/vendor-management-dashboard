import type {
	ErrorManagementCreateDto,
	ErrorManagementUpdateDto,
} from "../dto/errorManagementDto";
import type { ErrorManagementModel } from "../types/errorManagementModel";

export { toErrorManagementModel } from "../../shared/mappers/errorManagementMappers";

export function toErrorManagementCreateDto(
	model: Pick<ErrorManagementModel, "name">
): ErrorManagementCreateDto {
	return { name: model.name };
}

export function toErrorManagementUpdateDto(
	model: Partial<Pick<ErrorManagementModel, "name">>
): ErrorManagementUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
