import type { ApiAuditTrailRecordDto } from "../../shared/dto/auditTrailRecordDto";

export type ApiAuditTrailDto = ApiAuditTrailRecordDto;

export type AuditTrailCreateDto = {
	name: string;
};

export type AuditTrailUpdateDto = Partial<AuditTrailCreateDto>;
