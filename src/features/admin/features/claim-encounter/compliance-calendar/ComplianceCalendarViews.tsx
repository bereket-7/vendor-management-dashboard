"use client";

import { Button } from "@/components/ui/button";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	COMPLIANCE_PROGRAM_COLORS,
	COMPLIANCE_PROGRAM_LABELS,
	type CalendarScheduleItem,
	complianceProgramPillClass,
	complianceStatusPillClass,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";
import {
	scheduleForWeek,
	scheduleListGroups,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/mappers/compliance-calendarMappers";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function ScheduleChip({ item }: { item: CalendarScheduleItem }) {
	const href = item.obligationId
		? `/admin/claim-encounter/regulatory/compliance-calendar/${item.obligationId}`
		: undefined;
	const color = COMPLIANCE_PROGRAM_COLORS[item.program];

	const content = (
		<div
			className="rounded-md border border-border/50 bg-card px-2 py-1.5 shadow-sm"
			style={{ borderLeftWidth: 3, borderLeftColor: color }}
		>
			<p className="line-clamp-2 text-[10px] font-semibold leading-snug text-foreground">
				{item.title}
			</p>
			<p className="mt-0.5 text-[9px] text-muted-foreground">
				{item.obligationType}
			</p>
		</div>
	);

	if (href) {
		return (
			<Link href={href} className="block transition-opacity hover:opacity-80">
				{content}
			</Link>
		);
	}

	return content;
}

export function ComplianceCalendarWeekView({
	schedule,
	anchor,
	year,
	monthIndex,
}: {
	schedule: CalendarScheduleItem[];
	anchor: Date;
	year: number;
	monthIndex: number;
}) {
	const weekDays = scheduleForWeek(schedule, anchor, monthIndex, year);

	return (
		<div>
			<div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
				{weekDays.map((day) => (
					<div
						key={day.dateKey}
						className="border-r border-border/40 px-2 py-2 text-center last:border-r-0"
					>
						<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
							{day.weekday}
						</p>
						<p
							className={cn(
								"mx-auto mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
								day.isToday && "bg-primary text-primary-foreground",
								!day.isToday && day.inCurrentMonth && "text-foreground",
								!day.inCurrentMonth && "text-muted-foreground/60"
							)}
						>
							{day.day}
						</p>
					</div>
				))}
			</div>
			<div className="grid min-h-[520px] grid-cols-7">
				{weekDays.map((day) => (
					<div
						key={`body-${day.dateKey}`}
						className="space-y-1.5 border-b border-r border-border/40 p-1.5 last:border-r-0"
					>
						{day.items.map((item) => (
							<ScheduleChip key={item.id} item={item} />
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export function ComplianceCalendarListView({
	schedule,
	year,
	monthIndex,
}: {
	schedule: CalendarScheduleItem[];
	year: number;
	monthIndex: number;
}) {
	const groups = scheduleListGroups(schedule, year, monthIndex);

	if (groups.length === 0) {
		return (
			<p className="px-4 py-10 text-center text-sm text-muted-foreground">
				No obligations scheduled this month.
			</p>
		);
	}

	return (
		<div className="divide-y divide-border/50">
			{groups.map((group) => (
				<div key={group.key} className="px-4 py-3">
					<p className="mb-2 text-xs font-semibold text-foreground">
						{group.label}
					</p>
					<CmsEdgeTableScroll>
						<table className="w-full min-w-[640px] text-xs">
							<tbody>
								{group.items.map((item) => (
									<tr
										key={item.id}
										className="border-b border-border/40 last:border-0"
									>
										<td className="py-2 pr-3">
											{item.obligationId ? (
												<Link
													href={`/admin/claim-encounter/regulatory/compliance-calendar/${item.obligationId}`}
													className="font-medium text-primary hover:underline"
												>
													{item.title}
												</Link>
											) : (
												<span className="font-medium">{item.title}</span>
											)}
										</td>
										<td className="py-2 pr-3">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													complianceProgramPillClass(item.program)
												)}
											>
												{COMPLIANCE_PROGRAM_LABELS[item.program]}
											</span>
										</td>
										<td className="py-2 pr-3 text-muted-foreground">
											{item.obligationType}
										</td>
										<td className="py-2 pr-3">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													complianceStatusPillClass(item.status)
												)}
											>
												{item.status}
											</span>
										</td>
										<td className="py-2 text-muted-foreground">{item.owner}</td>
										<td className="py-2 text-right">
											{item.obligationId ? (
												<Button asChild variant="ghost" size="sm" className="h-7 text-xs">
													<Link
														href={`/admin/claim-encounter/regulatory/compliance-calendar/${item.obligationId}`}
													>
														View
													</Link>
												</Button>
											) : null}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CmsEdgeTableScroll>
				</div>
			))}
		</div>
	);
}
