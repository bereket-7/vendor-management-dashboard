"use client";

import { useMemo } from "react";

import {
	CheckCircle2,
	FileInput,
	FileOutput,
	FileWarning,
	GitCompare,
	MessageSquareReply,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ClaimKpiGrid,
	ClaimPageHeader,
} from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	filesForProgram,
	formatCount,
} from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { useAdminModuleStore } from "@/stores/admin-module-store";

export function ClaimEncounterDashboardPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);

	const stats = useMemo(() => {
		const inbound = filesForProgram(programFilter, "inbound");
		const outbound = filesForProgram(programFilter, "outbound");
		const pending = inbound.filter((f) => f.reviewStatus === "pending");
		const rejected = inbound.filter((f) => f.reviewStatus === "rejected");
		const accepted = outbound.filter((f) => f.reviewStatus === "accepted");
		const denied = outbound.filter((f) => f.reviewStatus === "denied");

		return {
			pending: pending.length,
			rejected: rejected.length,
			accepted: accepted.length,
			denied: denied.length,
			inboundClaims: inbound.reduce((s, f) => s + f.records, 0),
			outboundClaims: outbound.reduce((s, f) => s + f.records, 0),
		};
	}, [programFilter]);

	const kpis = [
		{
			label: "Pending inbound",
			value: formatCount(stats.pending),
			hint: `${formatCount(stats.inboundClaims)} claims in inbound`,
			icon: FileInput,
			tone: "text-amber-700 bg-amber-500/10",
		},
		{
			label: "MFC rejected",
			value: formatCount(stats.rejected),
			hint: "Held for vendor correction",
			icon: FileWarning,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			label: "Accepted outbound",
			value: formatCount(stats.accepted),
			hint: "Queued / sent to Gainwell",
			icon: CheckCircle2,
			tone: "text-emerald-700 bg-emerald-500/10",
		},
		{
			label: "Denied outbound",
			value: formatCount(stats.denied),
			hint: `${formatCount(stats.outboundClaims)} claims in outbound`,
			icon: FileOutput,
			tone: "text-rose-700 bg-rose-500/10",
		},
	];

	const shortcuts = [
		{
			title: "Claims",
			description: "Browse all claim vendor files",
			href: "/admin/claim-encounter/claims",
			icon: FileInput,
		},
		{
			title: "Inbound Vendor Files",
			description: "Pending review and MFC rejects",
			href: "/admin/claim-encounter/inbound",
			icon: FileInput,
		},
		{
			title: "Outbound Vendor Files",
			description: "Accepted and denied packages",
			href: "/admin/claim-encounter/outbound",
			icon: FileOutput,
		},
		{
			title: "Responses",
			description: "277CA / 999 / 835 remittance",
			href: "/admin/claim-encounter/responses",
			icon: MessageSquareReply,
		},
		{
			title: "Acceptance Analytics",
			description: "Rates, trends, and vendor mix",
			href: "/admin/claim-encounter/acceptance-analytics",
			icon: CheckCircle2,
		},
		{
			title: "Vendor Comparison",
			description: "Side-by-side vendor performance",
			href: "/admin/claim-encounter/vendor-comparison",
			icon: GitCompare,
		},
	];

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Claims & Encounters"
				description={`Claim review workspace · ${programFilter}`}
			/>

			<ClaimKpiGrid items={kpis} />

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{shortcuts.map((item) => (
					<Card key={item.href} className="bg-card/70">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<item.icon className="size-4 text-primary" />
								{item.title}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-xs text-muted-foreground">
								{item.description}
							</p>
							<Button
								asChild
								variant="outline"
								size="sm"
								className="h-8 text-xs"
							>
								<Link href={item.href}>Open</Link>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
