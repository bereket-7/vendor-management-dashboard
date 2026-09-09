"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	Bookmark,
	CheckCircle2,
	CircleDot,
	Mail,
	MoreVertical,
	Phone,
	Search,
	Target,
} from "lucide-react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CMS_EDGE_STATUS_PILL_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEASURE_CHART_FRAME,
	MEASURE_CHART_GOAL,
	MEASURE_CHART_PRIMARY,
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureDataTable,
	MeasureDonutBreakdown,
	MeasureFilterField,
	MeasureKpiCard,
	MeasureSectionPanel,
	MeasureTablePagination,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import {
	type MeasureGapClosureDetail,
	getGapStatusStyle,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";
import { cn } from "@/lib/utils";

function ActivityIcon({
	type,
}: {
	type: MeasureGapClosureDetail["recentActivities"][0]["type"];
}) {
	if (type === "closed")
		return <CheckCircle2 className="size-4 text-emerald-600" />;
	if (type === "call") return <Phone className="size-4 text-sky-600" />;
	if (type === "letter") return <Mail className="size-4 text-primary" />;
	return <AlertTriangle className="size-4 text-amber-600" />;
}

export function MeasureDetailGapClosureTab({
	data,
	measurementYear,
}: {
	data: MeasureGapClosureDetail;
	measurementYear: string;
}) {
	const [providerSearch, setProviderSearch] = useState("");
	const summary = data.summary;
	const reasonTotals = data.byReason.reduce(
		(acc, row) => ({
			totalGaps: acc.totalGaps + row.totalGaps,
			closedGaps: acc.closedGaps + row.closedGaps,
		}),
		{ totalGaps: 0, closedGaps: 0 }
	);

	const filteredGaps = useMemo(() => {
		const q = providerSearch.trim().toLowerCase();
		if (!q) return data.gaps;
		return data.gaps.filter((g) => g.assignedTo.toLowerCase().includes(q));
	}, [data.gaps, providerSearch]);

	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<MeasureKpiCard
					label="Total Gaps"
					value={summary.totalGaps.toLocaleString()}
					icon={CircleDot}
					tone="primary"
				/>
				<MeasureKpiCard
					label="Open Gaps"
					value={summary.openGaps.toLocaleString()}
					tone="warning"
				/>
				<MeasureKpiCard
					label="Closed Gaps"
					value={summary.closedGaps.toLocaleString()}
					tone="success"
				/>
				<MeasureKpiCard
					label="Closure Rate"
					value={`${summary.closureRate.toFixed(2)}%`}
					hint={`Goal: ${data.goal}%`}
					icon={Target}
				/>
				<MeasureKpiCard
					label="In Process"
					value={summary.inProcess.toLocaleString()}
					tone="danger"
				/>
			</div>

			<div className="grid gap-3 lg:grid-cols-3">
				<MeasureSectionPanel
					title={`Gap Status (${measurementYear})`}
					subtitle="Breakdown by outreach status"
					bodyClassName="p-0"
				>
					<MeasureDonutBreakdown
						items={data.byStatus.map((s) => ({
							name: s.name,
							value: s.value,
							color: s.color,
							pct: s.pct,
						}))}
						centerValue={summary.totalGaps.toLocaleString()}
						centerLabel="Total Gaps"
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Gap Closure by Reason"
					subtitle="Gaps grouped by clinical reason"
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "reason", header: "Reason" },
							{ key: "total", header: "Total", align: "right" },
							{ key: "closed", header: "Closed", align: "right" },
							{
								key: "rate",
								header: "Rate",
								align: "right",
								className: "font-semibold",
							},
						]}
						rows={[
							...data.byReason.map((row) => ({
								reason: row.reason,
								total: row.totalGaps.toLocaleString(),
								closed: row.closedGaps.toLocaleString(),
								rate: `${row.closureRate.toFixed(2)}%`,
							})),
							{
								reason: <span className="font-semibold">Total</span>,
								total: reasonTotals.totalGaps.toLocaleString(),
								closed: reasonTotals.closedGaps.toLocaleString(),
								rate: `${summary.closureRate.toFixed(2)}%`,
							},
						]}
						getRowKey={(row, index) =>
							index === data.byReason.length ? "total" : String(row.reason)
						}
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Closure Trend"
					subtitle="Monthly closure rate vs goal"
					bodyClassName="p-0"
				>
					<div className={MEASURE_CHART_FRAME}>
						<ResponsiveContainer width="100%" height={220}>
							<LineChart
								data={data.trend}
								margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/50"
								/>
								<XAxis dataKey="month" tick={{ fontSize: 10 }} />
								<YAxis
									tick={{ fontSize: 10 }}
									width={36}
									domain={[0, 40]}
									tickFormatter={(v) => `${v}%`}
								/>
								<Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
								<ReferenceLine
									y={data.goal}
									stroke={MEASURE_CHART_GOAL}
									strokeDasharray="4 4"
									label={{
										value: `Goal ${data.goal}%`,
										fontSize: 10,
										fill: MEASURE_CHART_GOAL,
									}}
								/>
								<Line
									type="monotone"
									dataKey="rate"
									name="Closure Rate"
									stroke={MEASURE_CHART_PRIMARY}
									strokeWidth={2.5}
									dot={{ r: 4, fill: MEASURE_CHART_PRIMARY }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</MeasureSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
				<MeasureSectionPanel
					title="Filters"
					subtitle="Narrow gap detail list"
					bodyClassName="space-y-2 p-0"
					action={
						<Button
							variant="link"
							size="sm"
							className="h-8 px-0 text-sm text-primary"
						>
							Clear All
						</Button>
					}
				>
					<MeasureFilterField label="Plan">
						<Select defaultValue="All">
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{data.filterOptions.plans.map((o) => (
									<SelectItem key={o} value={o} className="text-sm">
										{o}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</MeasureFilterField>
					<MeasureFilterField label="Line of Business">
						<Select defaultValue="All">
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{data.filterOptions.linesOfBusiness.map((o) => (
									<SelectItem key={o} value={o} className="text-sm">
										{o}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</MeasureFilterField>
					<MeasureFilterField label="Provider">
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={providerSearch}
								onChange={(e) => setProviderSearch(e.target.value)}
								placeholder="Search provider"
								className="h-9 pl-9 text-sm"
							/>
						</div>
					</MeasureFilterField>
					{[
						{ label: "Risk Group", options: data.filterOptions.riskGroups },
						{ label: "Status", options: data.filterOptions.statuses },
						{ label: "Reason", options: data.filterOptions.reasons },
					].map((f) => (
						<MeasureFilterField key={f.label} label={f.label}>
							<Select defaultValue="All">
								<SelectTrigger className="h-9 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{f.options.map((o) => (
										<SelectItem key={o} value={o} className="text-sm">
											{o}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</MeasureFilterField>
					))}
					<div className="space-y-2 pt-2">
						<Button className="h-9 w-full text-sm">Apply Filters</Button>
						<Button variant="outline" className="h-9 w-full gap-1.5 text-sm">
							<Bookmark className="size-4" />
							Save Filter
						</Button>
					</div>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title={`Gap Detail (${data.totalGaps.toLocaleString()})`}
					subtitle="Member-level gap closure tracking"
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{
								key: "id",
								header: "Member ID",
								className: "font-mono text-xs",
							},
							{ key: "name", header: "Member Name" },
							{ key: "dob", header: "DOB", className: MEASURE_TABLE_MUTED },
							{ key: "plan", header: "Plan" },
							{ key: "reason", header: "Gap Reason" },
							{
								key: "identified",
								header: "Identified",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "status", header: "Status" },
							{
								key: "outreach",
								header: "Outreach",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "action", header: "Last Action" },
							{
								key: "assigned",
								header: "Assigned To",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "actions", header: "Actions", align: "right" },
						]}
						rows={filteredGaps.map((gap) => ({
							id: (
								<Button
									variant="link"
									className="h-auto p-0 text-sm text-primary"
								>
									{gap.memberId}
								</Button>
							),
							name: gap.memberName,
							dob: gap.dob,
							plan: gap.planName,
							reason: gap.gapReason,
							identified: gap.dateIdentified,
							status: (
								<span
									className={cn(
										CMS_EDGE_STATUS_PILL_CLASS,
										getGapStatusStyle(gap.status)
									)}
								>
									{gap.status}
								</span>
							),
							outreach: gap.outreachDate,
							action: gap.lastAction,
							assigned: gap.assignedTo,
							actions: (
								<Button variant="ghost" size="icon" className="size-8">
									<MoreVertical className="size-4" />
								</Button>
							),
						}))}
						getRowKey={(_, index) =>
							filteredGaps[index]?.memberId ?? String(index)
						}
					/>
					<MeasureTablePagination
						shown={filteredGaps.length}
						total={data.totalGaps}
					/>
				</MeasureSectionPanel>

				<div className="space-y-3">
					<MeasureSectionPanel
						title="Closure by Plan"
						subtitle="Rate by insurance plan"
						bodyClassName="p-0"
					>
						<MeasureDataTable
							columns={[
								{ key: "plan", header: "Plan" },
								{
									key: "rate",
									header: "Rate",
									align: "right",
									className: "font-semibold text-primary",
								},
							]}
							rows={data.byPlan.map((row) => ({
								plan: row.planName,
								rate: `${row.closureRate.toFixed(2)}%`,
							}))}
							getRowKey={(row) => String(row.plan)}
						/>
					</MeasureSectionPanel>

					<MeasureSectionPanel
						title="Recent Activities"
						subtitle="Latest gap closure events"
						bodyClassName="p-0"
					>
						<ul className="space-y-3">
							{data.recentActivities.map((activity) => (
								<li key={activity.id} className="flex gap-3">
									<ActivityIcon type={activity.type} />
									<div className="min-w-0 flex-1">
										<p className="text-sm leading-snug text-foreground">
											{activity.message}
										</p>
										<p className="mt-0.5 text-xs text-muted-foreground">
											{activity.timestamp}
										</p>
									</div>
								</li>
							))}
						</ul>
					</MeasureSectionPanel>
				</div>
			</div>
		</div>
	);
}
