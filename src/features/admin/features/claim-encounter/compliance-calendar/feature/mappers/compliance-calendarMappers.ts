import type {
	ComplianceCalendarOverviewDto,
	ComplianceObligationDto,
} from "@/lib/vendor-reporting/compliance-calendar";

import type {
	CalendarDayEvent,
	CalendarScheduleItem,
	ComplianceObligationRow,
	ComplianceProgramKey,
	ObligationDetail,
	ObligationStatus,
	UpcomingDeadline,
} from "../../mock-data";
import { COMPLIANCE_PROGRAM_COLORS } from "../../mock-data";

const PROGRAMS = new Set([
	"cms-edge",
	"medicaid",
	"medicare",
	"quality",
	"other",
]);

const STATUSES = new Set([
	"Overdue",
	"At Risk",
	"Upcoming",
	"Completed",
]);

function asProgram(
	value: string
): Exclude<ComplianceProgramKey, "overdue"> {
	return PROGRAMS.has(value)
		? (value as Exclude<ComplianceProgramKey, "overdue">)
		: "other";
}

function asStatus(value: string): ObligationStatus {
	return STATUSES.has(value) ? (value as ObligationStatus) : "Upcoming";
}

/** Format ISO or YYYY-MM-DD → MM/DD/YYYY */
export function formatDueDateDisplay(raw: string | null | undefined): string {
	if (!raw) return "—";
	const d = parseDate(raw);
	if (!d) return raw;
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${mm}/${dd}/${d.getFullYear()}`;
}

export function parseDate(raw: string): Date | null {
	const iso = Date.parse(raw);
	if (!Number.isNaN(iso)) return new Date(iso);
	const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
	if (m) {
		return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
	}
	const y = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
	if (y) {
		return new Date(Number(y[1]), Number(y[2]) - 1, Number(y[3]));
	}
	return null;
}

export function mapObligationDtoToRow(
	dto: ComplianceObligationDto
): ComplianceObligationRow {
	return {
		id: dto.id,
		title: dto.title,
		program: asProgram(dto.program),
		obligationType: dto.obligationType || "—",
		frequency: dto.frequency || "—",
		dueDate: formatDueDateDisplay(dto.dueDate),
		status: asStatus(dto.status),
		daysToDue: dto.daysToDue ?? 0,
		owner: dto.owner || "—",
		sourceModule: dto.sourceModule || "—",
	};
}

export function mapObligationDtoToDetail(
	dto: ComplianceObligationDto
): ObligationDetail {
	const row = mapObligationDtoToRow(dto);
	const docs = Array.isArray(dto.documents) ? dto.documents : [];
	const activity = Array.isArray(dto.activity) ? dto.activity : [];
	const priority =
		dto.priority === "High" || dto.priority === "Low"
			? dto.priority
			: "Medium";

	return {
		...row,
		reportingPeriod: dto.reportingPeriod || "—",
		regulatoryAgency: dto.regulatoryAgency || "—",
		internalDueDate: formatDueDateDisplay(dto.internalDueDate),
		priority,
		regulatoryReference: dto.regulatoryReference || "—",
		lastUpdated: dto.updatedAt
			? formatDueDateDisplay(dto.updatedAt)
			: "—",
		description: dto.description || "",
		notes: dto.notes || "",
		relatedSubmission: dto.relatedSubmission || "—",
		latestResponse: dto.latestResponse || "—",
		openIssues:
			typeof dto.openIssues === "number"
				? `${dto.openIssues} open issue${dto.openIssues === 1 ? "" : "s"}`
				: "0 open issues",
		documents: docs.map((doc, i) => {
			const d = doc as Record<string, unknown>;
			return {
				id: String(d.id ?? `doc-${i}`),
				title: String(d.title ?? d.name ?? "Document"),
				meta: String(d.meta ?? d.fileSize ?? d.size ?? ""),
				iconTone: String(
					d.iconTone ?? "border-sky-200 bg-sky-50 text-sky-700"
				),
			};
		}),
		activity: activity.map((item, i) => {
			const a = item as Record<string, unknown>;
			return {
				id: String(a.id ?? `act-${i}`),
				timestamp: String(a.timestamp ?? a.at ?? "—"),
				action: String(a.action ?? a.description ?? "—"),
				actor: String(a.actor ?? a.by ?? "System"),
			};
		}),
	};
}

export function mapOverviewKpis(overview: ComplianceCalendarOverviewDto) {
	const { total, upcoming, overdue, completed, atRisk } = overview.kpis;
	const pct = (n: number) =>
		total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";
	return {
		total: { value: total, hint: "Across all programs" },
		upcoming: { value: upcoming, pct: pct(upcoming) },
		overdue: { value: overdue, pct: pct(overdue) },
		completed: { value: completed, pct: pct(completed) },
		atRisk: { value: atRisk, pct: pct(atRisk) },
	};
}

export function mapOverviewEventsToDayMap(
	events: ComplianceCalendarOverviewDto["events"],
	year: number,
	monthIndex: number
): Record<number, CalendarDayEvent[]> {
	const map: Record<number, CalendarDayEvent[]> = {};
	for (const ev of events) {
		const d = parseDate(ev.date);
		if (!d) continue;
		if (d.getFullYear() !== year || d.getMonth() !== monthIndex) continue;
		const day = d.getDate();
		const program = PROGRAMS.has(ev.program)
			? (ev.program as ComplianceProgramKey)
			: ev.program === "overdue"
				? "overdue"
				: ("other" as ComplianceProgramKey);
		const list = map[day] ?? [];
		list.push({ program, count: ev.count });
		map[day] = list;
	}
	return map;
}

export function mapUpcomingDeadlines(
	items: ComplianceCalendarOverviewDto["upcomingDeadlines"]
): UpcomingDeadline[] {
	return items.map((item, i) => {
		const d = item.dueDate ? parseDate(item.dueDate) : null;
		const days = item.daysToDue ?? 0;
		const badgeTone =
			item.status === "Overdue" || days < 0
				? "overdue"
				: days <= 3
					? "warning"
					: "info";
		const badge =
			item.status === "Overdue" || days < 0
				? "Overdue"
				: days === 0
					? "Today"
					: `${days} day${days === 1 ? "" : "s"}`;
		const program = asProgram(item.program);
		return {
			id: item.id || `ud-${i}`,
			month: d
				? d.toLocaleString("en-US", { month: "short" }).toUpperCase()
				: "—",
			day: d?.getDate() ?? 0,
			title: item.title,
			program,
			obligationType: item.obligationType || "—",
			badge,
			badgeTone,
			dotColor: COMPLIANCE_PROGRAM_COLORS[program],
			obligationId: item.id,
		};
	});
}

export function obligationRowsToSchedule(
	rows: ComplianceObligationRow[]
): CalendarScheduleItem[] {
	const items: CalendarScheduleItem[] = [];
	for (const row of rows) {
		const d = parseDate(row.dueDate);
		if (!d) continue;
		items.push({
			id: row.id,
			title: row.title,
			program: row.program,
			obligationType: row.obligationType,
			status: row.status,
			dueDate: row.dueDate,
			owner: row.owner,
			obligationId: row.id,
			year: d.getFullYear(),
			month: d.getMonth(),
			day: d.getDate(),
		});
	}
	return items.sort((a, b) => {
		if (a.year !== b.year) return a.year - b.year;
		if (a.month !== b.month) return a.month - b.month;
		return a.day - b.day;
	});
}

export function buildMonthGrid(year: number, monthIndex: number, today = new Date()) {
	const firstDay = new Date(year, monthIndex, 1).getDay();
	const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
	const prevMonthDays = new Date(year, monthIndex, 0).getDate();
	const cells: { day: number; inMonth: boolean; isToday: boolean }[] = [];

	for (let i = firstDay - 1; i >= 0; i--) {
		cells.push({ day: prevMonthDays - i, inMonth: false, isToday: false });
	}
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push({
			day: d,
			inMonth: true,
			isToday:
				today.getFullYear() === year &&
				today.getMonth() === monthIndex &&
				today.getDate() === d,
		});
	}
	let nextDay = 1;
	while (cells.length < 42) {
		cells.push({ day: nextDay++, inMonth: false, isToday: false });
	}
	return cells;
}

export function programSummaryFromRows(rows: ComplianceObligationRow[]) {
	const keys = ["cms-edge", "medicaid", "medicare", "quality", "other"] as const;
	const total = Math.max(rows.length, 1);
	return keys.map((key) => {
		const count = rows.filter((r) => r.program === key).length;
		return {
			key,
			count,
			pct: `${((count / total) * 100).toFixed(1)}%`,
		};
	});
}

export function labelToProgramFilter(label: string): string | undefined {
	if (!label || label === "All") return undefined;
	const map: Record<string, string> = {
		"CMS EDGE": "cms-edge",
		Medicaid: "medicaid",
		Medicare: "medicare",
		Quality: "quality",
		Other: "other",
	};
	return map[label];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function buildWeekDays(
	anchor: Date,
	monthIndex: number,
	year: number
) {
	const start = new Date(anchor);
	start.setDate(anchor.getDate() - anchor.getDay());
	const today = new Date();
	return Array.from({ length: 7 }, (_, index) => {
		const date = new Date(
			start.getFullYear(),
			start.getMonth(),
			start.getDate() + index
		);
		return {
			weekday: WEEKDAY_LABELS[date.getDay()]!,
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear(),
			inCurrentMonth: date.getMonth() === monthIndex && date.getFullYear() === year,
			isToday:
				date.getFullYear() === today.getFullYear() &&
				date.getMonth() === today.getMonth() &&
				date.getDate() === today.getDate(),
			dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
			label: date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
		};
	});
}

export function scheduleForDay(
	schedule: CalendarScheduleItem[],
	year: number,
	month: number,
	day: number
) {
	return schedule.filter(
		(item) => item.year === year && item.month === month && item.day === day
	);
}

export function scheduleForWeek(
	schedule: CalendarScheduleItem[],
	anchor: Date,
	monthIndex: number,
	year: number
) {
	return buildWeekDays(anchor, monthIndex, year).map((d) => ({
		...d,
		items: scheduleForDay(schedule, d.year, d.month, d.day),
	}));
}

export function scheduleListGroups(
	schedule: CalendarScheduleItem[],
	year: number,
	monthIndex: number
) {
	const monthItems = schedule.filter(
		(item) => item.year === year && item.month === monthIndex
	);
	const groups = new Map<string, CalendarScheduleItem[]>();
	for (const item of monthItems) {
		const key = `${item.year}-${item.month}-${item.day}`;
		const existing = groups.get(key);
		if (existing) existing.push(item);
		else groups.set(key, [item]);
	}
	return Array.from(groups.entries())
		.sort(([a], [b]) => {
			const [ay, am, ad] = a.split("-").map(Number);
			const [by, bm, bd] = b.split("-").map(Number);
			return (
				new Date(ay!, am!, ad!).getTime() - new Date(by!, bm!, bd!).getTime()
			);
		})
		.map(([key, items]) => ({
			key,
			label: new Date(
				items[0]!.year,
				items[0]!.month,
				items[0]!.day
			).toLocaleDateString("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric",
				year: "numeric",
			}),
			items,
		}));
}

export function weekLabel(anchor: Date) {
	const start = new Date(anchor);
	start.setDate(anchor.getDate() - anchor.getDay());
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	const fmt = (d: Date) =>
		d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}
