import type { RiskScoringModel } from "../../feature/types/riskScoringModel";
import type { ApiRiskScoringRecordDto } from "../dto/riskScoringRecordDto";

export function toRiskScoringModel(
	row: ApiRiskScoringRecordDto,
	index = 0
): RiskScoringModel {
	const id = row.id != null ? String(row.id) : `risk-scoring-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}
