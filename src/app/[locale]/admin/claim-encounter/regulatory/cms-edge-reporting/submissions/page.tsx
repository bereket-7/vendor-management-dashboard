import { CmsEdgeReportingShell } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReportingShell";
import { CmsEdgeSubmissionsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeSubmissionsTab";

export default function Page() {
	return (
		<CmsEdgeReportingShell>
			<CmsEdgeSubmissionsTab />
		</CmsEdgeReportingShell>
	);
}
