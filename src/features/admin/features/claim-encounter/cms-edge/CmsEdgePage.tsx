"use client";

import { useState } from "react";

import { CalendarDays, SlidersHorizontal } from "lucide-react";

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
import { CmsEdgeProvidersTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeProvidersTab";
import { CMS_EDGE_TAB_TRIGGER_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
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

export function CmsEdgePage() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [activeTab, setActiveTab] = useState<CmsEdgeTabId>("overview");
	const tabMeta = CMS_EDGE_TAB_META[activeTab];

	return (
		<div className="space-y-0">
			<div className="pb-3">
				<ClaimPageHeader
					title={tabMeta.title}
					description={tabMeta.description}
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
				<div className="border-b border-border/70 bg-card">
					<ScrollArea
						type="always"
						className="w-full"
						scrollbarClassName="h-2.5"
					>
						<TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
							{CMS_EDGE_TABS.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className={CMS_EDGE_TAB_TRIGGER_CLASS}
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</ScrollArea>
				</div>

				<div className="bg-muted/30 py-4">
					<TabsContent value="overview" className="mt-0 space-y-0">
						<CmsEdgeOverviewTab />
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
