import { CmsEdgeExceptionsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeExceptionsTab";
import { CmsEdgeReportingShell } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeReportingShell";

export default function Page() {
	return (
		<CmsEdgeReportingShell>
			<CmsEdgeExceptionsTab />
		</CmsEdgeReportingShell>
	);
}
