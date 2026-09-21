import {
	type MedicarePartDKpis,
	type MedicarePartDReconciliationRow,
	type MedicarePartDSubmissionRow,
	isPartDSubmission,
	mapPartDKpis,
	mapPdeReconciliationDto,
	mapSubmissionDtoToPartDRow,
	normalizeReportingPeriod,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import {
	fetchPdeReconciliations,
	fetchProgramReportingOverview,
	fetchProgramResponses,
	fetchProgramSubmissions,
} from "@/lib/vendor-reporting/program-reporting";

export async function listPartDSubmissions(
	reportingPeriod?: string
): Promise<MedicarePartDSubmissionRow[]> {
	const submissions = await fetchProgramSubmissions({
		programType: "medicare",
		reportingPeriod: normalizeReportingPeriod(reportingPeriod),
	});
	return submissions.filter(isPartDSubmission).map(mapSubmissionDtoToPartDRow);
}

export async function getPartDKpis(
	reportingPeriod?: string
): Promise<MedicarePartDKpis> {
	const period = normalizeReportingPeriod(reportingPeriod);
	const [submissions, responses, overview] = await Promise.all([
		fetchProgramSubmissions({
			programType: "medicare",
			reportingPeriod: period,
		}),
		fetchProgramResponses({ programType: "medicare" }),
		fetchProgramReportingOverview({
			programType: "medicare",
			reportingPeriod: period,
		}),
	]);
	return mapPartDKpis({
		submissions,
		responses,
		medicareExtras: overview.medicareExtras,
	});
}

export async function listPartDReconciliations(
	reportingPeriod?: string
): Promise<MedicarePartDReconciliationRow[]> {
	const rows = await fetchPdeReconciliations({
		reportingPeriod: normalizeReportingPeriod(reportingPeriod),
	});
	return rows.map(mapPdeReconciliationDto);
}

export type MedicarePartDResponseRow = {
	id: string;
	responseFile: string;
	receivedOn: string;
	pdeSubmission: string;
	status: "Processed" | "Processed with Errors" | "Pending";
};

export async function listPartDResponses(
	reportingPeriod?: string
): Promise<MedicarePartDResponseRow[]> {
	void reportingPeriod;
	const { formatDisplayDate } =
		await import("@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers");
	const rows = await fetchProgramResponses({ programType: "medicare" });
	return rows.map((r) => ({
		id: r.id,
		responseFile: r.responseFile || "—",
		receivedOn: formatDisplayDate(r.receivedAt, true),
		pdeSubmission: r.submissionId || "—",
		status:
			r.errors && r.errors > 0
				? ("Processed with Errors" as const)
				: r.status === "Pending"
					? ("Pending" as const)
					: ("Processed" as const),
	}));
}
