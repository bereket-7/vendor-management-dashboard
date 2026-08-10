import type { ApiRiskScoringRecordDto } from "../../shared/dto/riskScoringRecordDto";

export type ApiRiskScoringDto = ApiRiskScoringRecordDto;

export type RiskScoringCreateDto = {
	name: string;
};

export type RiskScoringUpdateDto = Partial<RiskScoringCreateDto>;
