"use client";

import {
	CalendarClock,
	Download,
	Gauge,
	Target,
	TrendingDown,
	Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureActivityList,
	MeasureDataTable,
	MeasureFieldGrid,
	MeasureKpiCard,
	MeasurePipeline,
	MeasureSectionPanel,
	MeasureStatTile,
	MeasureStatusPill,
	MeasureSubsection,
	PanelLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasureDetail } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";

export function MeasureDetailOverviewTab({
	measure,
}: {
	measure: MeasureDetail;
}) {
	const perf = measure.performanceSummary;
	const varianceNegative = measure.varianceToGoal < 0;

	return (
		<div className={MEASURE_TAB_STACK}>
			{/* Primary KPIs */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<MeasureKpiCard
					label="Compliance Rate"
					value={`${measure.complianceRate.toFixed(1)}%`}
					hint={`Plan goal: ${measure.planGoal.toFixed(1)}%`}
					icon={Gauge}
					tone="primary"
					className="xl:col-span-1"
				/>
				<MeasureKpiCard
					label="Variance to Goal"
					value={`${varianceNegative ? "" : "+"}${measure.varianceToGoal.toFixed(1)}%`}
					hint={varianceNegative ? "Below target" : "At or above target"}
					icon={TrendingDown}
					tone={varianceNegative ? "danger" : "success"}
				/>
				<MeasureKpiCard
					label="Plan Goal"
					value={`${measure.planGoal.toFixed(1)}%`}
					icon={Target}
				/>
				<MeasureKpiCard
					label="Open Gaps"
					value={perf.openGaps.toLocaleString()}
					hint="Members needing outreach"
					icon={Users}
					tone="warning"
				/>
				<MeasureKpiCard
					label="Closed Gaps"
					value={perf.closedGaps.toLocaleString()}
					hint="Successfully closed this period"
					tone="success"
				/>
			</div>

			{/* Main overview + status sidebar */}
			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
				<MeasureSectionPanel
					title="Measure Overview"
					subtitle="Clinical definition, population scope, and calculation approach"
					bodyClassName="space-y-3 p-0"
				>
					<div className="rounded-sm border border-primary/15 bg-primary/5 px-3 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Description
						</p>
						<p className="mt-2 text-sm leading-relaxed text-foreground">
							{measure.description}
						</p>
					</div>

					<MeasureSubsection
						title="Population & Coverage"
						description="Who is included and where the measure applies"
					>
						<MeasureFieldGrid
							fields={[
								{ label: "Age Range", value: measure.ageRange },
								{ label: "Measurement Year", value: measure.measurementYear },
								{
									label: "Eligible Population",
									value: measure.eligiblePopulation,
								},
								{ label: "Reporting Plan(s)", value: measure.reportingPlans },
								{ label: "Line of Business", value: measure.lineOfBusiness },
								{ label: "Care Setting", value: measure.careSetting },
							]}
						/>
					</MeasureSubsection>

					<MeasureSubsection
						title="Data & Collection"
						description="Sources and methods used to calculate this measure"
					>
						<MeasureFieldGrid
							fields={[
								{ label: "Data Sources", value: measure.dataSources },
								{ label: "Collection Method", value: measure.collectionMethod },
								{
									label: "Calculation Method",
									value: measure.calculationMethod,
								},
								{ label: "Frequency", value: measure.frequency },
							]}
						/>
					</MeasureSubsection>

					<MeasureSubsection title="Measure Logic">
						<MeasureFieldGrid
							fields={[
								{ label: "Inverse Measure", value: measure.inverseMeasure },
								{
									label: "Higher Rate is Better",
									value: measure.higherRateIsBetter,
								},
							]}
							columns={2}
						/>
					</MeasureSubsection>
				</MeasureSectionPanel>

				<div className="space-y-3">
					<MeasureSectionPanel
						title="Measure Status"
						bodyClassName="space-y-3 p-0"
					>
						<div className="flex flex-wrap gap-2">
							<MeasureStatusPill label={measure.status} tone="success" />
							<MeasureStatusPill label={measure.reportingStatus} tone="info" />
						</div>

						<div className="grid grid-cols-2 gap-3">
							<MeasureStatTile
								label="Compliance"
								value={`${measure.complianceRate.toFixed(1)}%`}
								accent="green"
							/>
							<MeasureStatTile
								label="Goal"
								value={`${measure.planGoal.toFixed(1)}%`}
							/>
							<MeasureStatTile
								label="Variance"
								value={`${measure.varianceToGoal > 0 ? "+" : ""}${measure.varianceToGoal.toFixed(1)}%`}
								accent={varianceNegative ? "red" : "green"}
							/>
							<MeasureStatTile
								label="Rate (MY)"
								value={`${perf.complianceRate.toFixed(1)}%`}
							/>
						</div>
					</MeasureSectionPanel>

					<MeasureSectionPanel
						title="Refresh Schedule"
						bodyClassName="space-y-2 p-0"
					>
						<div className="flex items-start gap-3 rounded-sm border border-primary/15 bg-primary/5 px-3 py-2.5">
							<CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
							<div className="space-y-2 text-sm">
								<div>
									<p className="text-xs text-muted-foreground">
										Last Calculated
									</p>
									<p className="font-medium text-foreground">
										{measure.lastCalculated}
									</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Next Refresh</p>
									<p className="font-medium text-foreground">
										{measure.nextRefresh}
									</p>
								</div>
							</div>
						</div>
						<div className="space-y-2 border-t border-border/50 pt-3 text-sm">
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">Created By</span>
								<span className="text-right font-medium">
									{measure.createdBy}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">Created On</span>
								<span className="text-right font-medium">
									{measure.createdOn}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">Last Updated By</span>
								<span className="text-right font-medium">
									{measure.lastUpdatedBy}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">Last Updated</span>
								<span className="text-right font-medium">
									{measure.lastUpdated}
								</span>
							</div>
						</div>
					</MeasureSectionPanel>
				</div>
			</div>

			{/* Performance pipeline */}
			<MeasureSectionPanel
				title={`Performance Summary (${measure.measurementYear})`}
				subtitle="Population flow from eligibility through numerator compliance"
				action={<PanelLink>View Performance Details</PanelLink>}
				bodyClassName="space-y-3 p-0"
			>
				<MeasurePipeline
					steps={[
						{ label: "Eligible Population", value: perf.eligiblePopulation },
						{ label: "Denominator", value: perf.denominator },
						{ label: "Exclusions", value: perf.exclusions },
						{ label: "Numerator", value: perf.numerator },
						{
							label: "Compliance Rate",
							value: `${perf.complianceRate.toFixed(1)}%`,
							description: "Numerator ÷ Denominator",
						},
					]}
				/>
			</MeasureSectionPanel>

			{/* Recent activity — full width, readable list */}
			<MeasureSectionPanel
				title="Recent Activity"
				subtitle="Latest changes and calculations for this measure"
				action={<PanelLink>View All History</PanelLink>}
				bodyClassName="p-0"
			>
				<MeasureActivityList items={measure.recentActivity} />
			</MeasureSectionPanel>

			{/* Related measures + documents */}
			<div className="grid gap-3 lg:grid-cols-2">
				<MeasureSectionPanel
					title="Related Measures"
					subtitle="Linked or complementary HEDIS measures"
					action={<PanelLink>View All Related Measures</PanelLink>}
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{
								key: "id",
								header: "Measure ID",
								className: "font-mono text-xs",
							},
							{ key: "name", header: "Name" },
							{
								key: "relationship",
								header: "Relationship",
								className: MEASURE_TABLE_MUTED,
							},
						]}
						rows={measure.relatedMeasures.map((row) => ({
							id: row.id,
							name: row.name,
							relationship: row.relationship,
						}))}
						getRowKey={(row) => String(row.id)}
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Documents"
					subtitle="Specifications, reports, and supporting files"
					action={<PanelLink>View All Documents</PanelLink>}
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "name", header: "Document" },
							{ key: "type", header: "Type", className: MEASURE_TABLE_MUTED },
							{ key: "updated", header: "Updated", className: "tabular-nums" },
							{ key: "actions", header: "Actions", align: "right" },
						]}
						rows={measure.documents.map((row) => ({
							name: row.name,
							type: row.type,
							updated: row.updated,
							actions: (
								<Button
									variant="ghost"
									size="icon"
									className="size-8"
									onClick={() => toast.message(`Downloading ${row.name}`)}
								>
									<Download className="size-4" />
								</Button>
							),
						}))}
						getRowKey={(_, index) =>
							measure.documents[index]?.id ?? String(index)
						}
					/>
				</MeasureSectionPanel>
			</div>

			{/* Notes */}
			<MeasureSectionPanel
				title="Measure Notes"
				subtitle="Internal annotations and operational context"
				action={
					<Button variant="outline" size="sm" className="h-8 text-sm">
						Edit Notes
					</Button>
				}
				bodyClassName="p-0"
			>
				<p className="text-sm leading-relaxed text-foreground">
					{measure.notes}
				</p>
			</MeasureSectionPanel>
		</div>
	);
}
