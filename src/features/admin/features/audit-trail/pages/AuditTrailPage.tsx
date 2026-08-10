"use client";

import { AuditLivePage } from "@/features/admin/features/audit-trail/pages/AuditLivePage";
import { AuditTrailView } from "@/features/admin/features/audit-trail/components/AuditTrailView";
import { isVendorCoreLive } from "@/lib/vendor-core";

export function AuditTrailPage() {
	if (isVendorCoreLive()) return <AuditLivePage />;
	return <AuditTrailView showPageHeader />;
}
