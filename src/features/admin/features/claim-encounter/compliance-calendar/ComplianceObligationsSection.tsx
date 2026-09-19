"use client";

import {
	ArrowUp,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	COMPLIANCE_PROGRAM_LABELS,
	type ComplianceObligationRow,
	type UpcomingDeadline,
	complianceProgramPillClass,
	complianceStatusPillClass,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABLE_HEAD =
	"h-9 whitespace-nowrap bg-muted/30 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
const TABLE_CELL = "whitespace-nowrap px-3 py-2.5 text-xs";

function DeadlineBadge({
	tone,
	label,
}: {
	tone: "overdue" | "warning" | "info";
	label: string;
}) {
	const toneClass =
		tone === "overdue"
			? "border-red-200 bg-red-50 text-red-700"
			: tone === "warning"
				? "border-amber-200 bg-amber-50 text-amber-800"
				: "border-sky-200 bg-sky-50 text-sky-800";

	return (
		<span
			className={cn(
				CMS_EDGE_STATUS_PILL_CLASS,
				toneClass,
				"shrink-0 text-[10px]"
			)}
		>
			{label}
		</span>
	);
}

export function ComplianceObligationsSection({
	obligations,
	upcomingDeadlines,
	total,
}: {
	obligations: ComplianceObligationRow[];
	upcomingDeadlines: UpcomingDeadline[];
	total: number;
}) {
	const showing = obligations.length;

	return (
		<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
			<CmsEdgeSectionPanel
				title={
					<div className="flex flex-wrap items-baseline gap-2">
						<span>Compliance Obligations</span>
						<span className="text-xs font-normal text-muted-foreground">
							Showing {showing} of {total} obligations
						</span>
					</div>
				}
				bodyClassName="p-0"
				footer={
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>Rows per page:</span>
							<Select defaultValue="10">
								<SelectTrigger className="h-8 w-[68px] bg-card text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="25">25</SelectItem>
									<SelectItem value="50">50</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="size-8" disabled>
								<ChevronsLeft className="size-3.5" />
							</Button>
							<Button variant="outline" size="icon" className="size-8" disabled>
								<ChevronLeft className="size-3.5" />
							</Button>
							<span className="px-2 text-xs tabular-nums text-muted-foreground">
								1
							</span>
							<Button variant="outline" size="icon" className="size-8" disabled>
								<ChevronRight className="size-3.5" />
							</Button>
							<Button variant="outline" size="icon" className="size-8" disabled>
								<ChevronsRight className="size-3.5" />
							</Button>
						</div>
					</div>
				}
			>
				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[960px]")}
					>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className={TABLE_HEAD}>
									<span className="inline-flex items-center gap-1">
										Obligation
										<ArrowUp className="size-3 opacity-40" />
									</span>
								</TableHead>
								<TableHead className={TABLE_HEAD}>Program</TableHead>
								<TableHead className={TABLE_HEAD}>Type</TableHead>
								<TableHead className={TABLE_HEAD}>Frequency</TableHead>
								<TableHead className={TABLE_HEAD}>Due Date</TableHead>
								<TableHead className={TABLE_HEAD}>Status</TableHead>
								<TableHead className={TABLE_HEAD}>Days</TableHead>
								<TableHead className={TABLE_HEAD}>Owner</TableHead>
								<TableHead className={TABLE_HEAD}>Source</TableHead>
								<TableHead className={cn(TABLE_HEAD, "text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{obligations.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-24 text-center text-muted-foreground"
									>
										No obligations found.
									</TableCell>
								</TableRow>
							) : (
								obligations.map((row) => (
									<TableRow key={row.id} className="hover:bg-muted/30">
										<TableCell className={TABLE_CELL}>
											<Link
												href={`/admin/claim-encounter/regulatory/compliance-calendar/${row.id}`}
												className="font-medium text-primary hover:underline"
											>
												{row.title}
											</Link>
										</TableCell>
										<TableCell className={TABLE_CELL}>
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													complianceProgramPillClass(row.program)
												)}
											>
												{COMPLIANCE_PROGRAM_LABELS[row.program]}
											</span>
										</TableCell>
										<TableCell className={TABLE_CELL}>
											{row.obligationType}
										</TableCell>
										<TableCell className={TABLE_CELL}>{row.frequency}</TableCell>
										<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
											{row.dueDate}
										</TableCell>
										<TableCell className={TABLE_CELL}>
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													complianceStatusPillClass(row.status)
												)}
											>
												{row.status}
											</span>
										</TableCell>
										<TableCell
											className={cn(
												TABLE_CELL,
												"tabular-nums",
												row.daysToDue < 0 && "font-semibold text-red-700"
											)}
										>
											{row.daysToDue}
										</TableCell>
										<TableCell className={TABLE_CELL}>{row.owner}</TableCell>
										<TableCell className={TABLE_CELL}>
											{row.sourceModule}
										</TableCell>
										<TableCell className={cn(TABLE_CELL, "text-right")}>
											<Button asChild variant="ghost" size="sm" className="h-7 text-xs">
												<Link
													href={`/admin/claim-encounter/regulatory/compliance-calendar/${row.id}`}
												>
													View
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</CmsEdgeSectionPanel>

			<CmsEdgeSectionPanel
				title={
					<span className="inline-flex items-center gap-1.5">
						<CalendarDays className="size-3.5" />
						Upcoming Deadlines
					</span>
				}
				bodyClassName="space-y-0 p-0"
			>
				{upcomingDeadlines.length === 0 ? (
					<p className="px-4 py-8 text-center text-xs text-muted-foreground">
						No upcoming deadlines.
					</p>
				) : (
					<ul className="divide-y divide-border/50">
						{upcomingDeadlines.map((item) => (
							<li key={item.id}>
								<Link
									href={`/admin/claim-encounter/regulatory/compliance-calendar/${item.obligationId}`}
									className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
								>
									<div className="flex w-10 shrink-0 flex-col items-center">
										<span className="text-[9px] font-semibold uppercase text-muted-foreground">
											{item.month}
										</span>
										<span className="text-lg font-bold tabular-nums leading-none">
											{item.day}
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-2">
											<p className="line-clamp-2 text-xs font-medium text-foreground">
												{item.title}
											</p>
											<DeadlineBadge tone={item.badgeTone} label={item.badge} />
										</div>
										<p className="mt-0.5 text-[10px] text-muted-foreground">
											{COMPLIANCE_PROGRAM_LABELS[item.program]} ·{" "}
											{item.obligationType}
										</p>
									</div>
								</Link>
							</li>
						))}
					</ul>
				)}
			</CmsEdgeSectionPanel>
		</div>
	);
}
