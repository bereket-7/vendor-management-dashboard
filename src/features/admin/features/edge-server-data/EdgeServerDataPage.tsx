"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	HhsMasterDataUpdatesPanel,
	PublishedDateEdgePanel,
	QuarterlyBaselineReportPanel,
	ThresholdReportPanel,
} from "@/features/admin/features/edge-server-data/EdgeServerTabPanels";
import {
	EDGE_SERVER_TABS,
	type EdgeServerTabId,
} from "@/features/admin/features/edge-server-data/mock-data";
import { cn } from "@/lib/utils";

const TAB_TRIGGER_CLASS = cn(
	"rounded-md px-3 py-1.5 text-[11px] font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-primary",
	"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
);

function EdgeServerTabContent({ tabId }: { tabId: EdgeServerTabId }) {
	switch (tabId) {
		case "threshold-report":
			return <ThresholdReportPanel />;
		case "quarterly-baseline-report":
			return <QuarterlyBaselineReportPanel />;
		case "hhs-master-data-updates":
			return <HhsMasterDataUpdatesPanel />;
		default:
			return <PublishedDateEdgePanel tabId={tabId} />;
	}
}

export function EdgeServerDataPage() {
	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Edge Server Data"
				description="Review threshold, baseline, CMS, and HHS edge server reports by published date."
			/>

			<Tabs defaultValue="threshold-report" className="gap-4">
				<div className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
					<div className="border-b border-primary/15 px-4 pt-3">
						<TabsList className="inline-flex h-auto max-w-full flex-wrap justify-start gap-1 rounded-lg bg-muted/40 p-1">
							{EDGE_SERVER_TABS.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className={TAB_TRIGGER_CLASS}
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</div>

					<div className="p-4">
						{EDGE_SERVER_TABS.map((tab) => (
							<TabsContent key={tab.id} value={tab.id} className="mt-0">
								<EdgeServerTabContent tabId={tab.id} />
							</TabsContent>
						))}
					</div>
				</div>
			</Tabs>
		</div>
	);
}
