"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
	CheckCircle2,
	ClipboardCheck,
	Clock3,
	Download,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	VendorFileWorkspace,
	vendorFileToolbarBtn,
} from "@/features/admin/features/claim-encounter/components/VendorFileWorkspace";
import {
	downloadClaimVendorFile,
	getVendorFile,
	saveVendorCoreBlob,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { useResolveClaimVendorFileQuery } from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { Link, useRouter } from "@/i18n/navigation";
import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

export function ClaimFileDetailPage() {
	const useFixtures = isMockEnabled() || isClaimVendorFilesMockEnabled();
	if (!useFixtures) {
		return (
			<VendorCoreGate title="Claim File">
				<ClaimFileDetailBody useLive />
			</VendorCoreGate>
		);
	}
	return <ClaimFileDetailBody useLive={false} />;
}

function ClaimFileDetailBody({ useLive }: { useLive: boolean }) {
	const params = useParams<{ fileId: string }>();
	const router = useRouter();
	const fileIdParam = decodeURIComponent(params.fileId);

	const liveFileQ = useResolveClaimVendorFileQuery(fileIdParam, useLive);
	const liveFile = liveFileQ.data ?? null;

	const fixtureFile = useMemo(
		() => (useLive ? null : (getVendorFile(fileIdParam) ?? null)),
		[useLive, fileIdParam]
	);

	const file = useLive ? liveFile : fixtureFile;
	const [downloading, setDownloading] = useState(false);

	const showClaimsPanel =
		Boolean(file) &&
		(file!.direction === "outbound" || file!.reviewStatus !== "pending");

	async function handleDownload() {
		if (!useLive || !file?.id) {
			toast.message("EDI download requires live vendor-core");
			return;
		}
		setDownloading(true);
		try {
			const result = await downloadClaimVendorFile(file.id);
			saveVendorCoreBlob(result, file.fileName || `${file.fileId}.edi`);
			toast.success("EDI download started");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "EDI download failed");
		} finally {
			setDownloading(false);
		}
	}

	if (useLive && liveFileQ.isLoading) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-muted-foreground">Loading vendor file…</p>
			</div>
		);
	}

	if (useLive && liveFileQ.error) {
		return (
			<div className="space-y-3">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
				>
					Back
				</Link>
				<p className="text-sm text-destructive">
					Could not load file: {liveFileQ.error.message}
				</p>
			</div>
		);
	}

	if (!file) {
		return (
			<div className="space-y-3">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
				>
					Back
				</Link>
				<p className="text-sm text-destructive">File not found</p>
			</div>
		);
	}

	const backHref =
		file.direction === "outbound"
			? "/admin/claim-encounter/outbound"
			: "/admin/claim-encounter/inbound";
	const backLabel = file.direction === "outbound" ? "Outbound" : "Inbound";
	const reviewHref = `/admin/claim-encounter/files/${encodeURIComponent(file.id)}/review`;
	const accepted = file.reviewStatus === "accepted";

	return (
		<VendorFileWorkspace
			file={file}
			useLive={useLive}
			backLabel={backLabel}
			onBack={() => router.push(backHref)}
			hideOpenLink
			showClaimsPanel={showClaimsPanel}
			negativeLabel={file.direction === "outbound" ? "denied" : "rejected"}
			statusPills={
				<>
					{file.reviewStatus !== "pending" ? (
						<span
							className={cn(
								"inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
								accepted
									? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
									: "border-rose-200/80 bg-rose-50 text-rose-800"
							)}
						>
							{accepted ? (
								<CheckCircle2 className="size-2.5" />
							) : (
								<XCircle className="size-2.5" />
							)}
							{file.reviewStatus}
						</span>
					) : (
						<span className="inline-flex items-center gap-1 rounded-sm border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
							<Clock3 className="size-2.5" />
							pending
						</span>
					)}
					{file.outboundSendStatus ? (
						<span className="inline-flex items-center gap-1 rounded-sm border border-sky-200/80 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-sky-900">
							{file.outboundSendStatus}
						</span>
					) : null}
				</>
			}
			metaExtra={
				file.sourceInboundFileId ? (
					<>
						<span className="text-border">·</span>
						<span className="font-mono tabular-nums">
							← {file.sourceInboundFileId}
						</span>
					</>
				) : (
					<>
						<span className="text-border">·</span>
						<span>Received {file.receivedAt}</span>
					</>
				)
			}
			actions={
				<>
					{useLive ? (
						<Button
							variant="outline"
							size="sm"
							className={cn(vendorFileToolbarBtn, "border-border/80")}
							onClick={() => void handleDownload()}
							disabled={downloading}
						>
							<Download className="size-3.5" />
							Download EDI
						</Button>
					) : null}
					{file.reviewStatus === "pending" ? (
						<Button
							asChild
							size="sm"
							className={cn(
								vendorFileToolbarBtn,
								"bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
							)}
						>
							<Link href={reviewHref}>
								<ClipboardCheck className="size-3.5" />
								Review
							</Link>
						</Button>
					) : null}
				</>
			}
		/>
	);
}
