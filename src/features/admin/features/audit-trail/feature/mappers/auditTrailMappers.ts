import type {
	AuditTrailCreateDto,
	AuditTrailUpdateDto,
} from "../dto/auditTrailDto";
import type { AuditTrailModel } from "../types/auditTrailModel";

export { toAuditTrailModel } from "../../shared/mappers/auditTrailMappers";

export function toAuditTrailCreateDto(
	model: Pick<AuditTrailModel, "name">
): AuditTrailCreateDto {
	return { name: model.name };
}

export function toAuditTrailUpdateDto(
	model: Partial<Pick<AuditTrailModel, "name">>
): AuditTrailUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
