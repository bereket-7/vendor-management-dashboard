"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useMemo } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock3,
	Copy,
	Download,
	ExternalLink,
	Eye,
	FileText,
	RefreshCw,
	Shield,
	User,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useDocument,
	useDocumentsList,
	useUpdateDocumentMutation,
} from "@/features/shared/vms/queries";
import { formatDate } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div>
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1 text-sm font-medium break-words">{value ?? "—"}</dd>
		</div>
	);
}

function daysUntilExpiry(expiresAt: string | null) {
	if (!expiresAt) return null;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const expiry = new Date(expiresAt);
	expiry.setHours(0, 0, 0, 0);
	return Math.ceil(
		(expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);
}

function expiryProgress(days: number | null, horizon = 365) {
	if (days == null) return 100;
	if (days < 0) return 0;
	return Math.min(100, Math.round((days / horizon) * 100));
}

export function DocumentDetailPage() {
	const params = useParams<{ documentId: string }>();
	const { document, isLoading, error } = useDocument(params.documentId);
	const { documents } = useDocumentsList();
	const updateDocument = useUpdateDocumentMutation();

	const related = useMemo(() => {
		if (!document) return [];
		return documents.filter(
			(d) => d.vendorId === document.vendorId && d.id !== document.id
		);
	}, [document, documents]);

	const days = document ? daysUntilExpiry(document.expiresAt) : null;
	const progress = expiryProgress(days);

	async function setStatus(status: "approved" | "rejected" | "pending") {
		if (!document) return;
		try {
			await updateDocument.mutateAsync({
				id: document.id,
				patch: {
					status,
					reviewedBy: "A. Bekele",
					reviewedAt: new Date().toISOString(),
					history: [
						...(document.history ?? []),
						{
							id: `h-${Date.now()}`,
							at: new Date().toISOString(),
							actor: "A. Bekele",
							action:
								status === "approved"
									? "Approved"
									: status === "rejected"
										? "Rejected"
										: "Returned to pending",
						},
					],
				},
			});
			toast.success(
				status === "approved"
					? "Document approved."
					: status === "rejected"
						? "Document rejected."
						: "Document returned to pending."
			);
		} catch {
			toast.error("Could not update document status.");
		}
	}

	function copyId() {
		if (!document) return;
		void navigator.clipboard.writeText(document.documentNumber ?? document.id);
		toast.success("Document ID copied");
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	if (error || !document) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/documents"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Documents
				</Link>
				<div className="rounded-xl border border-border/50 bg-card/70 p-10 text-center">
					<p className="text-lg font-semibold">Document not found</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{error?.message ?? "This record may have been removed."}
					</p>
					<Button asChild className="mt-5">
						<Link href="/admin/documents">Back to repository</Link>
					</Button>
				</div>
			</div>
		);
	}

	const canReview = document.status === "pending";

	return (
		<div className="space-y-4">
			<Link
				href="/admin/documents"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Document repository
			</Link>

			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<FileText className="size-5" />
						</div>
						<div>
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								{document.name}
							</h1>
							<div className="mt-1 flex flex-wrap items-center gap-2">
								<StatusBadge status={document.status} />
								<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
									{document.type.replace(/_/g, " ")}
								</span>
								<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
									{document.visibility} visibility
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
						<button
							type="button"
							onClick={copyId}
							className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-foreground"
						>
							{document.documentNumber ?? document.id}
							<Copy className="size-3" />
						</button>
						<span className="text-border">·</span>
						<Link
							href={`/admin/vendors/${document.vendorId}`}
							className="hover:text-foreground hover:underline"
						>
							{document.vendorName}
						</Link>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" className="h-9">
						<Eye className="mr-1.5 size-3.5" />
						Preview
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Download
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<RefreshCw className="mr-1.5 size-3.5" />
						Request renewal
					</Button>
					{canReview && (
						<>
							<Button
								variant="outline"
								size="sm"
								className="h-9 text-destructive hover:text-destructive"
								disabled={updateDocument.isPending}
								onClick={() => setStatus("rejected")}
							>
								<XCircle className="mr-1.5 size-3.5" />
								Reject
							</Button>
							<Button
								size="sm"
								className="h-9"
								disabled={updateDocument.isPending}
								onClick={() => setStatus("approved")}
							>
								<CheckCircle2 className="mr-1.5 size-3.5" />
								Approve
							</Button>
						</>
					)}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Version",
						value: `v${document.version ?? 1}`,
						hint: `${document.fileExtension?.toUpperCase() ?? "FILE"} · ${document.fileSizeKb ?? "—"} KB`,
						icon: FileText,
						tone: "text-primary bg-primary/10",
					},
					{
						label: "Expiry",
						value:
							days == null
								? "No expiry"
								: days < 0
									? "Expired"
									: `${days} days`,
						hint: formatDate(document.expiresAt),
						icon: Calendar,
						tone:
							days != null && days < 0
								? "text-red-700 bg-red-500/10"
								: days != null && days <= 30
									? "text-amber-700 bg-amber-500/10"
									: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Uploaded",
						value: formatDate(document.uploadedAt),
						hint: document.uploadedBy ?? "Unknown",
						icon: User,
						tone: "text-sky-700 bg-sky-500/10",
					},
					{
						label: "Review",
						value: document.reviewedBy ?? "Not reviewed",
						hint: formatDate(document.reviewedAt),
						icon: Shield,
						tone:
							document.status === "approved"
								? "text-emerald-700 bg-emerald-500/10"
								: document.status === "rejected"
									? "text-red-700 bg-red-500/10"
									: "text-amber-700 bg-amber-500/10",
					},
				].map((k) => {
					const Icon = k.icon;
					return (
						<div
							key={k.label}
							className="rounded-xl border border-border/50 bg-card/70 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{k.label}
									</p>
									<p className="mt-2 text-xl font-semibold tracking-tight">
										{k.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg",
										k.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid gap-4 xl:grid-cols-5">
				<div className="space-y-4 xl:col-span-3">
					{document.description && (
						<Card className="border-border/50 bg-card/70">
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{document.description}
								</p>
								{document.tags && document.tags.length > 0 && (
									<div className="mt-4 flex flex-wrap gap-1.5">
										{document.tags.map((tag) => (
											<span
												key={tag}
												className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
											>
												{tag}
											</span>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<Card className="border-border/50 bg-card/70">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Document metadata</CardTitle>
							<CardDescription>
								Identity, issuer, and file integrity details
							</CardDescription>
						</CardHeader>
						<CardContent>
							<dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
								<MetaItem label="Vendor" value={document.vendorName} />
								<MetaItem label="Issuer" value={document.issuer} />
								<MetaItem
									label="Document number"
									value={
										<span className="font-mono text-xs">
											{document.documentNumber}
										</span>
									}
								/>
								<MetaItem
									label="Contract"
									value={
										document.contractNumber ? (
											<Link
												href="/admin/contracts"
												className="font-mono text-xs text-primary hover:underline"
											>
												{document.contractNumber}
											</Link>
										) : (
											"—"
										)
									}
								/>
								<MetaItem
									label="File size"
									value={
										document.fileSizeKb ? `${document.fileSizeKb} KB` : "—"
									}
								/>
								<MetaItem
									label="Format"
									value={document.fileExtension?.toUpperCase()}
								/>
								<MetaItem
									label="Checksum"
									value={
										<span className="font-mono text-xs">
											{document.checksum}
										</span>
									}
								/>
								<MetaItem label="Uploaded by" value={document.uploadedBy} />
								<MetaItem label="Reviewed by" value={document.reviewedBy} />
							</dl>
						</CardContent>
					</Card>

					<Card className="border-border/50 bg-card/70">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Preview</CardTitle>
							<CardDescription>
								Mock preview panel — connect to storage for live rendering
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
								<FileText className="size-10 text-muted-foreground/60" />
								<p className="mt-3 text-sm font-medium">
									{document.name}.{document.fileExtension ?? "pdf"}
								</p>
								<p className="mt-1 max-w-sm text-xs text-muted-foreground">
									Document preview would render here for PDF, images, and
									supported office formats.
								</p>
								<Button variant="outline" size="sm" className="mt-4">
									<Eye className="mr-1.5 size-3.5" />
									Open full preview
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4 xl:col-span-2">
					{document.expiresAt && (
						<Card className="border-border/50 bg-card/70">
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Validity window</CardTitle>
								<CardDescription>
									Time remaining until document expiry
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Expires</span>
									<span className="font-medium tabular-nums">
										{formatDate(document.expiresAt)}
									</span>
								</div>
								<Progress value={progress} className="h-1.5" />
								{days != null && days <= 30 && days >= 0 && (
									<div className="flex items-start gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
										<AlertTriangle className="mt-0.5 size-4 shrink-0" />
										<span>
											Renewal recommended within {days} day
											{days === 1 ? "" : "s"}.
										</span>
									</div>
								)}
								{days != null && days < 0 && (
									<div className="flex items-start gap-2 rounded-lg border border-red-200/70 bg-red-50/60 px-3 py-2.5 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
										<XCircle className="mt-0.5 size-4 shrink-0" />
										<span>
											This document expired {Math.abs(days)} day
											{Math.abs(days) === 1 ? "" : "s"} ago.
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<Card className="border-border/50 bg-card/70">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Activity history</CardTitle>
							<CardDescription>Audit trail for this document</CardDescription>
						</CardHeader>
						<CardContent>
							{(document.history ?? []).length === 0 ? (
								<p className="text-sm text-muted-foreground">No history yet.</p>
							) : (
								<ol className="space-y-0">
									{(document.history ?? []).map((entry, index) => {
										const isLast =
											index === (document.history?.length ?? 0) - 1;
										return (
											<li
												key={entry.id}
												className="relative flex gap-3 pb-5 last:pb-0"
											>
												{!isLast && (
													<span className="absolute left-[7px] top-5 h-[calc(100%-8px)] w-px bg-border" />
												)}
												<div className="relative z-10 mt-0.5 size-4 rounded-full border-2 border-primary bg-card" />
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-2">
														<p className="text-sm font-semibold">
															{entry.action}
														</p>
														<span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
															{formatDate(entry.at)}
														</span>
													</div>
													<p className="text-xs text-muted-foreground">
														{entry.actor}
													</p>
													{entry.note && (
														<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
															{entry.note}
														</p>
													)}
												</div>
											</li>
										);
									})}
								</ol>
							)}
						</CardContent>
					</Card>

					{related.length > 0 && (
						<Card className="border-border/50 bg-card/70">
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Related documents</CardTitle>
								<CardDescription>Other files from this vendor</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2">
								{related.slice(0, 5).map((doc) => (
									<Link
										key={doc.id}
										href={`/admin/documents/${doc.id}`}
										className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-background"
									>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">{doc.name}</p>
											<p className="truncate text-xs capitalize text-muted-foreground">
												{doc.type.replace(/_/g, " ")}
											</p>
										</div>
										<ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
									</Link>
								))}
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{document.status === "rejected" && (
				<Card className="border-red-200/70 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20">
					<CardContent className="flex items-start gap-3 p-4">
						<XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
						<div>
							<p className="font-semibold text-red-900 dark:text-red-100">
								Document rejected
							</p>
							<p className="mt-1 text-sm text-red-800/90 dark:text-red-200/90">
								{document.history?.find((h) => h.action === "Rejected")?.note ??
									"This document did not meet compliance requirements."}
							</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-3"
								disabled={updateDocument.isPending}
								onClick={() => setStatus("pending")}
							>
								<Clock3 className="mr-1.5 size-3.5" />
								Return to pending review
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
