import {
	createComplianceObligation,
	fetchComplianceCalendarOverview,
	fetchComplianceObligation,
	fetchComplianceObligations,
	updateComplianceObligation,
	type ComplianceObligationWrite,
} from "@/lib/vendor-reporting/compliance-calendar";

import {
	mapObligationDtoToDetail,
	mapObligationDtoToRow,
	mapOverviewEventsToDayMap,
	mapOverviewKpis,
	mapUpcomingDeadlines,
	obligationRowsToSchedule,
	programSummaryFromRows,
} from "../mappers/compliance-calendarMappers";

export type ObligationListFilters = {
	program?: string;
	status?: string;
	search?: string;
};

export async function getComplianceOverview(view?: {
	year: number;
	monthIndex: number;
}) {
	const overview = await fetchComplianceCalendarOverview();
	const year = view?.year ?? new Date().getFullYear();
	const monthIndex = view?.monthIndex ?? new Date().getMonth();
	return {
		kpis: mapOverviewKpis(overview),
		eventsByDay: mapOverviewEventsToDayMap(
			overview.events ?? [],
			year,
			monthIndex
		),
		upcomingDeadlines: mapUpcomingDeadlines(overview.upcomingDeadlines ?? []),
		rawEvents: overview.events ?? [],
	};
}

export async function listObligations(filters?: ObligationListFilters) {
	const page = await fetchComplianceObligations(filters);
	const items = (page.results ?? []).map(mapObligationDtoToRow);
	return { items, total: page.count ?? items.length };
}

export async function listUpcomingDeadlines() {
	const overview = await getComplianceOverview();
	return overview.upcomingDeadlines;
}

export async function getObligationDetail(id: string) {
	try {
		const dto = await fetchComplianceObligation(id);
		return mapObligationDtoToDetail(dto);
	} catch {
		return null;
	}
}

export async function createObligation(body: ComplianceObligationWrite) {
	const dto = await createComplianceObligation(body);
	return mapObligationDtoToDetail(dto);
}

export async function updateObligation(
	id: string,
	body: ComplianceObligationWrite
) {
	const dto = await updateComplianceObligation(id, body);
	return mapObligationDtoToDetail(dto);
}

export async function getCalendarBundle(view: {
	year: number;
	monthIndex: number;
}) {
	const [overview, obligations] = await Promise.all([
		getComplianceOverview(view),
		listObligations(),
	]);
	return {
		...overview,
		obligations: obligations.items,
		total: obligations.total,
		schedule: obligationRowsToSchedule(obligations.items),
		programSummary: programSummaryFromRows(obligations.items),
	};
}

export { buildMonthGrid } from "../mappers/compliance-calendarMappers";
