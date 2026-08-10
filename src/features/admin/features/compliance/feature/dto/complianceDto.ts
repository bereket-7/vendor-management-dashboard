import type { ApiComplianceRecordDto } from "../../shared/dto/complianceRecordDto";

export type ApiComplianceDto = ApiComplianceRecordDto;

export type ComplianceCreateDto = {
	name: string;
};

export type ComplianceUpdateDto = Partial<ComplianceCreateDto>;
