"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	Clock3,
	Download,
	ExternalLink,
	FileText,
	Filter,
	FolderOpen,
	MoreHorizontal,
	Plus,
	RefreshCw,
	Search,
	ShieldCheck,
	Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { useDocumentsList } from "@/features/shared/vms/queries";
import type { DocumentType } from "@/features/shared/vms/types";
import { formatDate } from "@/features/shared/vms/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES: DocumentType[] = [
	"tax_certificate",
	"insurance",
	"business_license",
	"contract",
	"w9",
	"other",
];

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

function expiryTone(days: number | null) {
	if (days == null) return "text-muted-foreground";
	if (days < 0) return "text-red-700";
	if (days <= 30) return "text-amber-700";
	return "text-emerald-700";
}

function formatType(type: DocumentType) {
	return type.replace(/_/g, " ");
}

function fileIcon(ext?: string) {
	if (ext === "pdf") return FileText;
	return FolderOpen;
}

export function DocumentsPage() {
	const router = useRouter();
	const { documents, isLoading, error } = useDocumentsList();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [type, setType] = useState("all");
	const [vendor, setVendor] = useState("all");
	const [expiry, setExpiry] = useState("all");
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const vendors = useMemo(
		() => Array.from(new Set(documents.map((d) => d.vendorName))).sort(),
		[documents]
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return documents.filter((doc) => {
			if (status !== "all" && doc.status !== status) return false;
			if (type !== "all" && doc.type !== type) return false;
			if (vendor !== "all" && doc.vendorName !== vendor) return false;
			const days = daysUntilExpiry(doc.expiresAt);
			if (expiry === "expired" && (days == null || days >= 0)) return false;
			if (expiry === "soon" && (days == null || days < 0 || days > 30))
				return false;
			if (expiry === "valid" && (days == null || days <= 30)) return false;
			if (
				q &&
				![
					doc.name,
					doc.vendorName,
					doc.documentNumber ?? "",
					doc.issuer ?? "",
					...(doc.tags ?? []),
				]
					.join(" ")
					.toLowerCase()
					.includes(q)
			) {
				return false;
			}
			return true;
		});
	}, [documents, search, status, type, vendor, expiry]);

	const kpis = useMemo(() => {
		const pending = documents.filter((d) => d.status === "pending").length;
		const expiringSoon = documents.filter((d) => {
			const days = daysUntilExpiry(d.expiresAt);
			return days != null && days >= 0 && days <= 30;
		}).length;
		const expired = documents.filter(
			(d) => d.status === "expired" || (daysUntilExpiry(d.expiresAt) ?? 1) < 0
		).length;
		const approved = documents.filter((d) => d.status === "approved").length;
		return [
			{
				label: "Total documents",
				value: String(documents.length),
				hint: "Across all vendors",
				icon: FolderOpen,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Pending review",
				value: String(pending),
				hint: "Awaiting approval",
				icon: Clock3,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Expiring soon",
				value: String(expiringSoon),
				hint: "Within 30 days",
				icon: AlertTriangle,
				tone: "text-orange-700 bg-orange-500/10",
			},
			{
				label: "Approved",
				value: String(approved),
				hint: `${expired} expired`,
				icon: ShieldCheck,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
		];
	}, [documents]);

	const expiringList = useMemo(
		() =>
			[...documents]
				.filter((d) => {
					const days = daysUntilExpiry(d.expiresAt);
					return days != null && days >= 0 && days <= 45;
				})
				.sort(
					(a, b) =>
						(daysUntilExpiry(a.expiresAt) ?? 999) -
						(daysUntilExpiry(b.expiresAt) ?? 999)
				)
				.slice(0, 5),
		[documents]
	);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setType("all");
		setVendor("all");
		setExpiry("all");
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 450));
		setRefreshing(false);
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-72" />
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Document repository
					</h1>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Central register of supplier compliance files, contracts, tax
						records, and insurance — with expiry tracking and review workflow.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export register
					</Button>
					<Button size="sm" className="h-9">
						<Upload className="mr-1.5 size-3.5" />
						Upload document
					</Button>
				</div>
			</div>

			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : null}

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((k) => {
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
									<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
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
				<Card className="border-border/50 bg-card/70 xl:col-span-3">
					<CardContent className="flex flex-col gap-3 p-4">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Filter className="size-4 text-primary" />
							Filters
						</div>
						<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
							<div className="relative space-y-1 xl:col-span-2">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={search}
										onChange={(e) => {
											setSearch(e.target.value);
											setPage(1);
										}}
										placeholder="Name, vendor, issuer, tag…"
										className="h-9 pl-8"
									/>
								</div>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Status
								</label>
								<Select
									value={status}
									onValueChange={(v) => {
										setStatus(v);
										setPage(1);
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All statuses</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
										<SelectItem value="approved">Approved</SelectItem>
										<SelectItem value="rejected">Rejected</SelectItem>
										<SelectItem value="expired">Expired</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Type
								</label>
								<Select
									value={type}
									onValueChange={(v) => {
										setType(v);
										setPage(1);
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All types</SelectItem>
										{DOCUMENT_TYPES.map((t) => (
											<SelectItem key={t} value={t}>
												{formatType(t)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Vendor
								</label>
								<Select
									value={vendor}
									onValueChange={(v) => {
										setVendor(v);
										setPage(1);
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All vendors</SelectItem>
										{vendors.map((v) => (
											<SelectItem key={v} value={v}>
												{v}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Expiry
								</label>
								<Select
									value={expiry}
									onValueChange={(v) => {
										setExpiry(v);
										setPage(1);
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Any expiry</SelectItem>
										<SelectItem value="soon">Expiring soon</SelectItem>
										<SelectItem value="expired">Expired</SelectItem>
										<SelectItem value="valid">Valid / no expiry</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-end">
								<Button variant="ghost" className="h-9" onClick={clearFilters}>
									Clear
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/70 xl:col-span-2">
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Document intelligence</CardTitle>
						<CardDescription>
							Expiry horizon and parsing status across the repository
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-2">
							{[
								{
									label: "30 days",
									value: documents.filter((d) => {
										const days = daysUntilExpiry(d.expiresAt);
										return days != null && days >= 0 && days <= 30;
									}).length,
								},
								{
									label: "60 days",
									value: documents.filter((d) => {
										const days = daysUntilExpiry(d.expiresAt);
										return days != null && days > 30 && days <= 60;
									}).length,
								},
								{
									label: "90 days",
									value: documents.filter((d) => {
										const days = daysUntilExpiry(d.expiresAt);
										return days != null && days > 60 && days <= 90;
									}).length,
								},
							].map((bucket) => (
								<div
									key={bucket.label}
									className="rounded-lg border border-border/50 bg-background/60 p-2.5 text-center"
								>
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{bucket.label}
									</p>
									<p className="mt-1 text-lg font-semibold tabular-nums">
										{bucket.value}
									</p>
								</div>
							))}
						</div>
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-foreground">
								Expiry watchlist
							</p>
							{expiringList.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No documents approaching expiry.
								</p>
							) : (
								expiringList.map((doc) => {
									const days = daysUntilExpiry(doc.expiresAt);
									return (
										<Link
											key={doc.id}
											href={`/admin/documents/${doc.id}`}
											className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-background"
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold">
													{doc.name}
												</p>
												<p className="truncate text-xs text-muted-foreground">
													{doc.vendorName}
												</p>
											</div>
											<span
												className={cn(
													"shrink-0 text-xs font-semibold tabular-nums",
													expiryTone(days)
												)}
											>
												{days === 0 ? "Today" : `${days}d`}
											</span>
										</Link>
									);
								})
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-border/50 bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div>
						<CardTitle className="text-base">All documents</CardTitle>
						<CardDescription>
							{filtered.length} records · click a row to open detail
						</CardDescription>
					</div>
					<Button variant="outline" size="sm" className="h-8">
						<Plus className="mr-1.5 size-3.5" />
						Request upload
					</Button>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4 sm:pl-6">Document</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Expiry</TableHead>
									<TableHead>Uploaded</TableHead>
									<TableHead>OCR</TableHead>
									<TableHead>Tags</TableHead>
									<TableHead>Version</TableHead>
									<TableHead className="pr-4 text-right sm:pr-6">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => {
									const Icon = fileIcon(row.fileExtension);
									const days = daysUntilExpiry(row.expiresAt);
									return (
										<TableRow
											key={row.id}
											className="cursor-pointer hover:bg-muted/30"
											onClick={() => router.push(`/admin/documents/${row.id}`)}
										>
											<TableCell className="pl-4 sm:pl-6">
												<div className="flex items-center gap-2.5">
													<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
														<Icon className="size-3.5" />
													</div>
													<div className="min-w-0">
														<p className="truncate font-medium">{row.name}</p>
														<p className="truncate font-mono text-[11px] text-muted-foreground">
															{row.documentNumber ?? row.id}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Link
													href={`/admin/vendors/${row.vendorId}`}
													className="hover:underline"
													onClick={(e) => e.stopPropagation()}
												>
													{row.vendorName}
												</Link>
											</TableCell>
											<TableCell className="capitalize">
												{formatType(row.type)}
											</TableCell>
											<TableCell>
												<StatusBadge status={row.status} />
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"text-sm tabular-nums",
														expiryTone(days)
													)}
												>
													{formatDate(row.expiresAt)}
													{days != null && days >= 0 && days <= 30 && (
														<span className="ml-1 text-xs">({days}d)</span>
													)}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(row.uploadedAt)}
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
														row.status === "approved"
															? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
															: row.status === "pending"
																? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
																: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
													)}
												>
													{row.status === "approved"
														? "Parsed"
														: row.status === "pending"
															? "Queued"
															: "Needs review"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex max-w-[140px] flex-wrap gap-1">
													{(row.tags ?? [formatType(row.type)])
														.slice(0, 2)
														.map((tag) => (
															<span
																key={tag}
																className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground"
															>
																{tag}
															</span>
														))}
												</div>
											</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												v{row.version ?? 1}
											</TableCell>
											<TableCell
												className="pr-4 text-right sm:pr-6"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontal className="size-4" />
															<span className="sr-only">Actions</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link href={`/admin/documents/${row.id}`}>
																<ExternalLink className="mr-2 size-3.5" />
																View detail
															</Link>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No documents match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground sm:px-6">
						<span>
							Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
							{Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
							results
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							{Array.from({ length: pageCount }, (_, i) => i + 1)
								.slice(0, 6)
								.map((p) => (
									<Button
										key={p}
										variant={p === page ? "default" : "outline"}
										size="sm"
										className="size-8 p-0"
										onClick={() => setPage(p)}
									>
										{p}
									</Button>
								))}
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								disabled={page >= pageCount}
								onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
