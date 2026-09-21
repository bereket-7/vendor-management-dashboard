"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { ComplianceObligationDetailPage } from "@/features/admin/features/claim-encounter/compliance-calendar/ComplianceObligationDetailPage";
import { useComplianceObligationDetailQuery } from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";

export default function Page({
	params,
}: {
	params: Promise<{ obligationId: string }>;
}) {
	const { obligationId } = use(params);
	const query = useComplianceObligationDetailQuery(obligationId);

	if (query.isLoading) {
		return (
			<p className="px-4 py-12 text-sm text-muted-foreground">
				Loading obligation…
			</p>
		);
	}

	if (!query.data) {
		notFound();
	}

	return <ComplianceObligationDetailPage obligation={query.data} />;
}
