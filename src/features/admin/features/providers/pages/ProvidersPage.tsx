"use client";

import { useMemo, useState } from "react";

import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Download,
	RefreshCw,
	Search,
	Stethoscope,
	UserX,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { providersToSummaries } from "@/features/admin/features/providers/live-providers";
import {
	PROVIDER_SUMMARIES,
	type ProviderStatus,
	type ProviderSummary,
	displayProviderName,
	formatCompact,
	formatCurrency,
} from "@/features/admin/features/providers/mock-data";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import {
	useInvalidateVendorCore,
	useVendorCoreProviders,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

function StatusPill({ status }: { status: ProviderStatus }) {
	const map: Record<ProviderStatus, string> = {
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

export function ProvidersPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Providers">
				<ProvidersBody useLive />
			</VendorCoreGate>
		);
	}
	return <ProvidersBody useLive={false} />;
}

function ProvidersBody({ useLive }: { useLive: boolean }) {
	const router = useRouter();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const invalidate = useInvalidateVendorCore();
	const providersQ = useVendorCoreProviders(useLive);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [specialty, setSpecialty] = useState("all");
	const [providerType, setProviderType] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);

	const programScoped = useMemo((): ProviderSummary[] => {
		if (useLive) {
			return providersToSummaries(
				providersQ.data ?? [],
				programFilter as ProviderSummary["program"]
			);
		}
		return PROVIDER_SUMMARIES.filter((p) => p.program === programFilter);
	}, [useLive, providersQ.data, programFilter]);

	const specialties = useMemo(
		() => Array.from(new Set(programScoped.map((p) => p.specialty))).sort(),
		[programScoped]
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return programScoped.filter((p) => {
			if (status !== "all" && p.status !== status) return false;
			if (specialty !== "all" && p.specialty !== specialty) return false;
			if (providerType !== "all" && p.providerType !== providerType)
				return false;
			if (!q) return true;
			const hay = [
				p.name,
				p.credentials,
				p.npi,
				p.taxId,
				p.medicaidId,
				p.specialty,
				p.subspecialty,
				p.practiceName,
				p.upin,
			]
				.join(" ")
				.toLowerCase();
			return hay.includes(q);
		});
	}, [programScoped, search, status, specialty, providerType]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filtered.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);

	const stats = useMemo(() => {
		const active = programScoped.filter((p) => p.status === "active").length;
		const pending = programScoped.filter((p) => p.status === "pending").length;
		const termed = programScoped.filter((p) => p.status === "termed").length;
		return { total: programScoped.length, active, pending, termed };
	}, [programScoped]);

	async function handleRefresh() {
		setRefreshing(true);
		try {
			if (useLive) {
				await invalidate();
			} else {
				await new Promise((r) => setTimeout(r, 350));
			}
			toast.success("Provider directory refreshed");
		} finally {
			setRefreshing(false);
		}
	}

	const hasFilters =
		search.trim().length > 0 ||
		status !== "all" ||
		specialty !== "all" ||
		providerType !== "all";

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Providers
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Search and manage provider profiles ·{" "}
						<span className="font-semibold text-primary">{programFilter}</span>
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-primary/25 font-semibold"
						onClick={() => void handleRefresh()}
						disabled={refreshing || (useLive && providersQ.isLoading)}
					>
						<RefreshCw
							className={cn(
								"mr-1.5 size-3.5",
								(refreshing || (useLive && providersQ.isLoading)) &&
									"animate-spin"
							)}
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

			{useLive && providersQ.error ? (
				<div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Could not load providers: {providersQ.error.message}
				</div>
			) : null}

			{useLive &&
			!providersQ.isLoading &&
			programScoped.length === 0 ? (
				<div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
					No providers returned from vendor-core yet. Run{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						pnpm seed:providers
					</code>{" "}
					(after vendor-core provider seed is deployed), then refresh.
				</div>
			) : null}

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Providers",
						value: stats.total,
						hint: programFilter,
						icon: Stethoscope,
						tone: "text-violet-700 bg-violet-500/15 ring-violet-500/20",
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
						hint: "Awaiting credentialing",
						icon: Clock3,
						tone: "text-amber-700 bg-amber-500/15 ring-amber-500/20",
					},
					{
						label: "Termed",
						value: stats.termed,
						hint: "Enrollment ended",
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
					<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-800">
						Provider search
					</label>
				</div>
				<div className="relative">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-600" />
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder="Search providers by Name, NPI, Tax ID, TIN, or Specialty..."
						className="h-11 border-violet-200/60 pl-10 text-sm focus-visible:ring-violet-500/30"
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
							Specialty
						</label>
						<Select
							value={specialty}
							onValueChange={(v) => {
								setSpecialty(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All specialties</SelectItem>
								{specialties.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							Provider type
						</label>
						<Select
							value={providerType}
							onValueChange={(v) => {
								setProviderType(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								<SelectItem value="Individual">Individual</SelectItem>
								<SelectItem value="Group">Group</SelectItem>
								<SelectItem value="Facility">Facility</SelectItem>
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
									setSpecialty("all");
									setProviderType("all");
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
								providers match
							</p>
						)}
					</div>
				</div>
			</div>

			<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
					<div>
						<p className="text-sm font-semibold tracking-tight text-foreground">
							Provider directory
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
								<TableHead className="pl-3">Provider</TableHead>
								<TableHead>NPI</TableHead>
								<TableHead>Specialty</TableHead>
								<TableHead>Practice</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Claims (12m)</TableHead>
								<TableHead className="text-right">Paid (12m)</TableHead>
								<TableHead className="pr-3">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((p) => (
								<TableRow
									key={p.id}
									className="cursor-pointer hover:bg-muted/30"
									onClick={() => router.push(`/admin/providers/${p.id}`)}
								>
									<TableCell className="pl-3">
										<div className="min-w-0">
											<p className="text-sm font-medium text-primary">
												{displayProviderName(p)}
											</p>
											<p className="truncate text-[11px] text-muted-foreground">
												{p.subspecialty}
											</p>
										</div>
									</TableCell>
									<TableCell className="font-mono text-xs">{p.npi}</TableCell>
									<TableCell className="text-sm">{p.specialty}</TableCell>
									<TableCell className="max-w-[180px]">
										<p className="truncate text-sm">{p.practiceName}</p>
										<p className="truncate text-[10px] text-muted-foreground">
											{p.practicePhone}
										</p>
									</TableCell>
									<TableCell className="text-sm">{p.providerType}</TableCell>
									<TableCell>
										<StatusPill status={p.status} />
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{formatCompact(p.claims12m)}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{formatCurrency(p.paid12m)}
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
											<Link href={`/admin/providers/${p.id}`}>Open</Link>
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
										{useLive && providersQ.isLoading
											? "Loading providers from vendor-core…"
											: "No providers match the current search and filters."}
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
