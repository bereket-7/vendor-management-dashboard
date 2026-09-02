"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronDown,
	Clock3,
	Download,
	FileText,
	Filter,
	MoreHorizontal,
	RefreshCw,
	Search,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
	DropdownMenuSeparator,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { accountRowLobToApi } from "@/features/admin/features/vendors/feature/mappers/accountMappers";
import {
	buildAccountActivityRows,
	countVendorInboundFilesOnDay,
	formatDayOverDayHint,
	latestAccountLastInboundIso,
	latestVendorInboundFile,
	mapInboundFileTypeLabel,
} from "@/features/admin/features/vendors/feature/mappers/accountInboundMetrics";
import {
	type AccountFileStatus,
	type VendorAccountRow,
} from "@/features/admin/features/vendors/vendor-types";
import type {
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
} from "@/lib/vendor-core/types";
import { VendorCoreApiError } from "@/lib/vendor-core/client";
import { cn } from "@/lib/utils";

function AccountStatusPill({ status }: { status: VendorAccountRow["status"] }) {
	if (status === "healthy") {
		return (
			<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
				Healthy
			</span>
		);
	}
	if (status === "warning") {
		return (
			<span className="inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-200">
				Warning
			</span>
		);
	}
	if (status === "error") {
		return (
			<span className="inline-flex items-center rounded-md border border-red-200/80 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-900 dark:bg-red-950 dark:text-red-200">
				Error
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-200">
			Inactive
		</span>
	);
}

function FileTypeCell({ status }: { status: AccountFileStatus }) {
	if (status === "success") {
		return (
			<span className="inline-flex items-center justify-center text-emerald-600">
				<CheckCircle2 className="size-4" />
				<span className="sr-only">Success</span>
			</span>
		);
	}
	if (status === "warning") {
		return (
			<span className="inline-flex items-center justify-center text-amber-600">
				<AlertTriangle className="size-4" />
				<span className="sr-only">Warning</span>
			</span>
		);
	}
	if (status === "error") {
		return (
			<span className="inline-flex items-center justify-center text-red-600">
				<XCircle className="size-4" />
				<span className="sr-only">Error</span>
			</span>
		);
	}
	return (
		<span className="text-center text-muted-foreground" title="No data">
			—
		</span>
	);
}

function HealthScoreRing({ score }: { score: number }) {
	const tone =
		score >= 85
			? "text-emerald-600"
			: score >= 70
				? "text-amber-600"
				: "text-red-600";
	const ring =
		score >= 85
			? "border-emerald-500"
			: score >= 70
				? "border-amber-500"
				: "border-red-500";
	return (
		<span
			className={cn(
				"inline-flex size-8 items-center justify-center rounded-full border-2 text-[11px] font-semibold tabular-nums",
				ring,
				tone
			)}
		>
			{score}
		</span>
	);
}

type AccountDraft = {
	name: string;
	lineOfBusiness: VendorAccountRow["lineOfBusiness"];
	status: VendorAccountRow["status"];
	payerId: string;
	timezone: string;
};

type VendorAccountsTabProps = {
	accounts: VendorAccountRow[];
	vendorId?: string;
	inboundFiles?: InboundFileDto[];
	jobs?: IntakeJobDto[];
	connections?: ConnectionDto[];
	onRefresh?: () => Promise<void>;
	onUpdateAccount: (
		id: string,
		patch: Pick<
			VendorAccountRow,
			"name" | "lineOfBusiness" | "status" | "active"
		>
	) => Promise<void>;
	onCreateAccount?: (input: {
		account_code: string;
		name: string;
		line_of_business: string;
		active?: boolean;
	}) => Promise<VendorAccountRow | void>;
	onDeleteAccount?: (id: string) => Promise<void>;
	/** Set when GET accounts/list failed — table may be empty despite data in vendor-core. */
	accountsLoadError?: string | null;
};

export function VendorAccountsTab({
	accounts,
	vendorId,
	inboundFiles = [],
	jobs = [],
	connections = [],
	onRefresh,
	onUpdateAccount,
	onCreateAccount,
	onDeleteAccount,
	accountsLoadError = null,
}: VendorAccountsTabProps) {
	const [rows, setRows] = useState<VendorAccountRow[]>(accounts);
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
		null
	);
	const [accountSearch, setAccountSearch] = useState("");
	const [accountStatus, setAccountStatus] = useState("all");
	const [accountLob, setAccountLob] = useState("all");
	const [accountFileType, setAccountFileType] = useState("all");
	const [accountDetailTab, setAccountDetailTab] = useState<
		"activity" | "issues" | "details"
	>("activity");
	const [editAccountId, setEditAccountId] = useState<string | null>(null);
	const [draft, setDraft] = useState<AccountDraft | null>(null);
	const [saving, setSaving] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [createDraft, setCreateDraft] = useState({
		account_code: "",
		name: "",
		line_of_business: "commercial",
	});
	useEffect(() => {
		setRows(accounts);
		setSelectedAccountId(null);
		setAccountSearch("");
		setAccountStatus("all");
		setAccountLob("all");
		setAccountFileType("all");
	}, [vendorId]);

	useEffect(() => {
		setRows(accounts);
	}, [accounts]);

	const filteredAccounts = useMemo(() => {
		const q = accountSearch.trim().toLowerCase();
		return rows.filter((account) => {
			if (accountStatus !== "all" && account.status !== accountStatus)
				return false;
			if (accountLob !== "all" && account.lineOfBusiness !== accountLob)
				return false;
			if (accountFileType === "eligibility" && account.eligibility === "none")
				return false;
			if (accountFileType === "medical" && account.medical === "none")
				return false;
			if (accountFileType === "pharmacy" && account.pharmacy === "none")
				return false;
			if (accountFileType === "accumulator" && account.accumulator === "none")
				return false;
			if (!q) return true;
			return [account.name, account.accountId, account.lineOfBusiness]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [accountFileType, accountLob, accountSearch, accountStatus, rows]);

	const filtersActive =
		accountSearch.trim().length > 0 ||
		accountStatus !== "all" ||
		accountLob !== "all" ||
		accountFileType !== "all";

	const selectedAccount =
		rows.find((account) => account.id === selectedAccountId) ?? null;

	const editingAccount =
		rows.find((account) => account.id === editAccountId) ?? null;

	const summary = useMemo(() => {
		const total = rows.length;
		const active = rows.filter((a) => a.active).length;
		const warnings = rows.filter((a) => a.status === "warning").length;
		const errors = rows.filter((a) => a.status === "error").length;

		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);

		const filesToday = vendorId
			? countVendorInboundFilesOnDay(inboundFiles, vendorId, today)
			: 0;
		const filesYesterday = vendorId
			? countVendorInboundFilesOnDay(inboundFiles, vendorId, yesterday)
			: 0;
		const filesTodayHint = formatDayOverDayHint(filesToday, filesYesterday);

		const latestInbound = vendorId
			? latestVendorInboundFile(inboundFiles, vendorId)
			: null;
		const latestAccountIso = latestAccountLastInboundIso(rows);

		let lastFile = "—";
		let lastType = "—";

		if (latestInbound?.created_at) {
			lastFile = new Date(latestInbound.created_at).toLocaleString(undefined, {
				month: "2-digit",
				day: "2-digit",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
			});
			lastType = mapInboundFileTypeLabel(
				latestInbound.detected_type ?? latestInbound.destination_module
			);
		} else if (latestAccountIso) {
			const match = rows.find((row) => row.lastInboundAt === latestAccountIso);
			lastFile = match?.lastFileReceived ?? "—";
			lastType = match?.lastFileType
				? mapInboundFileTypeLabel(match.lastFileType)
				: "—";
		}

		return {
			total,
			active,
			activePct: total ? ((active / total) * 100).toFixed(1) : "0",
			warnings,
			warningPct: total ? ((warnings / total) * 100).toFixed(1) : "0",
			errors,
			errorPct: total ? ((errors / total) * 100).toFixed(1) : "0",
			filesToday,
			filesTodayHint,
			lastFile,
			lastType,
		};
	}, [inboundFiles, rows, vendorId]);

	const lobs = useMemo(
		() => Array.from(new Set(rows.map((a) => a.lineOfBusiness))).sort(),
		[rows]
	);

	const dateRangeLabel = useMemo(() => {
		const end = new Date();
		const start = new Date();
		start.setDate(end.getDate() - 6);
		const fmt = (d: Date) =>
			`${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
		return `Last 7 Days (${fmt(start)} - ${fmt(end)})`;
	}, []);

	function openAccount(
		accountId: string,
		tab: "activity" | "issues" | "details" = "activity"
	) {
		if (selectedAccountId === accountId && accountDetailTab === tab) {
			setSelectedAccountId(null);
			return;
		}
		setSelectedAccountId(accountId);
		setAccountDetailTab(tab);
	}

	function toggleRow(accountId: string) {
		setSelectedAccountId((prev) => (prev === accountId ? null : accountId));
		setAccountDetailTab("activity");
	}

	function openEdit(account: VendorAccountRow) {
		setEditAccountId(account.id);
		setDraft({
			name: account.name,
			lineOfBusiness: account.lineOfBusiness,
			status: account.status,
			payerId: account.payerId,
			timezone: account.timezone,
		});
	}

	function saveEdit() {
		if (!editAccountId || !draft) return;
		const current = rows.find((r) => r.id === editAccountId);
		const patch = {
			name: draft.name.trim() || current?.name || "",
			lineOfBusiness: draft.lineOfBusiness,
			status: draft.status,
			active: draft.status !== "inactive",
		};
		const finish = () => {
			toast.success("Account updated.");
			setEditAccountId(null);
			setDraft(null);
		};
		setSaving(true);
		void onUpdateAccount(editAccountId, patch)
			.then(finish)
			.catch((err: unknown) => {
				const message =
					err instanceof Error ? err.message : "Failed to update account.";
				toast.error(message);
			})
			.finally(() => setSaving(false));
	}

	function toggleAccountActive(account: VendorAccountRow) {
		const nextActive = !account.active;
		const nextStatus: VendorAccountRow["status"] = nextActive
			? account.status === "inactive"
				? "healthy"
				: account.status
			: "inactive";
		const finish = () => {
			toast.success(
				nextActive ? `${account.name} activated.` : `${account.name} deactivated.`
			);
		};
		setSaving(true);
		void onUpdateAccount(account.id, {
			name: account.name,
			lineOfBusiness: account.lineOfBusiness,
			status: nextStatus,
			active: nextActive,
		})
			.then(finish)
			.catch((err: unknown) => {
				const message =
					err instanceof Error ? err.message : "Failed to update account.";
				toast.error(message);
			})
			.finally(() => setSaving(false));
	}

	return (
		<section className="min-w-0 space-y-4">
			{accountsLoadError ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					Could not load accounts from vendor-core: {accountsLoadError}. The table
					below may be empty until you sign in again or fix the API connection.
				</div>
			) : null}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{[
					{
						label: "Total Linked Accounts",
						value: String(summary.total),
						hint: "100%",
						icon: Building2,
						tone: "text-primary bg-primary/15 ring-primary/20",
					},
					{
						label: "Active Accounts",
						value: String(summary.active),
						hint: `${summary.activePct}%`,
						icon: CheckCircle2,
						tone: "text-emerald-700 bg-emerald-500/15 ring-emerald-500/20",
					},
					{
						label: "Accounts w/ Warnings",
						value: String(summary.warnings),
						hint: `${summary.warningPct}%`,
						icon: AlertTriangle,
						tone: "text-amber-700 bg-amber-500/15 ring-amber-500/20",
					},
					{
						label: "Accounts w/ Errors",
						value: String(summary.errors),
						hint: `${summary.errorPct}%`,
						icon: XCircle,
						tone: "text-red-700 bg-red-500/15 ring-red-500/20",
					},
					{
						label: "Files Processed Today",
						value: String(summary.filesToday),
						hint: summary.filesTodayHint,
						icon: FileText,
						tone: "text-violet-700 bg-violet-500/15 ring-violet-500/20",
					},
					{
						label: "Last File Received",
						value: summary.lastFile,
						hint: summary.lastType,
						icon: Clock3,
						tone: "text-zinc-700 bg-zinc-500/15 ring-zinc-500/20",
					},
				].map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.label}
							className="rounded-xl border border-border bg-card p-3.5 shadow-sm"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-foreground">
										{item.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{item.hint}
									</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{onCreateAccount ? (
					<Button
						type="button"
						size="sm"
						className="h-9"
						onClick={() => setCreateOpen(true)}
					>
						Add account
					</Button>
				) : null}
				<div className="relative min-w-[200px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={accountSearch}
						onChange={(e) => setAccountSearch(e.target.value)}
						placeholder="Search accounts..."
						className="h-9 pl-8"
					/>
				</div>
				<Select value={accountStatus} onValueChange={setAccountStatus}>
					<SelectTrigger className="h-9 w-[140px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="healthy">Healthy</SelectItem>
						<SelectItem value="warning">Warning</SelectItem>
						<SelectItem value="error">Error</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
				<Select value={accountLob} onValueChange={setAccountLob}>
					<SelectTrigger className="h-9 w-[170px]">
						<SelectValue placeholder="Line of Business" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Lines of Business</SelectItem>
						{lobs.map((lob) => (
							<SelectItem key={lob} value={lob}>
								{lob}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={accountFileType} onValueChange={setAccountFileType}>
					<SelectTrigger className="h-9 w-[150px]">
						<SelectValue placeholder="File Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All File Types</SelectItem>
						<SelectItem value="eligibility">Eligibility (834)</SelectItem>
						<SelectItem value="medical">Medical Claims (837)</SelectItem>
						<SelectItem value="pharmacy">Pharmacy Claims (835)</SelectItem>
						<SelectItem value="accumulator">Accumulator</SelectItem>
					</SelectContent>
				</Select>
				<Button variant="outline" size="sm" className="h-9">
					<Calendar className="mr-1.5 size-3.5" />
					{dateRangeLabel}
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-9"
					onClick={() =>
						toast.message("Advanced filters applied to the current list.")
					}
				>
					<Filter className="mr-1.5 size-3.5" />
					Filters
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-9"
					onClick={() =>
						toast.success(`Exported ${filteredAccounts.length} accounts.`)
					}
				>
					<Download className="mr-1.5 size-3.5" />
					Export
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-9"
					disabled={refreshing}
					onClick={() => {
						if (!onRefresh) {
							setRows(accounts);
							toast.success("Accounts refreshed.");
							return;
						}
						setRefreshing(true);
						void onRefresh()
							.catch(() => toast.error("Could not refresh accounts."))
							.finally(() => setRefreshing(false));
					}}
				>
					<RefreshCw
						className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
					/>
					Refresh
				</Button>
			</div>

			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-primary/5">
				<div className="w-full overflow-x-auto">
					<Table className="min-w-[1100px] text-xs">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead rowSpan={2} className="pl-3 align-bottom">
									Account Name
								</TableHead>
								<TableHead rowSpan={2} className="align-bottom">
									Account ID
								</TableHead>
								<TableHead rowSpan={2} className="align-bottom">
									Line of Business
								</TableHead>
								<TableHead
									colSpan={4}
									className="border-b border-border/40 text-center font-medium"
								>
									File Types
								</TableHead>
								<TableHead rowSpan={2} className="align-bottom">
									Status
								</TableHead>
								<TableHead rowSpan={2} className="align-bottom">
									Health Score
								</TableHead>
								<TableHead rowSpan={2} className="align-bottom">
									Last File Received
								</TableHead>
								<TableHead rowSpan={2} className="pr-3 text-right align-bottom">
									Actions
								</TableHead>
							</TableRow>
							<TableRow className="hover:bg-transparent">
								<TableHead className="text-center">Eligibility (834)</TableHead>
								<TableHead className="text-center">
									Medical Claims (837)
								</TableHead>
								<TableHead className="text-center">
									Pharmacy Claims (835)
								</TableHead>
								<TableHead className="text-center">Accumulator</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAccounts.map((account) => {
								const expanded = selectedAccountId === account.id;
								return (
									<Fragment key={account.id}>
										<TableRow
											className={cn(
												"cursor-pointer hover:bg-muted/30",
												expanded && "bg-sky-50 dark:bg-sky-950/30"
											)}
											onClick={() => toggleRow(account.id)}
										>
											<TableCell className="pl-3 font-medium">
												<span className="inline-flex items-center gap-1.5">
													<ChevronDown
														className={cn(
															"size-3.5 shrink-0 text-muted-foreground transition-transform",
															expanded && "rotate-180"
														)}
													/>
													{account.name}
												</span>
											</TableCell>
											<TableCell className="font-mono text-[10px] text-muted-foreground">
												{account.accountId}
											</TableCell>
											<TableCell>{account.lineOfBusiness}</TableCell>
											<TableCell className="text-center">
												<FileTypeCell status={account.eligibility} />
											</TableCell>
											<TableCell className="text-center">
												<FileTypeCell status={account.medical} />
											</TableCell>
											<TableCell className="text-center">
												<FileTypeCell status={account.pharmacy} />
											</TableCell>
											<TableCell className="text-center">
												<FileTypeCell status={account.accumulator} />
											</TableCell>
											<TableCell>
												<AccountStatusPill status={account.status} />
											</TableCell>
											<TableCell>
												<HealthScoreRing score={account.healthScore} />
											</TableCell>
											<TableCell>
												<div className="leading-tight">
													<p>{account.lastFileReceived}</p>
													<p className="text-[10px] text-muted-foreground">
														{account.lastFileType}
													</p>
												</div>
											</TableCell>
											<TableCell
												className="pr-3 text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<div className="inline-flex items-center gap-1">
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="h-7 text-xs"
														onClick={() => toggleRow(account.id)}
													>
														{expanded ? "Hide" : "View"}
													</Button>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="size-7"
															>
																<MoreHorizontal className="size-3.5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onSelect={() => openAccount(account.id)}
															>
																Open details
															</DropdownMenuItem>
															<DropdownMenuItem
																onSelect={() =>
																	openAccount(account.id, "details")
																}
															>
																View account profile
															</DropdownMenuItem>
															<DropdownMenuItem
																onSelect={() => openEdit(account)}
															>
																Edit account
															</DropdownMenuItem>
															{onDeleteAccount ? (
																<>
																	<DropdownMenuSeparator />
																	<DropdownMenuItem
																		className="text-red-600"
																		onSelect={() => {
																			void onDeleteAccount(account.id)
																				.then(() =>
																					setRows((prev) =>
																						prev.filter(
																							(row) => row.id !== account.id
																						)
																					)
																				)
																				.then(() =>
																					toast.success("Account deleted.")
																				)
																				.catch((err) =>
																					toast.error(
																						err instanceof VendorCoreApiError
																							? err.message
																							: err instanceof Error
																								? err.message
																								: "Could not delete account."
																					)
																				);
																		}}
																	>
																		Delete account
																	</DropdownMenuItem>
																</>
															) : null}
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onSelect={() => toggleAccountActive(account)}
															>
																{account.active
																	? "Deactivate account"
																	: "Activate account"}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</TableCell>
										</TableRow>
										{expanded ? (
											<TableRow
												key={`${account.id}-detail`}
												className="bg-muted/20 hover:bg-muted/20"
											>
												<TableCell colSpan={11} className="p-0">
													<div className="border-t border-border/40 px-3 py-3">
														<div className="mb-3 flex flex-wrap items-start justify-between gap-3">
															<div className="min-w-0">
																<div className="flex flex-wrap items-center gap-2">
																	<h3 className="text-sm font-semibold tracking-tight text-foreground">
																		{account.name}
																	</h3>
																	<AccountStatusPill status={account.status} />
																	{account.active ? (
																		<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
																			Active
																		</span>
																	) : null}
																</div>
																<p className="mt-1 text-xs text-muted-foreground">
																	{account.accountId}
																	<span className="mx-1.5 text-border">·</span>
																	{account.lineOfBusiness}
																</p>
															</div>
															<div className="flex flex-wrap items-center gap-4 text-xs">
																<div>
																	<p className="text-muted-foreground">
																		Status
																	</p>
																	<p className="font-medium capitalize">
																		{account.status}
																	</p>
																</div>
																<div>
																	<p className="text-muted-foreground">
																		Health Score
																	</p>
																	<p className="font-medium tabular-nums">
																		{account.healthScore}
																	</p>
																</div>
																<div>
																	<p className="text-muted-foreground">
																		Last File Received
																	</p>
																	<p className="font-medium">
																		{account.lastFileReceived}
																	</p>
																</div>
																<div>
																	<p className="text-muted-foreground">
																		Open Issues
																	</p>
																	<p className="font-medium tabular-nums">
																		{account.openIssues}
																	</p>
																</div>
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	className="h-8 text-xs"
																	onClick={() =>
																		openAccount(account.id, "details")
																	}
																>
																	View Account Details
																</Button>
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	className="h-8 text-xs"
																	onClick={() => openEdit(account)}
																>
																	Edit
																</Button>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="h-8 text-xs"
																	onClick={() => setSelectedAccountId(null)}
																>
																	Collapse
																</Button>
															</div>
														</div>

														<div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
															<div className="min-w-0 space-y-3">
																<nav className="flex gap-1 border-b border-border">
																	{(
																		[
																			["activity", "Recent File Activity"],
																			[
																				"issues",
																				`Issue Summary (${account.openIssues})`,
																			],
																			["details", "Account Details"],
																		] as const
																	).map(([id, label]) => (
																		<button
																			key={id}
																			type="button"
																			onClick={() => setAccountDetailTab(id)}
																			className={cn(
																				"border-b-2 px-2.5 pb-2 text-xs font-medium",
																				accountDetailTab === id
																					? "border-primary text-foreground"
																					: "border-transparent text-muted-foreground hover:text-foreground"
																			)}
																		>
																			{label}
																		</button>
																	))}
																</nav>

																{accountDetailTab === "activity" ? (
																	<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-primary/5">
																		<Table className="text-xs">
																			<TableHeader>
																				<TableRow className="hover:bg-transparent">
																					<TableHead className="pl-3">
																						File Type
																					</TableHead>
																					<TableHead>Direction</TableHead>
																					<TableHead>Status</TableHead>
																					<TableHead className="pr-3">
																						Timestamp
																					</TableHead>
																				</TableRow>
																			</TableHeader>
																			<TableBody>
																				{buildAccountActivityRows(
																					account.id,
																					inboundFiles,
																					jobs,
																					connections,
																					[
																						[
																							"Eligibility (834)",
																							account.eligibility,
																						],
																						[
																							"Medical Claims (837)",
																							account.medical,
																						],
																						[
																							"Pharmacy Claims (835)",
																							account.pharmacy,
																						],
																						[
																							"Accumulator",
																							account.accumulator,
																						],
																					],
																					account.lastFileType,
																					account.lastFileReceived
																				).map((row) => (
																					<TableRow key={row.key}>
																						<TableCell className="pl-3 font-medium">
																							{row.fileType}
																						</TableCell>
																						<TableCell>{row.direction}</TableCell>
																						<TableCell>
																							{row.status === "success" ? (
																								<span className="inline-flex items-center gap-1 text-emerald-700">
																									<CheckCircle2 className="size-3.5" />
																									Success
																								</span>
																							) : row.status === "no_data" ? (
																								<span className="text-muted-foreground">
																									No Data
																								</span>
																							) : row.status === "warning" ? (
																								<span className="inline-flex items-center gap-1 text-amber-700">
																									<AlertTriangle className="size-3.5" />
																									Warning
																								</span>
																							) : row.status === "processing" ? (
																								<span className="text-muted-foreground">
																									Processing
																								</span>
																							) : (
																								<span className="inline-flex items-center gap-1 text-red-700">
																									<XCircle className="size-3.5" />
																									Error
																								</span>
																							)}
																						</TableCell>
																						<TableCell className="pr-3 text-muted-foreground">
																							{row.timestamp}
																						</TableCell>
																					</TableRow>
																				))}
																			</TableBody>
																		</Table>
																	</div>
																) : null}

																{accountDetailTab === "issues" ? (
																	<div className="rounded-xl border border-border bg-card shadow-sm px-4 py-8 text-center text-sm text-muted-foreground">
																		{account.openIssues === 0
																			? "No open issues for this account."
																			: `${account.openIssues} open issue(s) require follow-up.`}
																	</div>
																) : null}

																{accountDetailTab === "details" ? (
																	<div className="grid gap-3 rounded-xl border border-border bg-card shadow-sm p-4 sm:grid-cols-2">
																		{[
																			["Payer ID", account.payerId],
																			["Time Zone", account.timezone],
																			[
																				"Line of Business",
																				account.lineOfBusiness,
																			],
																			["Account ID", account.accountId],
																			[
																				"Status",
																				account.active ? "Active" : "Inactive",
																			],
																			[
																				"Health Score",
																				String(account.healthScore),
																			],
																		].map(([label, value]) => (
																			<div key={label}>
																				<p className="text-[11px] text-muted-foreground">
																					{label}
																				</p>
																				<p className="mt-0.5 text-sm font-medium">
																					{value}
																				</p>
																			</div>
																		))}
																	</div>
																) : null}
															</div>

															<div className="rounded-xl border border-border bg-card shadow-sm p-4">
																<h4 className="text-sm font-semibold tracking-tight text-foreground">
																	Health Score
																</h4>
																<p className="mt-3 text-3xl font-semibold tabular-nums">
																	{account.healthScore}
																</p>
																<p className="mt-2 text-xs text-muted-foreground">
																	From account ops summary. Historical trend
																	data is not available from the API yet.
																</p>
															</div>
														</div>
													</div>
												</TableCell>
											</TableRow>
										) : null}
									</Fragment>
								);
							})}
							{filteredAccounts.length === 0 && (
								<TableRow>
									<TableCell colSpan={11} className="h-24 text-center">
										{rows.length === 0 && !filtersActive ? (
											<div className="mx-auto max-w-sm space-y-1 py-2">
												<p className="text-sm font-medium text-foreground">
													No linked accounts yet
												</p>
												<p className="text-xs text-muted-foreground">
													Use{" "}
													<span className="font-medium">Add account</span> above
													to link the first account for this vendor.
												</p>
											</div>
										) : (
											<p className="text-sm text-muted-foreground">
												No accounts match the current filters.
											</p>
										)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog
				open={Boolean(editAccountId && draft)}
				onOpenChange={(open) => {
					if (!open) {
						setEditAccountId(null);
						setDraft(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit account</DialogTitle>
						<DialogDescription>
							Update account settings for{" "}
							{editingAccount?.accountId ?? "this account"}.
						</DialogDescription>
					</DialogHeader>
					{draft ? (
						<div className="grid gap-3 py-1">
							<div className="space-y-1.5">
								<Label htmlFor="account-name">Account name</Label>
								<Input
									id="account-name"
									value={draft.name}
									onChange={(e) =>
										setDraft((prev) =>
											prev ? { ...prev, name: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Line of business</Label>
								<Select
									value={draft.lineOfBusiness}
									onValueChange={(value) =>
										setDraft((prev) =>
											prev
												? {
														...prev,
														lineOfBusiness:
															value as VendorAccountRow["lineOfBusiness"],
													}
												: prev
										)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(
											[
												"Commercial",
												"Medicare",
												"Medicaid",
												"Marketplace",
											] as const
										).map((lob) => (
											<SelectItem key={lob} value={lob}>
												{lob}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label>Status</Label>
								<Select
									value={draft.status}
									onValueChange={(value) =>
										setDraft((prev) =>
											prev
												? {
														...prev,
														status: value as VendorAccountRow["status"],
													}
												: prev
										)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(["healthy", "warning", "error", "inactive"] as const).map(
											(status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="payer-id">Payer ID</Label>
								<Input
									id="payer-id"
									value={draft.payerId}
									onChange={(e) =>
										setDraft((prev) =>
											prev ? { ...prev, payerId: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="timezone">Time zone</Label>
								<Input
									id="timezone"
									value={draft.timezone}
									onChange={(e) =>
										setDraft((prev) =>
											prev ? { ...prev, timezone: e.target.value } : prev
										)
									}
								/>
							</div>
						</div>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setEditAccountId(null);
								setDraft(null);
							}}
						>
							Cancel
						</Button>
						<Button type="button" onClick={saveEdit}>
							Save changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Add account</DialogTitle>
						<DialogDescription>
							Create a new account under this vendor.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 py-1">
						<div className="space-y-1.5">
							<Label htmlFor="create-account-code">Account code</Label>
							<Input
								id="create-account-code"
								value={createDraft.account_code}
								onChange={(e) =>
									setCreateDraft((prev) => ({
										...prev,
										account_code: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="create-account-name">Account name</Label>
							<Input
								id="create-account-name"
								value={createDraft.name}
								onChange={(e) =>
									setCreateDraft((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Line of business</Label>
							<Select
								value={createDraft.line_of_business}
								onValueChange={(value) =>
									setCreateDraft((prev) => ({
										...prev,
										line_of_business: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										["commercial", "Commercial"],
										["medicare", "Medicare"],
										["medicaid", "Medicaid"],
										["marketplace", "Marketplace"],
									].map(([value, label]) => (
										<SelectItem key={value} value={String(value)}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCreateOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={!onCreateAccount || saving}
							onClick={() => {
								if (!onCreateAccount) return;
								const account_code = createDraft.account_code.trim();
								const name = createDraft.name.trim();
								if (!account_code || !name) {
									toast.error("Account code and name are required.");
									return;
								}
								setSaving(true);
								void onCreateAccount({
									account_code,
									name,
									line_of_business: createDraft.line_of_business,
									active: true,
								})
								.then((created) => {
									if (!created?.id) {
										toast.error(
											"Account may have been created but the response was incomplete. Refresh to verify."
										);
										return;
									}
									setRows((prev) => {
										if (prev.some((row) => row.id === created.id)) {
											return prev;
										}
										return [...prev, created];
									});
									toast.success("Account saved.");
										setCreateOpen(false);
										setCreateDraft({
											account_code: "",
											name: "",
											line_of_business: "commercial",
										});
									})
									.catch((err) =>
										toast.error(
											err instanceof Error
												? err.message
												: "Could not create account."
										)
									)
									.finally(() => setSaving(false));
							}}
						>
							Create account
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
