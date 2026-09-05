"use client";

import { useMemo } from "react";

import { CheckCircle2, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { ComplianceBoard } from "../feature/components/ComplianceBoard";
import {
	useCertificatesList,
	useSeedComplianceMutation,
	useUpdateComplianceMutation,
} from "../feature/queries/useComplianceQuery";

export function CompliancePage() {
	const { certificates, isLoading, error } = useCertificatesList();
	const seed = useSeedComplianceMutation();
	const updateCert = useUpdateComplianceMutation();

	const kpis = useMemo(() => {
		const valid = certificates.filter((c) => c.status === "valid").length;
		const expiring = certificates.filter((c) => c.status === "expiring").length;
		const expired = certificates.filter((c) => c.status === "expired").length;
		const pending = certificates.filter((c) => c.status === "pending").length;
		const flagged = certificates.filter((c) => c.riskFlag).length;
		return [
			{
				label: "Certificates",
				value: String(certificates.length),
				hint: "Live vendor certifications",
				icon: ShieldCheck,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Valid",
				value: String(valid),
				hint: `${pending} pending verification`,
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Expiring soon",
				value: String(expiring),
				hint: "Needs renewal",
				icon: Timer,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Risk flags",
				value: String(flagged),
				hint: `${expired} expired or revoked`,
				icon: ShieldAlert,
				tone: "text-destructive bg-destructive/10",
			},
		];
	}, [certificates]);

	if (isLoading) {
		return (
			<div className="container space-y-5 py-8">
				<Skeleton className="h-10 w-64" />
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-[480px] w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="container space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Compliance certificates
					</h1>
					<p className="text-sm text-muted-foreground">
						Drag tickets between columns to update certification status.
					</p>
				</div>
				{isVendorCoreLive() ? (
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						disabled={seed.isPending}
						onClick={() =>
							seed.mutate(undefined, {
								onSuccess: (res) => {
									toast.success(
										res.created > 0
											? `Seeded ${res.created} certificate(s)`
											: "All vendors already have certificates."
									);
								},
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Seed failed"
									),
							})
						}
					>
						{seed.isPending ? "Seeding…" : "Seed"}
					</Button>
				) : null}
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<Card key={kpi.label} className="shadow-sm">
							<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{kpi.label}
								</CardTitle>
								<span
									className={cn(
										"inline-flex size-8 items-center justify-center rounded-lg",
										kpi.tone
									)}
								>
									<Icon className="size-4" />
								</span>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-semibold tabular-nums">
									{kpi.value}
								</p>
								<CardDescription className="mt-1">{kpi.hint}</CardDescription>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : certificates.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No certificates available. Use Seed to create live records from
					existing vendors.
				</p>
			) : (
				<ComplianceBoard
					certificates={certificates}
					busy={updateCert.isPending}
					onStatusChange={(id, status) =>
						updateCert.mutateAsync({ id, status })
					}
				/>
			)}
		</div>
	);
}
