"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Download,
	RefreshCw,
	Search,
	UserX,
	Users,
} from "lucide-react";
import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Button } from "@/components/ui/button";
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
import { memberCoveragesToSummaries } from "@/features/admin/features/members/live-members";
import {
	MEMBER_SUMMARIES,
	type MemberStatus,
	displayName,
	formatCurrency,
	formatDate,
	maskSsn,
} from "@/features/admin/features/members/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core";
import {
	useInvalidateVendorCore,
	useVendorCoreMemberCoverages,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

function StatusPill({ status }: { status: MemberStatus }) {
	const map: Record<MemberStatus, string> = {
		active: "border-emerald-200/80 bg-emerald-50 text-emerald-900",
		inactive: "border-slate-200/80 bg-slate-50 text-slate-800",
		pending: "border-amber-200/80 bg-amber-50 text-amber-950",
		termed: "border-red-200/80 bg-red-50 text-red-900",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize",
				map[status]
			)}
		>
			{status}
		</span>
	);
}

export function MembersPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Members">
				<MembersDirectoryPage />
			</VendorCoreGate>
		);
	}
	return <MembersDirectoryPage />;
}

function MembersDirectoryPage() {
	const router = useRouter();
	const useLive = !isMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const coveragesQ = useVendorCoreMemberCoverages();
	const vendorsQ = useVendorCoreVendors();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [plan, setPlan] = useState("all");
	const [vendor, setVendor] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);
	const [seeding, setSeeding] = useState(false);
	const autoSeedAttempted = useRef(false);

	const programScoped = useMemo(() => {
		if (!useLive) {
			return MEMBER_SUMMARIES.filter((m) => m.program === programFilter);
		}
		return memberCoveragesToSummaries(coveragesQ.data ?? []);
	}, [useLive, coveragesQ.data, programFilter]);

	const plans = useMemo(
		() => Array.from(new Set(programScoped.map((m) => m.planName))).sort(),
		[programScoped]
	);
	const vendors = useMemo(() => {
		if (!useLive) return VENDOR_NAMES;
		const fromRows = Array.from(
			new Set(programScoped.map((m) => m.vendorSource).filter(Boolean))
		).sort();
		if (fromRows.length) return fromRows;
		return (vendorsQ.data ?? []).map((v) => v.name).sort();
	}, [useLive, programScoped, vendorsQ.data]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return programScoped.filter((m) => {
			if (status !== "all" && m.status !== status) return false;
			if (plan !== "all" && m.planName !== plan) return false;
			if (vendor !== "all" && m.vendorSource !== vendor) return false;
			if (!q) return true;
			const hay = [
				m.memberId,
				displayName(m),
				m.dob,
				m.ssnLast4,
				m.email,
				m.phone,
				m.planName,
				m.pcpName,
				m.vendorSource,
			]
				.join(" ")
				.toLowerCase();
			return hay.includes(q);
		});
	}, [programScoped, search, status, plan, vendor]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filtered.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);

	const stats = useMemo(() => {
		const active = programScoped.filter((m) => m.status === "active").length;
		const pending = programScoped.filter((m) => m.status === "pending").length;
		const termed = programScoped.filter((m) => m.status === "termed").length;
		return { total: programScoped.length, active, pending, termed };
	}, [programScoped]);

	async function handleRefresh() {
		setRefreshing(true);
		try {
			if (useLive) await invalidate();
			else await new Promise((r) => setTimeout(r, 350));
			toast.success("Member directory refreshed");
		} finally {
			setRefreshing(false);
		}
	}

	async function handleSeed(options?: { silent?: boolean }) {
		setSeeding(true);
		try {
			const result = await vendorCoreApi.seedMemberCoverages();
			if (result.created > 0) {
				if (!options?.silent) {
					toast.success(
						`Seeded ${result.created} member coverages` +
							(result.eligibility_file_id
								? " (eligibility file created)"
								: "")
					);
				}
			} else if (!options?.silent) {
				toast.info("Member coverages already exist — nothing to seed");
			}
			await invalidate();
			return result;
		} catch (err) {
			if (!options?.silent) {
				toast.error(
					err instanceof Error
						? err.message
						: "Failed to seed member coverages"
				);
			}
			throw err;
		} finally {
			setSeeding(false);
		}
	}

	useEffect(() => {
		if (!useLive || autoSeedAttempted.current || coveragesQ.isLoading) return;
		if (coveragesQ.error || (coveragesQ.data?.length ?? 0) > 0) return;
		autoSeedAttempted.current = true;
		void handleSeed({ silent: true }).catch(() => {
			/* seed endpoint may not be deployed yet; manual button remains */
		});
	}, [useLive, coveragesQ.isLoading, coveragesQ.error, coveragesQ.data]);

	const hasFilters =
		search.trim().length > 0 ||
		status !== "all" ||
		plan !== "all" ||
		vendor !== "all";

	if (useLive && coveragesQ.isLoading && !coveragesQ.data) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Members
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Search and manage member profiles ·{" "}
						<span className="font-semibold text-primary">{programFilter}</span>
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{useLive && programScoped.length === 0 ? (
						<Button
							size="sm"
							className="h-9 font-semibold"
							onClick={() => void handleSeed()}
							disabled={seeding}
						>
							{seeding ? "Seeding…" : "Seed demo coverages"}
						</Button>
					) : null}
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-primary/25 font-semibold"
						onClick={() => void handleRefresh()}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-primary/25 font-semibold"
					>
						<Download className="mr-1.5 size-3.5" />
						Export
					</Button>
				</div>
			</div>

			{useLive && coveragesQ.error ? (
				<div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					{coveragesQ.error.message}
				</div>
			) : null}

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Members",
						value: stats.total,
						hint: programFilter,
						icon: Users,
						tone: "text-sky-700 bg-sky-500/15 ring-sky-500/20",
					},
					{
						label: "Active",
						value: stats.active,
						hint: "Currently enrolled",
						icon: CheckCircle2,
						tone: "text-emerald-700 bg-emerald-500/15 ring-emerald-500/20",
					},
					{
						label: "Pending",
						value: stats.pending,
						hint: "Awaiting verification",
						icon: Clock3,
						tone: "text-amber-700 bg-amber-500/15 ring-amber-500/20",
					},
					{
						label: "Termed",
						value: stats.termed,
						hint: "Coverage ended",
						icon: UserX,
						tone: "text-red-700 bg-red-500/15 ring-red-500/20",
					},
				].map((s) => {
					const Icon = s.icon;
					return (
						<div
							key={s.label}
							className="rounded-xl border border-border bg-card p-3.5 shadow-sm"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{s.label}
									</p>
									<p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{s.value.toLocaleString()}
									</p>
									<p className="mt-1.5 text-xs text-muted-foreground">
										{s.hint}
									</p>
								</div>
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
										s.tone
									)}
								>
									<Icon className="size-[18px]" />
								</span>
							</div>
						</div>
					);
				})}
			</div>

			<div className="rounded-xl border border-border bg-card p-4 shadow-sm">
				<div className="-mx-4 -mt-4 mb-3 rounded-t-xl border-b border-border bg-muted/40 px-4 py-2.5">
					<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-800">
						Member search
					</label>
				</div>
				<div className="relative">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-600" />
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder="Search members by Member ID, Name, DOB, SSN..."
						className="h-11 border-sky-200/60 pl-10 text-sm focus-visible:ring-sky-500/30"
					/>
				</div>
				<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					<div className="space-y-1">
						<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
								<SelectItem value="termed">Termed</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							Plan
						</label>
						<Select
							value={plan}
							onValueChange={(v) => {
								setPlan(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All plans</SelectItem>
								{plans.map((p) => (
									<SelectItem key={p} value={p}>
										{p}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							Vendor / source
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
					<div className="flex items-end">
						{hasFilters ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-9 font-semibold text-primary"
								onClick={() => {
									setSearch("");
									setStatus("all");
									setPlan("all");
									setVendor("all");
									setPage(1);
								}}
							>
								Clear filters
							</Button>
						) : (
							<p className="pb-2 text-[11px] font-medium text-muted-foreground">
								<span className="font-semibold text-foreground">
									{filtered.length}
								</span>{" "}
								members match
							</p>
						)}
					</div>
				</div>
			</div>

			<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
					<div>
						<p className="text-sm font-semibold tracking-tight text-foreground">
							Member directory
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{filtered.length} matching · click a row to open the profile
						</p>
					</div>
				</div>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="pl-3">Member</TableHead>
								<TableHead>Member ID</TableHead>
								<TableHead>DOB</TableHead>
								<TableHead>SSN</TableHead>
								<TableHead>Plan</TableHead>
								<TableHead>PCP</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Paid YTD</TableHead>
								<TableHead className="pr-3">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((m) => (
								<TableRow
									key={m.id}
									className="cursor-pointer hover:bg-muted/30"
									onClick={() => router.push(`/admin/members/${m.id}`)}
								>
									<TableCell className="pl-3">
										<div className="min-w-0">
											<p className="text-sm font-medium text-primary">
												{displayName(m)}
											</p>
											<p className="truncate text-[11px] text-muted-foreground">
												{m.email || m.vendorSource}
											</p>
										</div>
									</TableCell>
									<TableCell className="font-mono text-xs">
										{m.memberId}
									</TableCell>
									<TableCell className="text-xs tabular-nums">
										{m.dob === "—" ? "—" : formatDate(m.dob)}
									</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{maskSsn(m.ssnLast4)}
									</TableCell>
									<TableCell className="max-w-[180px]">
										<p className="truncate text-sm">{m.planName}</p>
										<p className="text-[10px] text-muted-foreground">
											{m.planType} · {m.lob}
										</p>
									</TableCell>
									<TableCell className="text-sm">{m.pcpName}</TableCell>
									<TableCell>
										<StatusPill status={m.status} />
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{formatCurrency(m.paidYtd)}
									</TableCell>
									<TableCell
										className="pr-3"
										onClick={(e) => e.stopPropagation()}
									>
										<Button
											asChild
											variant="outline"
											size="sm"
											className="h-7 text-xs"
										>
											<Link href={`/admin/members/${m.id}`}>Open</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
							{pageRows.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={9}
										className="h-24 text-center text-muted-foreground"
									>
										{useLive && programScoped.length === 0 && seeding
											? "No members yet. Seeding demo coverages…"
											: useLive && programScoped.length === 0
												? "No members yet. Use Seed demo coverages or run pnpm seed:member-coverages."
												: "No members match the current search and filters."}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-3 py-2.5 text-sm text-muted-foreground">
					<p className="text-xs sm:text-sm">
						Showing{" "}
						<span className="font-medium tabular-nums text-foreground">
							{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
						</span>
						–
						<span className="font-medium tabular-nums text-foreground">
							{Math.min(safePage * pageSize, filtered.length)}
						</span>{" "}
						of{" "}
						<span className="font-medium tabular-nums text-foreground">
							{filtered.length}
						</span>
					</p>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon"
							className="size-8"
							disabled={safePage <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							<ChevronLeft className="size-4" />
						</Button>
						<span className="px-2 text-xs tabular-nums">
							{safePage} / {pageCount}
						</span>
						<Button
							variant="outline"
							size="icon"
							className="size-8"
							disabled={safePage >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
						>
							<ChevronRight className="size-4" />
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs">Rows</span>
						<Select
							value={String(pageSize)}
							onValueChange={(v) => {
								setPageSize(Number(v));
								setPage(1);
							}}
						>
							<SelectTrigger className="h-8 w-[72px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[10, 25, 50].map((n) => (
									<SelectItem key={n} value={String(n)}>
										{n}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>
		</div>
	);
}
