import { CmsEdgeReconciliationTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReconciliationTab";
import { CmsEdgeReportingShell } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReportingShell";

export default function Page() {
	return (
		<CmsEdgeReportingShell>
			<CmsEdgeReconciliationTab />
		</CmsEdgeReportingShell>
	);
}
