"use client";

import { notFound } from "next/navigation";

import { ComplianceProgramPage } from "@/features/admin/features/claim-encounter/compliance-program/ComplianceProgramPage";
import {
	type ComplianceProgramSection,
	getComplianceProgramPage,
} from "@/features/admin/features/claim-encounter/compliance-program/config";

export function ComplianceProgramRoutePage({
	slug,
	section,
}: {
	slug: string;
	section: ComplianceProgramSection;
}) {
	const config = getComplianceProgramPage(slug);
	if (!config || config.section !== section) {
		notFound();
	}
	return <ComplianceProgramPage slug={slug} />;
}
