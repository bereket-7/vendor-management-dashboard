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
import { CmsEdgeExceptionsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeExceptionsTab";
import { CmsEdgeFileGenerationTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeFileGenerationTab";
import { CmsEdgeMembersEnrollmentTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeMembersEnrollmentTab";
import { CmsEdgeOverviewTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeOverviewTab";
import { CmsEdgeProvidersTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeProvidersTab";
import { CmsEdgeReconciliationTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReconciliationTab";
import { CmsEdgeResponsesTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeResponsesTab";
import { CMS_EDGE_TAB_TRIGGER_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { CmsEdgeSubmissionsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeSubmissionsTab";
import {
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_TABS,
	CMS_EDGE_TAB_META,
	type CmsEdgeTabId,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";

export function CmsEdgePage() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [activeTab, setActiveTab] = useState<CmsEdgeTabId>("overview");
	const tabMeta = CMS_EDGE_TAB_META[activeTab];

	return (
		<div className="space-y-0">
			<div className="space-y-4 pb-4">
				<ClaimPageHeader
					title={tabMeta.title}
					description={tabMeta.description}
					actions={
						<>
							<div className="flex items-center gap-2">
								<span className="text-xs font-medium text-muted-foreground">
									Reporting Period
								</span>
								<Select
									value={reportingPeriod}
									onValueChange={setReportingPeriod}
								>
									<SelectTrigger className="h-9 w-[280px] border-border/70 bg-card shadow-sm">
										<CalendarDays className="mr-2 size-3.5 text-muted-foreground" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CMS_EDGE_REPORTING_PERIODS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-border/70 bg-card shadow-sm"
							>
								<SlidersHorizontal className="mr-1.5 size-3.5" />
								Filters
							</Button>
						</>
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
					<TabsContent value="submissions" className="mt-0 space-y-0">
						<CmsEdgeSubmissionsTab />
					</TabsContent>
					<TabsContent value="cms-responses" className="mt-0 space-y-0">
						<CmsEdgeResponsesTab />
					</TabsContent>
					<TabsContent value="exceptions" className="mt-0 space-y-0">
						<CmsEdgeExceptionsTab />
					</TabsContent>
					<TabsContent value="reconciliation" className="mt-0 space-y-0">
						<CmsEdgeReconciliationTab />
					</TabsContent>
					<TabsContent value="configuration" className="mt-0 space-y-0">
						<CmsEdgeConfigurationTab />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
