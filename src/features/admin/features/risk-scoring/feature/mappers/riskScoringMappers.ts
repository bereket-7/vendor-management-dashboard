import type {
	RiskScoringCreateDto,
	RiskScoringUpdateDto,
} from "../dto/riskScoringDto";
import type { RiskScoringModel } from "../types/riskScoringModel";

export { toRiskScoringModel } from "../../shared/mappers/riskScoringMappers";

export function toRiskScoringCreateDto(
	model: Pick<RiskScoringModel, "name">
): RiskScoringCreateDto {
	return { name: model.name };
}

export function toRiskScoringUpdateDto(
	model: Partial<Pick<RiskScoringModel, "name">>
): RiskScoringUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
