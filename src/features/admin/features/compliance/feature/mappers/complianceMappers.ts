import type {
	ComplianceCreateDto,
	ComplianceUpdateDto,
} from "../dto/complianceDto";
import type { ComplianceModel } from "../types/complianceModel";

export { toComplianceModel } from "../../shared/mappers/complianceMappers";

export function toComplianceCreateDto(
	model: Pick<ComplianceModel, "name">
): ComplianceCreateDto {
	return { name: model.name };
}

export function toComplianceUpdateDto(
	model: Partial<Pick<ComplianceModel, "name">>
): ComplianceUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
