import { CmsEdgeReportingOverviewTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReportingOverviewTab";
import { CmsEdgeReportingShell } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReportingShell";

export default function Page() {
	return (
		<CmsEdgeReportingShell>
			<CmsEdgeReportingOverviewTab />
		</CmsEdgeReportingShell>
	);
}
