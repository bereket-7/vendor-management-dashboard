"use client";

import { Ban, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureAsOfBar,
	MeasureBulletList,
	MeasureDataTable,
	MeasureKpiCard,
	MeasureNumberedList,
	MeasureReasonBar,
	MeasureSectionPanel,
	MeasureStatTile,
	MeasureSubsection,
	MeasureTablePagination,
	PdfLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasureExclusionsDetail } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";

const REASON_COLORS = [
	"var(--primary)",
	"color-mix(in oklch, var(--primary) 72%, white)",
	"color-mix(in oklch, var(--primary) 48%, white)",
	"#d97706",
	"#dc2626",
	"color-mix(in oklch, var(--primary) 58%, white)",
	"color-mix(in oklch, var(--primary) 38%, white)",
];

export function MeasureDetailExclusionsTab({
	data,
	measurementYear,
}: {
	data: MeasureExclusionsDetail;
	measurementYear: string;
}) {
	const summary = data.summary;
	const maxReasonTotal = Math.max(...data.byReason.map((r) => r.total), 1);

	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MeasureKpiCard
					label="Total Exclusions"
					value={summary.totalExclusions.toLocaleString()}
					icon={Ban}
					tone="warning"
				/>
				<MeasureKpiCard
					label="Commercial"
					value={summary.commercial.toLocaleString()}
					hint={`${((summary.commercial / summary.totalExclusions) * 100).toFixed(1)}% of total`}
				/>
				<MeasureKpiCard
					label="Medicaid"
					value={summary.medicaid.toLocaleString()}
					hint={`${((summary.medicaid / summary.totalExclusions) * 100).toFixed(1)}% of total`}
				/>
				<MeasureKpiCard
					label="Medicare"
					value={summary.medicare.toLocaleString()}
					hint={`${((summary.medicare / summary.totalExclusions) * 100).toFixed(1)}% of total`}
				/>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
				<MeasureSectionPanel
					title="Exclusions Definition"
					subtitle="Members removed from the denominator before rate calculation"
					action={<PdfLink label="View Full Exclusions Definition (PDF)" />}
					bodyClassName="space-y-3 p-0"
				>
					<div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-800 dark:text-amber-200">
							Overview
						</p>
						<p className="mt-2 text-sm leading-relaxed text-foreground">
							{data.intro}
						</p>
					</div>

					<MeasureSubsection
						title="General Exclusion Criteria"
						description="Conditions that remove a member from the measure denominator"
					>
						<MeasureNumberedList items={data.generalExclusionCriteria} />
					</MeasureSubsection>

					<MeasureSubsection
						title="Data Sources"
						description="Systems used to identify excluded members"
					>
						<MeasureBulletList items={data.dataSources} />
					</MeasureSubsection>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title={`Summary (${measurementYear})`}
					subtitle="Exclusion counts by line of business"
					bodyClassName="space-y-3 p-0"
				>
					<MeasureAsOfBar asOf={data.summaryAsOf} />
					<div className="grid grid-cols-2 gap-3">
						<MeasureStatTile
							label="Total Exclusions"
							value={summary.totalExclusions.toLocaleString()}
							accent="amber"
						/>
						<MeasureStatTile
							label="Commercial"
							value={summary.commercial.toLocaleString()}
						/>
						<MeasureStatTile
							label="Medicaid"
							value={summary.medicaid.toLocaleString()}
						/>
						<MeasureStatTile
							label="Medicare"
							value={summary.medicare.toLocaleString()}
						/>
						<MeasureStatTile label="Total Plans" value={summary.totalPlans} />
						<MeasureStatTile label="Total Groups" value={summary.totalGroups} />
					</div>
				</MeasureSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<MeasureSectionPanel
					title="Exclusions by Reason"
					subtitle="Distribution of exclusion counts across reason codes"
					bodyClassName="space-y-3 p-0"
				>
					{data.byReason.map((row, index) => (
						<MeasureReasonBar
							key={row.reason}
							label={row.reason}
							value={row.total}
							max={maxReasonTotal}
							pct={row.pctOfTotal}
							color={REASON_COLORS[index % REASON_COLORS.length] ?? "#64748b"}
						/>
					))}
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Exclusions by Reason — Detail"
					subtitle="Line-of-business breakdown per exclusion reason"
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "reason", header: "Exclusion Reason" },
							{ key: "commercial", header: "Commercial", align: "right" },
							{ key: "medicaid", header: "Medicaid", align: "right" },
							{ key: "medicare", header: "Medicare", align: "right" },
							{
								key: "total",
								header: "Total",
								align: "right",
								className: "font-semibold",
							},
							{
								key: "pct",
								header: "% of Total",
								align: "right",
								className: MEASURE_TABLE_MUTED,
							},
						]}
						rows={[
							...data.byReason.map((row) => ({
								reason: row.reason,
								commercial: row.commercial.toLocaleString(),
								medicaid: row.medicaid.toLocaleString(),
								medicare: row.medicare.toLocaleString(),
								total: row.total.toLocaleString(),
								pct: `${row.pctOfTotal.toFixed(2)}%`,
							})),
							{
								reason: <span className="font-semibold">Total</span>,
								commercial: summary.commercial.toLocaleString(),
								medicaid: summary.medicaid.toLocaleString(),
								medicare: summary.medicare.toLocaleString(),
								total: summary.totalExclusions.toLocaleString(),
								pct: "100.00%",
							},
						]}
						getRowKey={(row, index) =>
							index === data.byReason.length ? "total" : String(row.reason)
						}
					/>
				</MeasureSectionPanel>
			</div>

			<MeasureSectionPanel
				title="Exclusions by Plan"
				subtitle="Plan-level exclusion counts and % of denominator"
				bodyClassName="p-0"
			>
				<MeasureDataTable
					columns={[
						{ key: "id", header: "Plan ID", className: "font-mono text-xs" },
						{ key: "name", header: "Plan Name" },
						{
							key: "lob",
							header: "Line of Business",
							className: MEASURE_TABLE_MUTED,
						},
						{
							key: "total",
							header: "Total Exclusions",
							align: "right",
							className: "font-semibold",
						},
						{ key: "commercial", header: "Commercial", align: "right" },
						{ key: "medicaid", header: "Medicaid", align: "right" },
						{ key: "medicare", header: "Medicare", align: "right" },
						{
							key: "pct",
							header: "% of Denominator",
							align: "right",
							className: MEASURE_TABLE_MUTED,
						},
						{
							key: "refresh",
							header: "Last Refresh",
							className: MEASURE_TABLE_MUTED,
						},
						{ key: "actions", header: "Actions", align: "right" },
					]}
					rows={data.plans.map((plan) => ({
						id: plan.id,
						name: plan.name,
						lob: plan.lineOfBusiness,
						total: plan.totalExclusions.toLocaleString(),
						commercial:
							plan.commercial > 0 ? plan.commercial.toLocaleString() : "—",
						medicaid: plan.medicaid > 0 ? plan.medicaid.toLocaleString() : "—",
						medicare: plan.medicare > 0 ? plan.medicare.toLocaleString() : "—",
						pct: `${plan.pctOfDenominator.toFixed(2)}%`,
						refresh: plan.lastRefresh,
						actions: (
							<Button variant="ghost" size="icon" className="size-8">
								<MoreVertical className="size-4" />
							</Button>
						),
					}))}
					getRowKey={(row) => String(row.id)}
				/>
				<MeasureTablePagination
					shown={data.plans.length}
					total={data.totalPlanEntries}
				/>
			</MeasureSectionPanel>
		</div>
	);
}
