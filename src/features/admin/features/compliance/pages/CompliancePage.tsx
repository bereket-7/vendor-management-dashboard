"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { useCertificatesList } from "@/features/shared/vms/queries";
import { formatDate } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function CompliancePage() {
	const { certificates, isLoading, error } = useCertificatesList();
	const flagged = certificates.filter((item) => item.riskFlag).length;

	if (isLoading)
		return (
			<div className="container space-y-5 py-8">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-72 w-full" />
			</div>
		);

	return (
		<div className="container space-y-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Compliance certificates
					</h1>
					<p className="text-sm text-muted-foreground">
						Monitor certification validity and supplier risk.
					</p>
				</div>
				<div className="rounded-md border px-4 py-2 text-sm">
					<span className="font-semibold tabular-nums">{flagged}</span> risk
					flags
				</div>
			</div>
			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{certificates.map((certificate) => (
						<article
							key={certificate.id}
							className={`rounded-xl border border-border bg-card shadow-sm p-5 ${certificate.riskFlag ? "border-destructive/50" : ""}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h2 className="truncate font-semibold">{certificate.name}</h2>
									<Link
										href={`/admin/vendors/${certificate.vendorId}`}
										className="text-sm text-muted-foreground hover:underline"
									>
										{certificate.vendorName}
									</Link>
								</div>
								<StatusBadge status={certificate.status} />
							</div>
							<dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
								<div>
									<dt className="text-xs text-muted-foreground">Issuer</dt>
									<dd className="mt-1">{certificate.issuer}</dd>
								</div>
								<div>
									<dt className="text-xs text-muted-foreground">Expires</dt>
									<dd className="mt-1">{formatDate(certificate.expiresAt)}</dd>
								</div>
							</dl>
							{certificate.riskFlag && (
								<p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
									Action required: certificate risk detected.
								</p>
							)}
						</article>
					))}
					{certificates.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No certificates available.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
