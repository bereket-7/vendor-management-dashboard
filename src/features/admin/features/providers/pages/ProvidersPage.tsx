"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Database,
	Download,
	FilePlus2,
	Filter,
	MoreHorizontal,
	PauseCircle,
	PencilLine,
	RefreshCw,
	Search,
	Stethoscope,
	Undo2,
	UserX,
} from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	type ProviderStatus,
	type ProviderSummary,
	displayProviderName,
	formatCompact,
	formatCurrency,
} from "@/features/admin/features/providers/feature/api/providersApi";
import {
	useCreateProviderRosterMutation,
	useDeleteProviderMutation,
	useDeleteProviderRosterMutation,
	useInvalidateVendorCore,
	useProviderDashboardStatsQuery,
	useProviderRostersQuery,
	useProviderSummariesList,
	useProvidersListQuery,
	useRecountProviderRosterMutation,
	useRestoreProviderMutation,
	useRestoreProviderRosterMutation,
	useSeedProvidersMutation,
	useSetProviderStatusMutation,
} from "@/features/admin/features/providers/feature/queries/useProvidersQuery";
import { providersToSummaries } from "@/features/admin/features/providers/live-providers";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import type { ProviderRosterCreateInput } from "@/lib/vendor-core/types";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const th =
	"h-9 px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-2 py-2 text-[12px] align-middle text-foreground";

const compactFieldClass = cn(
	"h-8 rounded-md border border-border bg-background text-xs shadow-none",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const compactLabelClass =
	"text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

function CompactField({
	id,
	label,
	children,
	className,
}: {
	id?: string;
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-w-0 space-y-0.5", className)}>
			<label htmlFor={id} className={compactLabelClass}>
				{label}
			</label>
			{children}
		</div>
	);
}

const STATUS_TONE: Record<ProviderStatus, string> = {
	active:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	inactive: "bg-muted text-muted-foreground",
	pending:
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
	termed: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

function StatusPill({ status }: { status: ProviderStatus }) {
	const label =
		status === "active"
			? "Active"
			: status === "inactive"
				? "Inactive"
				: status === "pending"
					? "Pending"
					: "Termed";

	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
				STATUS_TONE[status]
			)}
			title={label}
		>
			{label}
		</span>
	);
}

function SectionCard({
	title,
	action,
	children,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-lg border border-border bg-card">
			<div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
				<div className="flex min-w-0 items-center gap-2">
					<span
						aria-hidden
						className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary"
					/>
					<h2 className="text-xs font-bold tracking-wide text-foreground">
						{title}
					</h2>
				</div>
				{action}
			</div>
			{children}
		</section>
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
	const [includeArchived, setIncludeArchived] = useState(false);
	const providersQ = useProvidersListQuery(
		useLive
			? {
					is_deleted: includeArchived,
					is_visible: true,
				}
			: undefined,
		useLive
	);
	const archivedProvidersQ = useProvidersListQuery(
		useLive
			? {
					is_deleted: true,
				}
			: undefined,
		useLive
	);
	const rostersQ = useProviderRostersQuery(
		{
			is_deleted: false,
			is_visible: true,
		},
		useLive
	);
	const archivedRostersQ = useProviderRostersQuery(
		{
			is_deleted: true,
		},
		useLive
	);
	const statsQ = useProviderDashboardStatsQuery(
		{
			program: programFilter as "MDH" | "DHCF" | "BHP",
		},
		useLive
	);
	const { providers: mockSummaries } = useProviderSummariesList();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [specialty, setSpecialty] = useState("all");
	const [providerType, setProviderType] = useState("all");
	const [showMoreFilters, setShowMoreFilters] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [refreshing, setRefreshing] = useState(false);
	const [actingProviderId, setActingProviderId] = useState<string | null>(null);
	const [isCreateRosterOpen, setIsCreateRosterOpen] = useState(false);
	const [rosterFormBusy, setRosterFormBusy] = useState(false);
	const [rosterForm, setRosterForm] = useState<ProviderRosterCreateInput>({
		original_filename: "",
		received_at: new Date().toISOString().slice(0, 10),
		provider_count: 0,
		is_visible: true,
		metadata: {},
	});
	const setStatusMutation = useSetProviderStatusMutation();
	const deleteProviderMutation = useDeleteProviderMutation();
	const restoreProviderMutation = useRestoreProviderMutation();
	const seedProvidersMutation = useSeedProvidersMutation();
	const createRosterMutation = useCreateProviderRosterMutation();
	const deleteRosterMutation = useDeleteProviderRosterMutation();
	const recountRosterMutation = useRecountProviderRosterMutation();
	const confirm = useConfirm();
	const restoreRosterMutation = useRestoreProviderRosterMutation();

	async function handleSeedProviders(): Promise<void> {
		if (!useLive) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		try {
			const result = await seedProvidersMutation.mutateAsync({ force: false });
			const created =
				typeof result === "object" && result && "created" in result
					? Number((result as { created?: number }).created) || 0
					: 0;
			toast.success(
				created > 0
					? `Seeded ${created} demo provider(s).`
					: "Seed finished (nothing new created)."
			);
			await invalidate();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to seed providers."
			);
		}
	}
	const programScoped = useMemo((): ProviderSummary[] => {
		if (useLive) {
			return providersToSummaries(
				providersQ.data ?? [],
				programFilter as ProviderSummary["program"]
			);
		}
		return mockSummaries.filter((p) => p.program === programFilter);
	}, [useLive, providersQ.data, programFilter, mockSummaries]);

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

	const totalCount = filtered.length;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filtered.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);
	const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const rangeEnd = Math.min(safePage * pageSize, totalCount);

	const pageButtons = Array.from({ length: pageCount }, (_, i) => i + 1).slice(
		0,
		5
	);

	const kpiStats = useMemo(() => {
		if (useLive && statsQ.data) {
			return {
				total: statsQ.data.total,
				active: statsQ.data.active,
				pending: statsQ.data.pending,
				termed: statsQ.data.termed,
				inactive: statsQ.data.inactive,
			};
		}
		return {
			total: programScoped.length,
			active: programScoped.filter((p) => p.status === "active").length,
			pending: programScoped.filter((p) => p.status === "pending").length,
			termed: programScoped.filter((p) => p.status === "termed").length,
			inactive: programScoped.filter((p) => p.status === "inactive").length,
		};
	}, [useLive, statsQ.data, programScoped]);

	const hasFilters =
		search.trim().length > 0 ||
		status !== "all" ||
		specialty !== "all" ||
		providerType !== "all";

	const isLoading = useLive && providersQ.isLoading && !providersQ.data;

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

	async function handleSetStatus(
		id: string,
		statusValue: ProviderStatus
	): Promise<void> {
		if (!useLive) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		setActingProviderId(id);
		try {
			await setStatusMutation.mutateAsync({
				id,
				body: { status: statusValue },
			});
			toast.success(`Provider status updated to ${statusValue}.`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to update status.";
			toast.error(message);
		} finally {
			setActingProviderId(null);
		}
	}

	async function handleArchiveProvider(id: string): Promise<void> {
		if (!useLive) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		const ok = await confirm({
			title: "Archive this provider?",
			description:
				"It will be removed from the default directory. You can restore it later from archived providers.",
			confirmLabel: "Archive provider",
			cancelLabel: "Keep provider",
			variant: "destructive",
			icon: "archive",
		});
		if (!ok) return;
		setActingProviderId(id);
		try {
			await deleteProviderMutation.mutateAsync({ id });
			toast.success("Provider archived.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to archive provider.";
			toast.error(message);
		} finally {
			setActingProviderId(null);
		}
	}

	async function handleRestoreProvider(id: string): Promise<void> {
		if (!useLive) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		setActingProviderId(id);
		try {
			await restoreProviderMutation.mutateAsync({ id });
			toast.success("Provider restored.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to restore provider.";
			toast.error(message);
		} finally {
			setActingProviderId(null);
		}
	}

	async function handleRecountRoster(id: string): Promise<void> {
		if (!useLive) return;
		try {
			await recountRosterMutation.mutateAsync({ id });
			toast.success("Roster recounted.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to recount roster.";
			toast.error(message);
		}
	}

	function resetRosterForm() {
		setRosterForm({
			original_filename: "",
			received_at: new Date().toISOString().slice(0, 10),
			provider_count: 0,
			is_visible: true,
			metadata: {},
		});
	}

	async function handleCreateRoster(): Promise<void> {
		if (!useLive) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		if (!rosterForm.received_at) {
			toast.error("Received date required.");
			return;
		}
		setRosterFormBusy(true);
		try {
			await createRosterMutation.mutateAsync({
				...rosterForm,
				original_filename: rosterForm.original_filename || undefined,
				provider_count: Number(rosterForm.provider_count ?? 0),
			});
			toast.success("Roster created.");
			setIsCreateRosterOpen(false);
			resetRosterForm();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to create roster.";
			toast.error(message);
		} finally {
			setRosterFormBusy(false);
		}
	}

	async function handleArchiveRoster(id: string): Promise<void> {
		if (!useLive) return;
		const ok = await confirm({
			title: "Archive this roster?",
			description:
				"The roster file will be soft-deleted. Providers on it stay in the system; you can restore the roster later.",
			confirmLabel: "Archive roster",
			cancelLabel: "Keep roster",
			variant: "destructive",
			icon: "archive",
		});
		if (!ok) return;
		try {
			await deleteRosterMutation.mutateAsync({ id });
			toast.success("Roster archived.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to archive roster.";
			toast.error(message);
		}
	}

	async function handleRestoreRoster(id: string): Promise<void> {
		if (!useLive) return;
		try {
			await restoreRosterMutation.mutateAsync({ id });
			toast.success("Roster restored.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to restore roster.";
			toast.error(message);
		}
	}

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setSpecialty("all");
		setProviderType("all");
		setPage(1);
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full max-w-md" />
				<Skeleton className="h-11 w-full border border-border" />
				<Skeleton className="h-72 w-full border border-border" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Providers
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Provider directory · {programFilter}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button asChild size="sm" className="h-9">
						<Link href="/admin/providers/create">
							<FilePlus2 className="mr-1.5 size-3.5" />
							New provider
						</Link>
					</Button>
					{useLive ? (
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => void handleSeedProviders()}
							disabled={seedProvidersMutation.isPending}
						>
							<Database className="mr-1.5 size-3.5" />
							{seedProvidersMutation.isPending ? "Seeding…" : "Seed demo"}
						</Button>
					) : null}
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={() => void handleRefresh()}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export
					</Button>
				</div>
			</div>

			{useLive && providersQ.error ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					{providersQ.error.message}
				</div>
			) : null}

			{useLive && !providersQ.isLoading && programScoped.length === 0 ? (
				<div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
					No providers returned from vendor-core yet. Use{" "}
					<strong className="font-medium text-foreground">Seed demo</strong>{" "}
					above, or run{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						pnpm seed:providers
					</code>
					, then refresh.
				</div>
			) : null}

			<section className="overflow-hidden rounded-lg border border-border bg-card">
				<div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-5 sm:divide-x sm:divide-y-0">
					{(
						[
							{
								label: "Total",
								value: kpiStats.total,
								icon: Stethoscope,
								tone: "text-foreground",
							},
							{
								label: "Active",
								value: kpiStats.active,
								icon: CheckCircle2,
								tone: "text-emerald-700 dark:text-emerald-400",
							},
							{
								label: "Pending",
								value: kpiStats.pending,
								icon: Clock3,
								tone: "text-amber-700 dark:text-amber-400",
							},
							{
								label: "Termed",
								value: kpiStats.termed,
								icon: UserX,
								tone: "text-red-700 dark:text-red-400",
							},
							{
								label: "Inactive",
								value: kpiStats.inactive,
								icon: PauseCircle,
								tone: "text-muted-foreground",
							},
						] as const
					).map((item) => {
						const Icon = item.icon;
						return (
							<div key={item.label} className="px-4 py-3.5">
								<div className="flex items-start justify-between gap-2">
									<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
										{item.label}
									</p>
									<Icon
										className={cn("size-3.5 shrink-0 opacity-70", item.tone)}
									/>
								</div>
								<p
									className={cn(
										"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
										item.tone
									)}
								>
									{useLive && statsQ.isLoading
										? "—"
										: item.value.toLocaleString()}
								</p>
							</div>
						);
					})}
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-border bg-card">
				<div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
					<div className="relative min-w-[180px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search name, NPI, Tax ID, specialty…"
							className={cn(compactFieldClass, "pl-8")}
						/>
					</div>
					<Select
						value={status}
						onValueChange={(v) => {
							setStatus(v);
							setPage(1);
						}}
					>
						<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
							<SelectValue placeholder="All status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="termed">Termed</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={specialty}
						onValueChange={(v) => {
							setSpecialty(v);
							setPage(1);
						}}
					>
						<SelectTrigger className={cn(compactFieldClass, "w-[160px]")}>
							<SelectValue placeholder="All specialties" />
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
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={cn(
							"h-8",
							showMoreFilters && "border-primary/40 bg-primary/5 text-primary"
						)}
						onClick={() => setShowMoreFilters((v) => !v)}
					>
						<Filter className="mr-1.5 size-3.5" />
						Filters
						<ChevronDown
							className={cn(
								"ml-1 size-3.5 transition-transform",
								showMoreFilters && "rotate-180"
							)}
						/>
					</Button>
					{hasFilters ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs text-primary"
							onClick={clearFilters}
						>
							Clear
						</Button>
					) : null}
				</div>

				{showMoreFilters ? (
					<div className="grid gap-2 border-b border-border bg-muted/15 p-3 sm:grid-cols-2 lg:grid-cols-4">
						<CompactField label="Provider type">
							<Select
								value={providerType}
								onValueChange={(v) => {
									setProviderType(v);
									setPage(1);
								}}
							>
								<SelectTrigger className={compactFieldClass}>
									<SelectValue placeholder="All types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All types</SelectItem>
									<SelectItem value="Individual">Individual</SelectItem>
									<SelectItem value="Group">Group</SelectItem>
									<SelectItem value="Facility">Facility</SelectItem>
								</SelectContent>
							</Select>
						</CompactField>
						{useLive ? (
							<div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
								<div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
									<Checkbox
										id="include-archived-providers"
										checked={includeArchived}
										onCheckedChange={(checked) => {
											setIncludeArchived(Boolean(checked));
											setPage(1);
										}}
									/>
									<Label
										htmlFor="include-archived-providers"
										className="text-xs font-medium text-muted-foreground"
									>
										Include archived in directory
										{archivedProvidersQ.data
											? ` · ${archivedProvidersQ.data.length} archived`
											: ""}
									</Label>
								</div>
							</div>
						) : null}
					</div>
				) : null}

				<div className="w-full overflow-hidden">
					<Table className="w-full table-fixed">
						<TableHeader>
							<TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
								<TableHead className={cn(th, "w-[4%] text-center")}>
									#
								</TableHead>
								<TableHead className={cn(th, "w-[17%]")}>Provider</TableHead>
								<TableHead className={cn(th, "w-[11%]")}>NPI</TableHead>
								<TableHead className={cn(th, "w-[13%]")}>Specialty</TableHead>
								<TableHead className={cn(th, "w-[15%]")}>Practice</TableHead>
								<TableHead className={cn(th, "w-[9%]")}>Type</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Status</TableHead>
								<TableHead className={cn(th, "w-[8%] text-right")}>
									Claims
								</TableHead>
								<TableHead className={cn(th, "w-[8%] text-right")}>
									Paid
								</TableHead>
								<TableHead className={cn(th, "w-[7%] text-right")}>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((p, index) => (
								<TableRow
									key={p.id}
									className="cursor-pointer border-b border-border/70 hover:bg-muted/50"
									onClick={() => router.push(`/admin/providers/${p.id}`)}
								>
									<TableCell
										className={cn(
											td,
											"text-center tabular-nums text-muted-foreground"
										)}
									>
										{(safePage - 1) * pageSize + index + 1}
									</TableCell>
									<TableCell className={td}>
										<span
											className="block truncate font-medium text-primary hover:underline"
											title={displayProviderName(p)}
										>
											{displayProviderName(p)}
										</span>
										{p.subspecialty ? (
											<span
												className="mt-0.5 block truncate text-[11px] text-muted-foreground"
												title={p.subspecialty}
											>
												{p.subspecialty}
											</span>
										) : null}
									</TableCell>
									<TableCell
										className={cn(td, "truncate font-mono text-[11px]")}
										title={p.npi}
									>
										{p.npi}
									</TableCell>
									<TableCell className={cn(td, "truncate")} title={p.specialty}>
										{p.specialty}
									</TableCell>
									<TableCell className={td}>
										<span className="block truncate" title={p.practiceName}>
											{p.practiceName}
										</span>
										{p.practicePhone ? (
											<span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
												{p.practicePhone}
											</span>
										) : null}
									</TableCell>
									<TableCell
										className={cn(td, "truncate text-muted-foreground")}
									>
										{p.providerType}
									</TableCell>
									<TableCell className={td}>
										<StatusPill status={p.status} />
									</TableCell>
									<TableCell className={cn(td, "text-right tabular-nums")}>
										{formatCompact(p.claims12m)}
									</TableCell>
									<TableCell className={cn(td, "text-right tabular-nums")}>
										{formatCurrency(p.paid12m)}
									</TableCell>
									<TableCell
										className={cn(td, "text-right")}
										onClick={(e) => e.stopPropagation()}
									>
										<div className="flex items-center justify-end gap-1">
											<Button
												asChild
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-xs"
											>
												<Link href={`/admin/providers/${p.id}`}>Open</Link>
											</Button>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														disabled={
															actingProviderId === p.id ||
															setStatusMutation.isPending ||
															deleteProviderMutation.isPending
														}
													>
														<MoreHorizontal className="size-3.5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link href={`/admin/providers/${p.id}/edit`}>
															<PencilLine className="mr-2 size-3.5" />
															Edit provider
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => void handleSetStatus(p.id, "active")}
													>
														Set status: Active
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															void handleSetStatus(p.id, "pending")
														}
													>
														Set status: Pending
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															void handleSetStatus(p.id, "inactive")
														}
													>
														Set status: Inactive
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => void handleSetStatus(p.id, "termed")}
													>
														Set status: Termed
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() => void handleArchiveProvider(p.id)}
													>
														Archive provider
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</TableCell>
								</TableRow>
							))}
							{pageRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-20 text-center text-sm text-muted-foreground"
									>
										No providers match your filters.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
					<p>
						Showing{" "}
						<span className="font-medium text-foreground">{rangeStart}</span> to{" "}
						<span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
						<span className="font-medium text-foreground">
							{totalCount.toLocaleString()}
						</span>{" "}
						entries
					</p>
					<div className="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							disabled={safePage <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							<ChevronLeft className="size-3.5" />
						</Button>
						{pageButtons.map((n) => (
							<Button
								key={n}
								variant={n === safePage ? "default" : "outline"}
								size="icon"
								className="size-7 text-xs"
								onClick={() => setPage(n)}
							>
								{n}
							</Button>
						))}
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							disabled={safePage >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
						>
							<ChevronRight className="size-3.5" />
						</Button>
						<Select
							value={String(pageSize)}
							onValueChange={(v) => {
								setPageSize(Number(v));
								setPage(1);
							}}
						>
							<SelectTrigger className="h-7 w-[88px] text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10/page</SelectItem>
								<SelectItem value="20">20/page</SelectItem>
								<SelectItem value="50">50/page</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>

			{useLive ? (
				<SectionCard title="Archived providers">
					<div className="w-full overflow-hidden">
						<Table className="w-full table-fixed">
							<TableHeader>
								<TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
									<TableHead className={cn(th, "w-[40%]")}>Provider</TableHead>
									<TableHead className={cn(th, "w-[25%]")}>NPI</TableHead>
									<TableHead className={cn(th, "w-[15%]")}>Status</TableHead>
									<TableHead className={cn(th, "w-[20%] text-right")}>
										Action
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(archivedProvidersQ.data ?? []).map((row) => (
									<TableRow key={row.id} className="border-b border-border/70">
										<TableCell className={cn(td, "truncate font-medium")}>
											{row.name}
										</TableCell>
										<TableCell className={cn(td, "font-mono text-[11px]")}>
											{row.npi}
										</TableCell>
										<TableCell className={td}>
											<StatusPill
												status={
													(row.status as ProviderStatus | undefined) ??
													"inactive"
												}
											/>
										</TableCell>
										<TableCell className={cn(td, "text-right")}>
											<Button
												variant="outline"
												size="sm"
												className="h-7 text-xs"
												disabled={actingProviderId === row.id}
												onClick={() => void handleRestoreProvider(row.id)}
											>
												<Undo2 className="mr-1.5 size-3.5" />
												Restore
											</Button>
										</TableCell>
									</TableRow>
								))}
								{(archivedProvidersQ.data?.length ?? 0) === 0 ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-16 text-center text-sm text-muted-foreground"
										>
											No archived providers.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</div>
				</SectionCard>
			) : null}

			{useLive ? (
				<SectionCard
					title="Provider rosters"
					action={
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							onClick={() => {
								resetRosterForm();
								setIsCreateRosterOpen(true);
							}}
						>
							<FilePlus2 className="mr-1.5 size-3.5" />
							New roster
						</Button>
					}
				>
					<div className="w-full overflow-hidden">
						<Table className="w-full table-fixed">
							<TableHeader>
								<TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
									<TableHead className={cn(th, "w-[22%]")}>Reference</TableHead>
									<TableHead className={cn(th, "w-[28%]")}>Filename</TableHead>
									<TableHead className={cn(th, "w-[16%]")}>Received</TableHead>
									<TableHead className={cn(th, "w-[12%] text-right")}>
										Count
									</TableHead>
									<TableHead className={cn(th, "w-[22%] text-right")}>
										Action
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(rostersQ.data ?? []).map((roster) => (
									<TableRow
										key={roster.id}
										className="border-b border-border/70"
									>
										<TableCell
											className={cn(td, "truncate font-mono text-[11px]")}
										>
											{roster.reference_id ?? "—"}
										</TableCell>
										<TableCell className={cn(td, "truncate")}>
											{roster.original_filename ?? "—"}
										</TableCell>
										<TableCell className={cn(td, "tabular-nums")}>
											{roster.received_at ?? "—"}
										</TableCell>
										<TableCell className={cn(td, "text-right tabular-nums")}>
											{(roster.provider_count ?? 0).toLocaleString()}
										</TableCell>
										<TableCell className={cn(td, "text-right")}>
											<div className="flex justify-end gap-1">
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-xs"
													onClick={() => void handleRecountRoster(roster.id)}
												>
													<Database className="mr-1.5 size-3.5" />
													Recount
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 text-xs text-destructive"
													onClick={() => void handleArchiveRoster(roster.id)}
												>
													Archive
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
								{(rostersQ.data?.length ?? 0) === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-16 text-center text-sm text-muted-foreground"
										>
											No rosters found. Seed providers first.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</div>
				</SectionCard>
			) : null}

			{useLive ? (
				<SectionCard title="Archived rosters">
					<div className="w-full overflow-hidden">
						<Table className="w-full table-fixed">
							<TableHeader>
								<TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
									<TableHead className={cn(th, "w-[28%]")}>Reference</TableHead>
									<TableHead className={cn(th, "w-[36%]")}>Filename</TableHead>
									<TableHead className={cn(th, "w-[18%]")}>Received</TableHead>
									<TableHead className={cn(th, "w-[18%] text-right")}>
										Action
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(archivedRostersQ.data ?? []).map((roster) => (
									<TableRow
										key={roster.id}
										className="border-b border-border/70"
									>
										<TableCell
											className={cn(td, "truncate font-mono text-[11px]")}
										>
											{roster.reference_id ?? "—"}
										</TableCell>
										<TableCell className={cn(td, "truncate")}>
											{roster.original_filename ?? "—"}
										</TableCell>
										<TableCell className={cn(td, "tabular-nums")}>
											{roster.received_at ?? "—"}
										</TableCell>
										<TableCell className={cn(td, "text-right")}>
											<Button
												variant="outline"
												size="sm"
												className="h-7 text-xs"
												onClick={() => void handleRestoreRoster(roster.id)}
											>
												<Undo2 className="mr-1.5 size-3.5" />
												Restore
											</Button>
										</TableCell>
									</TableRow>
								))}
								{(archivedRostersQ.data?.length ?? 0) === 0 ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-16 text-center text-sm text-muted-foreground"
										>
											No archived rosters.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</div>
				</SectionCard>
			) : null}

			<Dialog open={isCreateRosterOpen} onOpenChange={setIsCreateRosterOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Create roster</DialogTitle>
						<DialogDescription>
							Create provider roster file container for provider imports.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3">
						<div className="space-y-1">
							<Label htmlFor="roster-filename">Original filename</Label>
							<Input
								id="roster-filename"
								value={rosterForm.original_filename ?? ""}
								onChange={(e) =>
									setRosterForm((prev) => ({
										...prev,
										original_filename: e.target.value,
									}))
								}
								placeholder="providers_2026-08.csv"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="roster-received">Received at</Label>
							<Input
								id="roster-received"
								type="date"
								value={rosterForm.received_at}
								onChange={(e) =>
									setRosterForm((prev) => ({
										...prev,
										received_at: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="roster-count">Provider count</Label>
							<Input
								id="roster-count"
								type="number"
								min={0}
								value={String(rosterForm.provider_count ?? 0)}
								onChange={(e) =>
									setRosterForm((prev) => ({
										...prev,
										provider_count: Number(e.target.value || 0),
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateRosterOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void handleCreateRoster()}
							disabled={rosterFormBusy}
						>
							Create roster
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
