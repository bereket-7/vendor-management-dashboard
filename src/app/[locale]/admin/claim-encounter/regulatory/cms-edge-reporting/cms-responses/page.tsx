import { CmsEdgeReportingShell } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReportingShell";
import { CmsEdgeResponsesTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeResponsesTab";

export default function Page() {
	return (
		<CmsEdgeReportingShell>
			<CmsEdgeResponsesTab />
		</CmsEdgeReportingShell>
	);
}
