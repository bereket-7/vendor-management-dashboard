"use client";

import { ExternalLink, MoreVertical, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	MEASURE_CALLOUT,
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureAsOfBar,
	MeasureBulletList,
	MeasureDataTable,
	MeasureFieldGrid,
	MeasureKpiCard,
	MeasureSectionPanel,
	MeasureStatTile,
	MeasureSubsection,
	MeasureTablePagination,
	PanelLink,
	PdfLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasureDenominatorDetail } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";

export function MeasureDetailDenominatorTab({
	data,
	measurementYear,
}: {
	data: MeasureDenominatorDetail;
	measurementYear: string;
}) {
	const summary = data.summary;

	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MeasureKpiCard
					label="Total Denominator"
					value={summary.totalDenominator.toLocaleString()}
					icon={Users}
					tone="primary"
				/>
				<MeasureKpiCard
					label="Commercial"
					value={summary.commercial.toLocaleString()}
					hint={`${((summary.commercial / summary.totalDenominator) * 100).toFixed(1)}% of total`}
				/>
				<MeasureKpiCard
					label="Medicaid"
					value={summary.medicaid.toLocaleString()}
					hint={`${((summary.medicaid / summary.totalDenominator) * 100).toFixed(1)}% of total`}
				/>
				<MeasureKpiCard
					label="Medicare"
					value={summary.medicare.toLocaleString()}
					hint={`${((summary.medicare / summary.totalDenominator) * 100).toFixed(1)}% of total`}
				/>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
				<MeasureSectionPanel
					title="Denominator Definition"
					subtitle="Members included in the measure denominator after clinical criteria"
					action={<PdfLink label="View Full Definition (PDF)" />}
					bodyClassName="space-y-3 p-0"
				>
					<div className={MEASURE_CALLOUT}>
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Description
						</p>
						<p className="mt-2 text-sm leading-relaxed text-foreground">
							{data.definition}
						</p>
					</div>

					<MeasureSubsection
						title="Denominator Criteria"
						description="Clinical and administrative rules for denominator inclusion"
					>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{data.criteria}
						</p>
					</MeasureSubsection>

					<MeasureSubsection
						title="Data Sources"
						description="Systems and files used to identify denominator members"
					>
						<MeasureBulletList items={data.dataSources} />
					</MeasureSubsection>

					<MeasureSubsection title="Enrollment & Timing">
						<MeasureFieldGrid
							fields={[
								{ label: "Look-Back Period", value: data.lookBackPeriod },
								{ label: "Age Calculation", value: data.ageCalculation },
								{
									label: "Continuous Enrollment",
									value: data.continuousEnrollment,
								},
							]}
							columns={3}
						/>
					</MeasureSubsection>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title={`Summary (${measurementYear})`}
					subtitle="Current counts by line of business"
					bodyClassName="space-y-3 p-0"
				>
					<MeasureAsOfBar asOf={data.summaryAsOf} />
					<div className="grid grid-cols-2 gap-3">
						<MeasureStatTile
							label="Total Denominator"
							value={summary.totalDenominator.toLocaleString()}
							accent="green"
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

			<MeasureSectionPanel
				title="Denominator Trend"
				subtitle="Monthly counts by line of business"
				action={
					<PanelLink icon={<ExternalLink className="size-3.5" />}>
						View Trend Chart
					</PanelLink>
				}
				bodyClassName="p-0"
			>
				<MeasureDataTable
					columns={[
						{ key: "month", header: "Month" },
						{ key: "commercial", header: "Commercial", align: "right" },
						{ key: "medicaid", header: "Medicaid", align: "right" },
						{ key: "medicare", header: "Medicare", align: "right" },
						{
							key: "total",
							header: "Total",
							align: "right",
							className: "font-semibold",
						},
					]}
					rows={data.trend.map((row) => ({
						month: row.month,
						commercial: row.commercial.toLocaleString(),
						medicaid: row.medicaid.toLocaleString(),
						medicare: row.medicare.toLocaleString(),
						total: row.total.toLocaleString(),
					}))}
					getRowKey={(row) => String(row.month)}
				/>
			</MeasureSectionPanel>

			<MeasureSectionPanel
				title="Denominator by Plan"
				subtitle="Plan-level breakdown of denominator members"
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
							header: "Total Denominator",
							align: "right",
							className: "font-semibold",
						},
						{ key: "commercial", header: "Commercial", align: "right" },
						{ key: "medicaid", header: "Medicaid", align: "right" },
						{ key: "medicare", header: "Medicare", align: "right" },
						{
							key: "pct",
							header: "% of Total",
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
						total: plan.totalDenominator.toLocaleString(),
						commercial:
							plan.commercial > 0 ? plan.commercial.toLocaleString() : "—",
						medicaid: plan.medicaid > 0 ? plan.medicaid.toLocaleString() : "—",
						medicare: plan.medicare > 0 ? plan.medicare.toLocaleString() : "—",
						pct: `${plan.pctOfTotal.toFixed(2)}%`,
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
