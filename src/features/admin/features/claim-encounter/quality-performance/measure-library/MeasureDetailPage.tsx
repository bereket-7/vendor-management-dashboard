"use client";

import { useState } from "react";

import { ArrowDownRight, ArrowLeft, ArrowUpRight, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { MeasureDetailDenominatorTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailDenominatorTab";
import { MeasureDetailDocumentsTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailDocumentsTab";
import { MeasureDetailEligiblePopulationTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailEligiblePopulationTab";
import { MeasureDetailExclusionsTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailExclusionsTab";
import { MeasureDetailGapClosureTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailGapClosureTab";
import { MeasureDetailHistoryTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailHistoryTab";
import { MeasureDetailMembersTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailMembersTab";
import { MeasureDetailNumeratorTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailNumeratorTab";
import { MeasureDetailOverviewTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailOverviewTab";
import { MeasureDetailPerformanceTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailPerformanceTab";
import { MeasureDetailProvidersTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailProvidersTab";
import { MeasureDetailSpecificationsTab } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailSpecificationsTab";
import {
	MEASURE_DETAIL_TABS,
	type MeasureDetail,
	type MeasureDetailTab,
	getMeasureDenominator,
	getMeasureDocuments,
	getMeasureEligiblePopulation,
	getMeasureExclusions,
	getMeasureGapClosure,
	getMeasureHistory,
	getMeasureMembers,
	getMeasureNumerator,
	getMeasurePerformance,
	getMeasureProviders,
	getMeasureSpecifications,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL = CMS_EDGE_PANEL_CLASS;

const MEASURE_DETAIL_TAB_TRIGGER = cn(
	"rounded-none border-b-2 border-transparent px-2.5 py-2.5 text-xs font-medium shadow-none transition-colors",
	"text-muted-foreground hover:bg-primary/5 hover:text-foreground",
	"data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
);

function MetadataBar({ measure }: { measure: MeasureDetail }) {
	const fields = [
		{ label: "Measure ID", value: measure.id },
		{ label: "NCQA ID", value: measure.ncqaMeasureId },
		{ label: "Measure Set", value: measure.measureSet },
		{ label: "Domain", value: measure.domain },
		{ label: "Subdomain", value: measure.subdomain },
		{ label: "Meas. Year", value: measure.measurementYear },
		{ label: "Owner", value: measure.owner },
		{ label: "Updated", value: measure.lastUpdated },
	];

	return (
		<section className={cn(PANEL, "overflow-hidden")}>
			<div className="grid grid-cols-2 divide-y divide-border/50 sm:grid-cols-4 sm:divide-x sm:divide-y-0 xl:grid-cols-8">
				{fields.map((field) => (
					<div key={field.label} className="min-w-0 px-3 py-2.5">
						<p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							{field.label}
						</p>
						<p
							className="mt-1 truncate text-xs font-semibold text-foreground"
							title={String(field.value)}
						>
							{field.value}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function PlaceholderTab({ tab }: { tab: MeasureDetailTab }) {
	return (
		<div className={cn(PANEL, "px-4 py-12 text-center")}>
			<p className="text-sm font-medium text-foreground">{tab}</p>
			<p className="mt-2 text-xs text-muted-foreground">
				Detailed {tab.toLowerCase()} content for this measure will appear here.
			</p>
		</div>
	);
}

export function MeasureDetailPage({ measure }: { measure: MeasureDetail }) {
	const [activeTab, setActiveTab] = useState<MeasureDetailTab>("Overview");
	const specifications = getMeasureSpecifications(measure.id);
	const eligiblePopulation = getMeasureEligiblePopulation(measure.id);
	const denominator = getMeasureDenominator(measure.id);
	const numerator = getMeasureNumerator(measure.id);
	const exclusions = getMeasureExclusions(measure.id);
	const performance = getMeasurePerformance(measure.id);
	const members = getMeasureMembers(measure.id);
	const providers = getMeasureProviders(measure.id);
	const gapClosure = getMeasureGapClosure(measure.id);
	const documents = getMeasureDocuments(measure.id);
	const history = getMeasureHistory(measure.id);

	const varianceNegative = measure.varianceToGoal < 0;
	const onTarget = measure.complianceRate >= measure.planGoal;

	const placeholderTabs = MEASURE_DETAIL_TABS.filter(
		(tab) =>
			tab !== "Overview" &&
			tab !== "Specifications" &&
			tab !== "Eligible Population" &&
			tab !== "Denominator" &&
			tab !== "Numerator" &&
			tab !== "Exclusions" &&
			tab !== "Performance" &&
			tab !== "Members" &&
			tab !== "Providers" &&
			tab !== "Gap Closure" &&
			tab !== "Documents" &&
			tab !== "History"
	);

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
						asChild
					>
						<Link href="/admin/claim-encounter/regulatory/quality-performance/measure-library">
							<ArrowLeft className="mr-1.5 size-3.5" />
							Back to Measure Library
						</Link>
					</Button>
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							<span className="font-mono text-primary">{measure.id}</span>
							<span className="text-muted-foreground"> — </span>
							{measure.name}
						</h1>
						<span
							className={cn(
								CMS_EDGE_STATUS_PILL_CLASS,
								measure.status === "Active"
									? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
									: "border-border bg-muted text-muted-foreground"
							)}
						>
							{measure.status}
						</span>
						<span
							className={cn(
								CMS_EDGE_STATUS_PILL_CLASS,
								"border-primary/30 bg-primary/10 text-primary"
							)}
						>
							{measure.reportingStatus}
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						{measure.measureSet} · {measure.domain} · {measure.measurementYear}
					</p>
				</div>

				<div
					className={cn(
						PANEL,
						"flex min-w-[11rem] items-center gap-3 border-l-2 border-l-primary px-4 py-3"
					)}
				>
					<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
						<Gauge className="size-4" />
					</span>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
							Compliance
						</p>
						<p className="text-2xl font-semibold tabular-nums text-primary">
							{measure.complianceRate.toFixed(1)}%
						</p>
						<p
							className={cn(
								"mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium",
								onTarget
									? "text-emerald-700 dark:text-emerald-300"
									: "text-amber-700 dark:text-amber-300"
							)}
						>
							{varianceNegative ? (
								<ArrowDownRight className="size-3" />
							) : (
								<ArrowUpRight className="size-3" />
							)}
							{varianceNegative ? "" : "+"}
							{measure.varianceToGoal.toFixed(1)}% vs goal
						</p>
					</div>
				</div>
			</div>

			<MetadataBar measure={measure} />

			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as MeasureDetailTab)}
			>
				<div className={cn(PANEL, "overflow-x-auto rounded-b-none border-b-0")}>
					<TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
						{MEASURE_DETAIL_TABS.map((tab) => (
							<TabsTrigger
								key={tab}
								value={tab}
								className={MEASURE_DETAIL_TAB_TRIGGER}
							>
								{tab}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				<div className={cn(PANEL, "rounded-t-none p-3")}>
					<TabsContent value="Overview" className="mt-0">
						<MeasureDetailOverviewTab measure={measure} />
					</TabsContent>

					<TabsContent value="Specifications" className="mt-0">
						<MeasureDetailSpecificationsTab specifications={specifications} />
					</TabsContent>

					<TabsContent value="Eligible Population" className="mt-0">
						<MeasureDetailEligiblePopulationTab
							data={eligiblePopulation}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Denominator" className="mt-0">
						<MeasureDetailDenominatorTab
							data={denominator}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Numerator" className="mt-0">
						<MeasureDetailNumeratorTab
							data={numerator}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Exclusions" className="mt-0">
						<MeasureDetailExclusionsTab
							data={exclusions}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Performance" className="mt-0">
						<MeasureDetailPerformanceTab
							data={performance}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Members" className="mt-0">
						<MeasureDetailMembersTab
							data={members}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Providers" className="mt-0">
						<MeasureDetailProvidersTab data={providers} />
					</TabsContent>

					<TabsContent value="Gap Closure" className="mt-0">
						<MeasureDetailGapClosureTab
							data={gapClosure}
							measurementYear={measure.measurementYear}
						/>
					</TabsContent>

					<TabsContent value="Documents" className="mt-0">
						<MeasureDetailDocumentsTab data={documents} />
					</TabsContent>

					<TabsContent value="History" className="mt-0">
						<MeasureDetailHistoryTab data={history} />
					</TabsContent>

					{placeholderTabs.map((tab) => (
						<TabsContent key={tab} value={tab} className="mt-0">
							<PlaceholderTab tab={tab} />
						</TabsContent>
					))}
				</div>
			</Tabs>
		</div>
	);
}
