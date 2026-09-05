"use client";

import { useState } from "react";

import {
	CalendarDays,
	ClipboardList,
	FileOutput,
	FileText,
	LayoutDashboard,
	type LucideIcon,
	Pill,
	Settings2,
	SlidersHorizontal,
	Stethoscope,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CmsEdgeClaimsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeClaimsTab";
import { CmsEdgeConfigurationTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeConfigurationTab";
import { CmsEdgeFileGenerationTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeFileGenerationTab";
import { CmsEdgeMembersEnrollmentTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeMembersEnrollmentTab";
import { CmsEdgeOverviewTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeOverviewTab";
import { CmsEdgePharmacyClaimsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgePharmacyClaimsTab";
import { CmsEdgeProvidersTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeProvidersTab";
import {
	CMS_EDGE_TAB_HAIRLINE_CLASS,
	CMS_EDGE_TAB_ICON_WELL_CLASS,
	CMS_EDGE_TAB_NAV_CLASS,
	CMS_EDGE_TAB_TRIGGER_CLASS,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { CmsEdgeSupplementalDiagnosesTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeSupplementalDiagnosesTab";
import {
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_TABS,
	CMS_EDGE_TAB_META,
	type CmsEdgeTabId,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import { cn } from "@/lib/utils";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const toolbarField = cn(
	"h-9 w-[148px] rounded-sm border-border bg-background text-xs shadow-none",
	"hover:border-foreground/20",
	"focus:ring-2 focus:ring-primary/15"
);

const TAB_ICONS: Record<CmsEdgeTabId, LucideIcon> = {
	overview: LayoutDashboard,
	"members-enrollment": Users,
	providers: Stethoscope,
	claims: FileText,
	"pharmacy-claims": Pill,
	"supplemental-diagnoses": ClipboardList,
	"file-generation": FileOutput,
	configuration: Settings2,
};

export function CmsEdgePage() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [activeTab, setActiveTab] = useState<CmsEdgeTabId>("overview");
	const pageMeta = CMS_EDGE_TAB_META.overview;

	return (
		<div className="space-y-0">
			<div className="pb-3">
				<ClaimPageHeader
					title={pageMeta.title}
					description={pageMeta.description}
					actions={
						<div className="flex items-center gap-1.5">
							<Select
								value={reportingPeriod}
								onValueChange={setReportingPeriod}
							>
								<SelectTrigger className={toolbarField}>
									<CalendarDays className="size-3.5 text-muted-foreground" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CMS_EDGE_REPORTING_PERIODS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label.split(" (")[0]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								size="sm"
								className={cn(toolbarBtn, "border-border bg-background")}
							>
								<SlidersHorizontal className="size-3.5" />
								Filters
							</Button>
						</div>
					}
				/>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as CmsEdgeTabId)}
			>
				<nav aria-label="CMS EDGE sections" className={CMS_EDGE_TAB_NAV_CLASS}>
					<ScrollArea
						type="always"
						className="w-full"
						scrollbarClassName="h-2.5"
					>
						<TabsList className="inline-flex h-auto w-max min-w-full items-end justify-start gap-1 rounded-none bg-transparent p-0">
							{CMS_EDGE_TABS.map((tab) => {
								const Icon = TAB_ICONS[tab.id];
								return (
									<TabsTrigger
										key={tab.id}
										value={tab.id}
										className={CMS_EDGE_TAB_TRIGGER_CLASS}
									>
										<span className={CMS_EDGE_TAB_ICON_WELL_CLASS}>
											<Icon className="size-3.5" />
										</span>
										<span>{tab.label}</span>
										<span aria-hidden className={CMS_EDGE_TAB_HAIRLINE_CLASS} />
									</TabsTrigger>
								);
							})}
						</TabsList>
					</ScrollArea>
				</nav>

				<div className="bg-muted/30 py-4">
					<TabsContent value="overview" className="mt-0 space-y-0">
						<CmsEdgeOverviewTab
							onNavigateTab={(tabId) => {
								if (tabId === "exceptions") return;
								setActiveTab(tabId);
							}}
						/>
					</TabsContent>
					<TabsContent value="members-enrollment" className="mt-0 space-y-0">
						<CmsEdgeMembersEnrollmentTab />
					</TabsContent>
					<TabsContent value="providers" className="mt-0 space-y-0">
						<CmsEdgeProvidersTab />
					</TabsContent>
					<TabsContent value="claims" className="mt-0 space-y-0">
						<CmsEdgeClaimsTab />
					</TabsContent>
					<TabsContent value="pharmacy-claims" className="mt-0 space-y-0">
						<CmsEdgePharmacyClaimsTab />
					</TabsContent>
					<TabsContent
						value="supplemental-diagnoses"
						className="mt-0 space-y-0"
					>
						<CmsEdgeSupplementalDiagnosesTab />
					</TabsContent>
					<TabsContent value="file-generation" className="mt-0 space-y-0">
						<CmsEdgeFileGenerationTab />
					</TabsContent>
					<TabsContent value="configuration" className="mt-0 space-y-0">
						<CmsEdgeConfigurationTab />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
