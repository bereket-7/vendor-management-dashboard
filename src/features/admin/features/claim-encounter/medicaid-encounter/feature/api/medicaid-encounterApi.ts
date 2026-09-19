import {
	fetchProgramDocuments,
	fetchProgramExceptions,
	fetchProgramResponses,
	updateProgramException,
	type ProgramTypeDto,
} from "@/lib/vendor-reporting/program-reporting";
import {
	getAcceptanceDerived,
	getValidationDerived,
	mapDocumentDtoToRow,
	mapExceptionDtoToRow,
	mapResponseDtoToRow,
	normalizeReportingPeriod,
	type MedicaidAcceptanceDerived,
	type MedicaidResponseFileRow,
	type MedicaidValidationDerived,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import type { ProgramOverviewData } from "@/features/admin/features/claim-encounter/program-reporting/mock-data";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";

import type {
	MedicaidDocumentRow,
	MedicaidExceptionDetailRow,
} from "../../mock-data";

function toDtoProgram(programType?: ProgramType): ProgramTypeDto {
	return programType === "medicare" ? "medicare" : "medicaid";
}

export async function listDocumentLibrary(
	programType: ProgramType = "medicaid",
	reportingPeriod?: string
): Promise<MedicaidDocumentRow[]> {
	const docs = await fetchProgramDocuments({
		programType: toDtoProgram(programType),
		reportingPeriod: normalizeReportingPeriod(reportingPeriod),
	});
	return docs.map(mapDocumentDtoToRow);
}

export async function listExceptionDetails(
	programType: ProgramType = "medicaid"
): Promise<MedicaidExceptionDetailRow[]> {
	const rows = await fetchProgramExceptions({
		programType: toDtoProgram(programType),
	});
	return rows.map(mapExceptionDtoToRow);
}

export async function listResponseFiles(
	programType: ProgramType = "medicaid"
): Promise<MedicaidResponseFileRow[]> {
	const rows = await fetchProgramResponses({
		programType: toDtoProgram(programType),
	});
	return rows.map(mapResponseDtoToRow);
}

export async function getValidationDerivedFromLive(
	programType: ProgramType = "medicaid"
): Promise<MedicaidValidationDerived> {
	const responses = await fetchProgramResponses({
		programType: toDtoProgram(programType),
	});
	return getValidationDerived(responses);
}

export function getAcceptanceDerivedFromOverview(
	overview: ProgramOverviewData
): MedicaidAcceptanceDerived {
	return getAcceptanceDerived(overview);
}

export async function updateExceptionStatus(
	id: string,
	status: string
): Promise<{ id: string; status?: string }> {
	return updateProgramException(id, { status });
}

export { getValidationDerived, getAcceptanceDerived };
