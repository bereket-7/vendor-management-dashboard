import {
	fetchProgramAudits,
	fetchProgramReportingOverview,
	fetchProgramSubmissions,
	updateProgramException,
	type ProgramTypeDto,
} from "@/lib/vendor-reporting/program-reporting";

import type { ProgramType } from "../../types";
import {
	emptyAudit,
	emptyOverview,
	emptySubmissions,
	getAcceptanceDerived,
	mapAuditsToProgramAuditData,
	mapOverviewDto,
	mapSubmissionsToProgramSubmissionsData,
	normalizeReportingPeriod,
} from "../mappers/program-reportingMappers";

function toDtoProgram(programType: ProgramType): ProgramTypeDto {
	return programType === "medicare" ? "medicare" : "medicaid";
}

export async function getOverviewData(
	programType: ProgramType,
	reportingPeriod?: string
) {
	try {
		const dto = await fetchProgramReportingOverview({
			programType: toDtoProgram(programType),
			reportingPeriod: normalizeReportingPeriod(reportingPeriod),
		});
		return mapOverviewDto(dto, programType);
	} catch {
		return emptyOverview(programType);
	}
}

export async function getAuditData(programType: ProgramType) {
	try {
		const audits = await fetchProgramAudits({
			programType: toDtoProgram(programType),
		});
		return mapAuditsToProgramAuditData(audits, programType);
	} catch {
		return emptyAudit(programType);
	}
}

export function getProgramScale(_programType: ProgramType): number {
	return 1;
}

export async function patchProgramException(
	id: string,
	body: { status?: string }
) {
	return updateProgramException(id, body);
}

export async function getAcceptanceAnalytics(
	programType: ProgramType = "medicaid",
	reportingPeriod?: string
) {
	const overview = await getOverviewData(programType, reportingPeriod);
	return getAcceptanceDerived(overview);
}

export async function getMedicareComplianceBundle() {
	const [{ listObligations }, overview] = await Promise.all([
		import(
			"@/features/admin/features/claim-encounter/compliance-calendar/feature/api/compliance-calendarApi"
		),
		getOverviewData("medicare"),
	]);
	const { items } = await listObligations({ program: "medicare" });
	const completed = items.filter((o) => o.status === "Completed").length;
	const overdue = items.filter((o) => o.status === "Overdue").length;
	const upcoming = items.filter((o) => o.status === "Upcoming").length;
	const atRisk = items.filter((o) => o.status === "At Risk").length;
	const statusStyle = (status: string) => {
		if (status === "Completed" || status === "On Track") {
			return "border-emerald-200 bg-emerald-50 text-emerald-700";
		}
		if (status === "Overdue" || status === "At Risk") {
			return "border-amber-200 bg-amber-50 text-amber-800";
		}
		return "border-sky-200 bg-sky-50 text-sky-800";
	};
	return {
		kpis: {
			requirementsMet: completed,
			requirementsTotal: items.length,
			upcomingDeadlines: upcoming,
			overdueItems: overdue,
			attestationsComplete: 0,
			attestationsTotal: 0,
			openGaps: atRisk + overdue,
			overallStatus:
				overview.kpis.kind === "medicare"
					? overview.kpis.complianceStatus
					: "—",
		},
		requirements: items.map((o) => ({
			id: o.id,
			requirement: o.title,
			regulation: o.sourceModule,
			dueDate: o.dueDate,
			owner: o.owner,
			status: o.status,
			statusStyle: statusStyle(o.status),
		})),
		attestations: [] as Array<{
			id: string;
			name: string;
			dueDate: string;
			completedDate: string;
			status: string;
			statusStyle: string;
		}>,
	};
}

export async function getSubmissionsData(
	programType: ProgramType,
	reportingPeriod?: string
) {
	try {
		const period = normalizeReportingPeriod(reportingPeriod);
		const [submissions, overview] = await Promise.all([
			fetchProgramSubmissions({
				programType: toDtoProgram(programType),
				reportingPeriod: period,
			}),
			getOverviewData(programType, reportingPeriod),
		]);
		return mapSubmissionsToProgramSubmissionsData(
			submissions,
			overview,
			programType
		);
	} catch {
		return emptySubmissions(programType);
	}
}
