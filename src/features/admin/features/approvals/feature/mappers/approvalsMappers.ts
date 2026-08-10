import type {
	ApprovalsCreateDto,
	ApprovalsUpdateDto,
} from "../dto/approvalsDto";
import type { ApprovalsModel } from "../types/approvalsModel";

export { toApprovalsModel } from "../../shared/mappers/approvalsMappers";

export function toApprovalsCreateDto(
	model: Pick<ApprovalsModel, "name">
): ApprovalsCreateDto {
	return { name: model.name };
}

export function toApprovalsUpdateDto(
	model: Partial<Pick<ApprovalsModel, "name">>
): ApprovalsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
