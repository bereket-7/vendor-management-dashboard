"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Code2,
	Download,
	Filter,
	MoreHorizontal,
	Printer,
	Search,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import { usePagedRows } from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import { EdiViewerDialog } from "@/features/admin/features/claim-encounter/edi";
import { claimLineDtosToClaimLines } from "@/features/admin/features/claim-encounter/live-claims";
import {
	CLAIM_LINES,
	type ClaimLine,
	SHOWCASE_CLAIM_DETAIL,
	formatCount,
	formatCurrency,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { useVendorCoreClaimLines } from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const MEMBER_NAMES = [
	"Jordan Lee",
	"Ava Patel",
	"Marcus Chen",
	"Sofia Ramirez",
	"Noah Brooks",
	"Amara Wells",
	"Liam Ortiz",
	"Harper Diaz",
];

const PAYERS = ["MDH Medicaid", "DHCF QHP", "BHP Commercial", "Gainwell"];
const GROUPS = ["GRP-4401", "GRP-5510", "GRP-6622", "GRP-7733"];
const PLANS = ["MDH Standard", "DHCF Plus", "BHP Select", "Essential Care"];
const CPT_CODES = ["99213", "99214", "80053", "87070", "J3490", "D0120"];
const DIAG_CODES = ["E11.9", "I10", "J06.9", "M54.5", "Z00.00"];

type ClaimWorkbenchRow = ClaimLine & {
	memberName: string;
	providerNpi: string;
	payer: string;
	group: string;
	plan: string;
	authNumber: string;
	rxNumber: string;
	priority: "Normal" | "High" | "Urgent";
	claimStatus: string;
	responseStatus: string;
	receivedAt: string;
	fileName: string;
	displayClaimType: string;
};

type ServiceLine = {
	id: string;
	code: string;
	modifier: string;
	diagnosis: string;
	units: number;
	charge: number;
	allowed: number;
	paid: number;
	status: string;
};

const DETAIL_TABS = [
	"Claim Summary",
	"Member",
	"Services",
	"Providers",
	"Financial",
	"Responses",
	"History",
	"Attachments",
	"Notes",
] as const;

function toClaimType(label: string) {
	if (label.toLowerCase().includes("pharm")) return "Pharmacy";
	if (
		label.toLowerCase().includes("dental") ||
		label.toLowerCase().includes("vision")
	)
		return "Dental";
	if (label.toLowerCase().includes("encounter")) return "Encounter";
	return "Medical";
}

function claimStatusFrom(line: ClaimLine) {
	if (line.gainwellStatus === "paid") return "Paid";
	if (line.gainwellStatus === "denied") return "Denied";
	if (line.gainwellStatus === "rejected") return "Rejected";
	if (line.gainwellStatus === "partial") return "Partial";
	return "Pending";
}

function responseStatusFrom(line: ClaimLine) {
	if (line.mfcReviewStatus === "accepted") return "Accepted";
	if (line.mfcReviewStatus === "rejected") return "Rejected";
	if (line.mfcReviewStatus === "denied") return "Denied";
	return "Pending";
}

function enrichClaim(line: ClaimLine, index: number): ClaimWorkbenchRow {
	const file = getVendorFile(line.fileId);
	const seq = Number(line.claimId.replace(/\D/g, "")) || index;
	return {
		...line,
		memberName: MEMBER_NAMES[seq % MEMBER_NAMES.length]!,
		providerNpi: String(1000000000 + ((seq * 17) % 899999999)),
		payer: PAYERS[seq % PAYERS.length]!,
		group: GROUPS[seq % GROUPS.length]!,
		plan: PLANS[seq % PLANS.length]!,
		authNumber: seq % 3 === 0 ? `AUTH-${600000 + seq}` : "",
		rxNumber:
			toClaimType(line.claimType) === "Pharmacy" ? `RX-${800000 + seq}` : "",
		priority: seq % 11 === 0 ? "Urgent" : seq % 5 === 0 ? "High" : "Normal",
		claimStatus: claimStatusFrom(line),
		responseStatus: responseStatusFrom(line),
		receivedAt: file?.receivedAt ?? `${line.dateOfService} 09:00`,
		fileName: file?.fileName ?? `${line.fileId}.edi`,
		displayClaimType: toClaimType(line.claimType),
	};
}

function serviceLinesFor(claim: ClaimWorkbenchRow): ServiceLine[] {
	const count = 2 + (Number(claim.id.replace(/\D/g, "")) % 3);
	const lines: ServiceLine[] = [];
	for (let i = 0; i < count; i++) {
		const charge = Math.round(claim.amountBilled / count);
		const paid =
			claim.claimStatus === "Paid"
				? charge
				: claim.claimStatus === "Partial"
					? Math.round(charge * 0.6)
					: 0;
		lines.push({
			id: `${claim.id}-svc-${i + 1}`,
			code: CPT_CODES[
				(Number(claim.id.replace(/\D/g, "")) + i) % CPT_CODES.length
			]!,
			modifier: i === 0 ? "25" : "",
			diagnosis:
				DIAG_CODES[
					(Number(claim.id.replace(/\D/g, "")) + i) % DIAG_CODES.length
				]!,
			units: 1 + (i % 2),
			charge,
			allowed: Math.round(charge * 0.85),
			paid,
			status: claim.claimStatus,
		});
	}
	return lines;
}

function Field({
	label,
	children,
	className,
}: {
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label className={cn("flex min-w-0 flex-col gap-1", className)}>
			<span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
				{label}
			</span>
			{children}
		</label>
	);
}

function ClaimStatusBadge({ status }: { status: string }) {
	return <StatusBadge status={status} />;
}

export function ClaimsPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Claims">
				<ClaimsBody useLive />
			</VendorCoreGate>
		);
	}
	return <ClaimsBody useLive={false} />;
}

function ClaimsBody({ useLive }: { useLive: boolean }) {
	const router = useRouter();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const claimLinesQ = useVendorCoreClaimLines(useLive);

	const [filtersOpen, setFiltersOpen] = useState(false);
	const [quickSearch, setQuickSearch] = useState("");

	const [claimId, setClaimId] = useState("");
	const [memberId, setMemberId] = useState("");
	const [memberName, setMemberName] = useState("");
	const [providerNpi, setProviderNpi] = useState("");
	const [vendor, setVendor] = useState("all");
	const [authNumber, setAuthNumber] = useState("");
	const [rxNumber, setRxNumber] = useState("");
	const [dosFrom, setDosFrom] = useState("2026-07-01");
	const [dosTo, setDosTo] = useState("2026-07-28");

	const [claimStatus, setClaimStatus] = useState("all");
	const [claimType, setClaimType] = useState("all");
	const [payer, setPayer] = useState("all");
	const [group, setGroup] = useState("all");
	const [plan, setPlan] = useState("all");
	const [serviceDatePreset, setServiceDatePreset] = useState("90");
	const [responseStatus, setResponseStatus] = useState("all");
	const [priority, setPriority] = useState("all");

	const [applied, setApplied] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detailTab, setDetailTab] =
		useState<(typeof DETAIL_TABS)[number]>("Claim Summary");
	const [ediOpen, setEdiOpen] = useState(false);

	const allRows = useMemo(() => {
		if (useLive) {
			const lines = claimLineDtosToClaimLines(
				claimLinesQ.data ?? [],
				programFilter
			);
			return lines.map((c, i) => enrichClaim(c, i));
		}

		const rows = CLAIM_LINES.filter((c) => c.program === programFilter).map(
			(c, i) => enrichClaim(c, i)
		);

		const showcase: ClaimWorkbenchRow = {
			id: SHOWCASE_CLAIM_DETAIL.id,
			claimId: SHOWCASE_CLAIM_DETAIL.claimId,
			memberId: SHOWCASE_CLAIM_DETAIL.memberId,
			provider: SHOWCASE_CLAIM_DETAIL.provider,
			vendor: SHOWCASE_CLAIM_DETAIL.vendor,
			account: "MED-ACC-1",
			claimType: SHOWCASE_CLAIM_DETAIL.claimType,
			dateOfService: SHOWCASE_CLAIM_DETAIL.dateOfService,
			amountBilled: SHOWCASE_CLAIM_DETAIL.amountBilled,
			amountPaid: SHOWCASE_CLAIM_DETAIL.amountPaid,
			submissionStatus: "accepted",
			gainwellStatus: "paid",
			mfcReviewStatus: "accepted",
			rejectReason: null,
			rejectReasons: [],
			responseFileName: SHOWCASE_CLAIM_DETAIL.edi835FileName,
			traceId: SHOWCASE_CLAIM_DETAIL.traceId,
			batchId: SHOWCASE_CLAIM_DETAIL.batchId,
			fileId: SHOWCASE_CLAIM_DETAIL.fileId,
			responseId: SHOWCASE_CLAIM_DETAIL.responseId,
			program: SHOWCASE_CLAIM_DETAIL.program,
			direction: "inbound",
			memberName: SHOWCASE_CLAIM_DETAIL.memberName,
			providerNpi: SHOWCASE_CLAIM_DETAIL.providerNpi,
			payer: SHOWCASE_CLAIM_DETAIL.payer,
			group: SHOWCASE_CLAIM_DETAIL.group,
			plan: SHOWCASE_CLAIM_DETAIL.plan,
			authNumber: SHOWCASE_CLAIM_DETAIL.authNumber,
			rxNumber: "",
			priority: SHOWCASE_CLAIM_DETAIL.priority,
			claimStatus: SHOWCASE_CLAIM_DETAIL.status,
			responseStatus: "Accepted",
			receivedAt: SHOWCASE_CLAIM_DETAIL.receivedAt,
			fileName: SHOWCASE_CLAIM_DETAIL.fileName,
			displayClaimType: "Medical",
		};

		if (programFilter === SHOWCASE_CLAIM_DETAIL.program) {
			return [showcase, ...rows];
		}
		return rows;
	}, [useLive, claimLinesQ.data, programFilter]);

	function openClaimDetail(row: ClaimWorkbenchRow) {
		router.push(
			`/admin/claim-encounter/claims/${encodeURIComponent(row.claimId)}`
		);
	}
	const vendors = VENDOR_NAMES;

	const activeFilterCount = useMemo(() => {
		let n = 0;
		if (claimId.trim()) n += 1;
		if (memberId.trim()) n += 1;
		if (memberName.trim()) n += 1;
		if (providerNpi.trim()) n += 1;
		if (vendor !== "all") n += 1;
		if (authNumber.trim()) n += 1;
		if (rxNumber.trim()) n += 1;
		if (claimStatus !== "all") n += 1;
		if (claimType !== "all") n += 1;
		if (payer !== "all") n += 1;
		if (group !== "all") n += 1;
		if (plan !== "all") n += 1;
		if (responseStatus !== "all") n += 1;
		if (priority !== "all") n += 1;
		if (dosFrom !== "2026-07-01" || dosTo !== "2026-07-28") n += 1;
		return n;
	}, [
		claimId,
		memberId,
		memberName,
		providerNpi,
		vendor,
		authNumber,
		rxNumber,
		claimStatus,
		claimType,
		payer,
		group,
		plan,
		responseStatus,
		priority,
		dosFrom,
		dosTo,
	]);

	const filtered = useMemo(() => {
		void applied;
		const q = quickSearch.trim().toLowerCase();
		return allRows.filter((row) => {
			if (q) {
				const hay = [
					row.claimId,
					row.memberId,
					row.memberName,
					row.provider,
					row.providerNpi,
					row.vendor,
					row.payer,
				]
					.join(" ")
					.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			if (
				claimId.trim() &&
				!row.claimId.toLowerCase().includes(claimId.trim().toLowerCase())
			)
				return false;
			if (
				memberId.trim() &&
				!row.memberId.toLowerCase().includes(memberId.trim().toLowerCase())
			)
				return false;
			if (
				memberName.trim() &&
				!row.memberName.toLowerCase().includes(memberName.trim().toLowerCase())
			)
				return false;
			if (
				providerNpi.trim() &&
				!(
					row.provider
						.toLowerCase()
						.includes(providerNpi.trim().toLowerCase()) ||
					row.providerNpi.includes(providerNpi.trim())
				)
			)
				return false;
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (
				authNumber.trim() &&
				!row.authNumber.toLowerCase().includes(authNumber.trim().toLowerCase())
			)
				return false;
			if (
				rxNumber.trim() &&
				!row.rxNumber.toLowerCase().includes(rxNumber.trim().toLowerCase())
			)
				return false;
			if (dosFrom && row.dateOfService < dosFrom) return false;
			if (dosTo && row.dateOfService > dosTo) return false;
			if (claimStatus !== "all" && row.claimStatus !== claimStatus)
				return false;
			if (claimType !== "all" && row.displayClaimType !== claimType)
				return false;
			if (payer !== "all" && row.payer !== payer) return false;
			if (group !== "all" && row.group !== group) return false;
			if (plan !== "all" && row.plan !== plan) return false;
			if (responseStatus !== "all" && row.responseStatus !== responseStatus)
				return false;
			if (priority !== "all" && row.priority !== priority) return false;
			return true;
		});
	}, [
		allRows,
		applied,
		quickSearch,
		claimId,
		memberId,
		memberName,
		providerNpi,
		vendor,
		authNumber,
		rxNumber,
		dosFrom,
		dosTo,
		claimStatus,
		claimType,
		payer,
		group,
		plan,
		responseStatus,
		priority,
	]);

	const { pageRows, pageCount, safePage } = usePagedRows(
		filtered,
		pageSize,
		page,
		setPage
	);

	const selected =
		filtered.find((r) => r.id === selectedId) ??
		(selectedId ? allRows.find((r) => r.id === selectedId) : null) ??
		null;

	const services = useMemo(
		() => (selected ? serviceLinesFor(selected) : []),
		[selected]
	);

	function clearFilters() {
		setQuickSearch("");
		setClaimId("");
		setMemberId("");
		setMemberName("");
		setProviderNpi("");
		setVendor("all");
		setAuthNumber("");
		setRxNumber("");
		setDosFrom("2026-07-01");
		setDosTo("2026-07-28");
		setClaimStatus("all");
		setClaimType("all");
		setPayer("all");
		setGroup("all");
		setPlan("all");
		setServiceDatePreset("90");
		setResponseStatus("all");
		setPriority("all");
		setPage(1);
		setApplied((n) => n + 1);
	}

	function runSearch() {
		setPage(1);
		setApplied((n) => n + 1);
		setFiltersOpen(false);
		toast.success("Search applied");
	}

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Claims"
				description="Search, review and manage claims across all vendors and payers."
				actions={
					<div className="flex flex-wrap gap-1.5">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="h-9">
									<Download className="mr-1.5 size-3.5" />
									Export
									<ChevronDown className="ml-1 size-3.5 opacity-60" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => toast.success("CSV export queued")}
								>
									Export CSV
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => toast.success("XLSX export queued")}
								>
									Export Excel
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => toast.message("Print dialog opened")}
						>
							<Printer className="mr-1.5 size-3.5" />
							Print
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="sm" className="h-9">
									Actions
									<ChevronDown className="ml-1 size-3.5 opacity-80" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => toast.message("Bulk accept is mock-only")}
								>
									Bulk accept
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => toast.message("Bulk reject is mock-only")}
								>
									Bulk reject
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => toast.message("Assign reviewer is mock-only")}
								>
									Assign reviewer
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				}
			/>

			{useLive && claimLinesQ.error ? (
				<div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Could not load claims: {claimLinesQ.error.message}
				</div>
			) : null}

			{useLive &&
			!claimLinesQ.isLoading &&
			allRows.length === 0 ? (
				<div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
					No claim lines returned from vendor-core yet. Run{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						pnpm seed:claim-lines
					</code>{" "}
					(after vendor-core claim-line seed is deployed), then refresh.
				</div>
			) : null}

			{/* Quick search + collapsible filters */}
			<Card className="gap-0 bg-card/70 py-0">
				<CardContent className="p-3">
					<div className="flex flex-wrap items-center gap-2">
						<div className="relative min-w-[220px] flex-1">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={quickSearch}
								onChange={(e) => {
									setQuickSearch(e.target.value);
									setPage(1);
								}}
								placeholder="Search claims by Claim ID, Member ID, Provider, NPI…"
								className="h-9 pl-8"
							/>
						</div>
						<Button
							variant="outline"
							size="sm"
							className={cn(
								"h-9",
								filtersOpen && "border-primary/40 bg-primary/5"
							)}
							onClick={() => setFiltersOpen((o) => !o)}
							aria-expanded={filtersOpen}
						>
							<Filter className="mr-1.5 size-3.5" />
							Filters
							{activeFilterCount > 0 ? (
								<span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
									{activeFilterCount}
								</span>
							) : null}
							<ChevronDown
								className={cn(
									"ml-1.5 size-3.5 opacity-60 transition-transform",
									filtersOpen && "rotate-180"
								)}
							/>
						</Button>
						{activeFilterCount > 0 ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-9 text-xs"
								onClick={clearFilters}
							>
								Clear
							</Button>
						) : null}
						<Button size="sm" className="h-9" onClick={runSearch}>
							<Search className="mr-1.5 size-3.5" />
							Search
						</Button>
					</div>

					<Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
						<CollapsibleContent className="mt-3 space-y-3 border-t border-border/50 pt-3">
							<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
								<Field label="Claim ID">
									<Input
										value={claimId}
										onChange={(e) => setClaimId(e.target.value)}
										placeholder="CLM-…"
										className="h-9"
									/>
								</Field>
								<Field label="Member ID">
									<Input
										value={memberId}
										onChange={(e) => setMemberId(e.target.value)}
										placeholder="MBR-…"
										className="h-9"
									/>
								</Field>
								<Field label="Member Name">
									<Input
										value={memberName}
										onChange={(e) => setMemberName(e.target.value)}
										placeholder="Name"
										className="h-9"
									/>
								</Field>
								<Field label="Provider / NPI">
									<Input
										value={providerNpi}
										onChange={(e) => setProviderNpi(e.target.value)}
										placeholder="Name or NPI"
										className="h-9"
									/>
								</Field>
								<Field label="Vendor">
									<Select value={vendor} onValueChange={setVendor}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Vendors</SelectItem>
											{vendors.map((v) => (
												<SelectItem key={v} value={v}>
													{v}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
								<Field label="Authorization #">
									<Input
										value={authNumber}
										onChange={(e) => setAuthNumber(e.target.value)}
										placeholder="AUTH-…"
										className="h-9"
									/>
								</Field>
								<Field label="Rx Number">
									<Input
										value={rxNumber}
										onChange={(e) => setRxNumber(e.target.value)}
										placeholder="RX-…"
										className="h-9"
									/>
								</Field>
								<Field label="Date of Service">
									<div className="flex items-center gap-1">
										<Input
											type="date"
											value={dosFrom}
											onChange={(e) => setDosFrom(e.target.value)}
											className="h-9 px-2"
										/>
										<span className="text-[10px] text-muted-foreground">–</span>
										<Input
											type="date"
											value={dosTo}
											onChange={(e) => setDosTo(e.target.value)}
											className="h-9 px-2"
										/>
									</div>
								</Field>
							</div>

							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
								<Field label="Claim Status">
									<Select value={claimStatus} onValueChange={setClaimStatus}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="Paid">Paid</SelectItem>
											<SelectItem value="Denied">Denied</SelectItem>
											<SelectItem value="Pending">Pending</SelectItem>
											<SelectItem value="Partial">Partial</SelectItem>
											<SelectItem value="Rejected">Rejected</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field label="Claim Type">
									<Select value={claimType} onValueChange={setClaimType}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="Medical">Medical</SelectItem>
											<SelectItem value="Pharmacy">Pharmacy</SelectItem>
											<SelectItem value="Dental">Dental</SelectItem>
											<SelectItem value="Encounter">Encounter</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field label="Payer">
									<Select value={payer} onValueChange={setPayer}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											{PAYERS.map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
								<Field label="Group">
									<Select value={group} onValueChange={setGroup}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											{GROUPS.map((g) => (
												<SelectItem key={g} value={g}>
													{g}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
								<Field label="Plan">
									<Select value={plan} onValueChange={setPlan}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											{PLANS.map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
								<Field label="Service Date">
									<Select
										value={serviceDatePreset}
										onValueChange={(v) => {
											setServiceDatePreset(v);
											if (v === "90") {
												setDosFrom("2026-05-01");
												setDosTo("2026-07-28");
											} else if (v === "30") {
												setDosFrom("2026-06-28");
												setDosTo("2026-07-28");
											} else if (v === "7") {
												setDosFrom("2026-07-21");
												setDosTo("2026-07-28");
											}
										}}
									>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="7">Last 7 Days</SelectItem>
											<SelectItem value="30">Last 30 Days</SelectItem>
											<SelectItem value="90">Last 90 Days</SelectItem>
											<SelectItem value="custom">Custom range</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field label="Response Status">
									<Select
										value={responseStatus}
										onValueChange={setResponseStatus}
									>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="Accepted">Accepted</SelectItem>
											<SelectItem value="Rejected">Rejected</SelectItem>
											<SelectItem value="Denied">Denied</SelectItem>
											<SelectItem value="Pending">Pending</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field label="Priority">
									<Select value={priority} onValueChange={setPriority}>
										<SelectTrigger className="h-9 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="Normal">Normal</SelectItem>
											<SelectItem value="High">High</SelectItem>
											<SelectItem value="Urgent">Urgent</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<div className="flex items-end gap-1.5 sm:col-span-2">
									<Button
										variant="outline"
										size="sm"
										className="h-9"
										onClick={clearFilters}
									>
										Clear Filters
									</Button>
									<Button size="sm" className="h-9" onClick={runSearch}>
										Apply Filters
									</Button>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</CardContent>
			</Card>

			{/* Results */}
			<Card className="gap-1 bg-card/70 py-2">
				<CardHeader className="px-3 pb-1 pt-0">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-sm font-medium">
							{formatCount(filtered.length)} Claims found
						</p>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>Rows per page</span>
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
									{[10, 25, 50, 100].map((n) => (
										<SelectItem key={n} value={String(n)}>
											{n}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<span className="tabular-nums">
								{filtered.length === 0
									? "0–0"
									: `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`}{" "}
								of {formatCount(filtered.length)}
							</span>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={safePage <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								<ChevronLeft className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={safePage >= pageCount}
								onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
							>
								<ChevronRight className="size-3.5" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-3">Claim ID</TableHead>
									<TableHead>Member ID</TableHead>
									<TableHead>Member Name</TableHead>
									<TableHead>Provider</TableHead>
									<TableHead>DOS</TableHead>
									<TableHead>Claim Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Charge</TableHead>
									<TableHead className="text-right">Paid</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Payer</TableHead>
									<TableHead>Response Status</TableHead>
									<TableHead>Received Date</TableHead>
									<TableHead className="pr-3">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => (
									<TableRow
										key={row.id}
										className={cn(
											"cursor-pointer hover:bg-muted/30",
											selectedId === row.id && "bg-primary/5"
										)}
										onClick={() => openClaimDetail(row)}
									>
										<TableCell className="pl-3">
											<Link
												href={`/admin/claim-encounter/claims/${encodeURIComponent(row.claimId)}`}
												className="font-mono text-xs font-medium text-primary hover:underline"
												onClick={(e) => e.stopPropagation()}
											>
												{row.claimId}
											</Link>
										</TableCell>
										<TableCell className="font-mono text-xs">
											{row.memberId}
										</TableCell>
										<TableCell className="text-sm">{row.memberName}</TableCell>
										<TableCell className="max-w-[140px] truncate text-sm">
											{row.provider}
										</TableCell>
										<TableCell className="text-xs tabular-nums">
											{row.dateOfService}
										</TableCell>
										<TableCell className="text-xs">
											{row.displayClaimType}
										</TableCell>
										<TableCell>
											<ClaimStatusBadge status={row.claimStatus} />
										</TableCell>
										<TableCell className="text-right text-xs tabular-nums">
											{formatCurrency(row.amountBilled)}
										</TableCell>
										<TableCell className="text-right text-xs tabular-nums">
											{formatCurrency(row.amountPaid)}
										</TableCell>
										<TableCell className="text-sm">{row.vendor}</TableCell>
										<TableCell className="max-w-[120px] truncate text-xs">
											{row.payer}
										</TableCell>
										<TableCell>
											<ClaimStatusBadge status={row.responseStatus} />
										</TableCell>
										<TableCell className="text-xs tabular-nums text-muted-foreground">
											{row.receivedAt.slice(0, 10)}
										</TableCell>
										<TableCell
											className="pr-3"
											onClick={(e) => e.stopPropagation()}
										>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
													>
														<MoreHorizontal className="size-3.5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => openClaimDetail(row)}
													>
														View details
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															setSelectedId(row.id);
															setEdiOpen(true);
														}}
													>
														View EDI
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															toast.message("Copy claim ID", {
																description: row.claimId,
															})
														}
													>
														Copy claim ID
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={14}
											className="h-24 text-center text-muted-foreground"
										>
											{useLive && claimLinesQ.isLoading
												? "Loading claims from vendor-core…"
												: "No claims match the current filters."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{selected ? (
				<Card className="gap-0 overflow-hidden bg-card/70 py-0">
					<div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/50 px-3 py-2.5">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="font-mono text-sm font-semibold">
									{selected.claimId}
								</h2>
								<ClaimStatusBadge status={selected.claimStatus} />
							</div>
							<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
								{selected.memberName} · {selected.memberId} · {selected.vendor}{" "}
								· {selected.payer} · Received {selected.receivedAt.slice(0, 10)}
							</p>
						</div>
						<div className="flex items-center gap-1.5">
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								onClick={() => setEdiOpen(true)}
							>
								<Code2 className="mr-1.5 size-3.5" />
								View EDI
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={() => setSelectedId(null)}
							>
								<X className="size-3.5" />
							</Button>
						</div>
					</div>

					<Tabs
						value={detailTab}
						onValueChange={(v) =>
							setDetailTab(v as (typeof DETAIL_TABS)[number])
						}
						className="gap-0"
					>
						<div className="overflow-x-auto border-b border-border/50 px-2">
							<TabsList className="h-auto w-max justify-start gap-0 rounded-none bg-transparent p-0">
								{DETAIL_TABS.map((tab) => (
									<TabsTrigger
										key={tab}
										value={tab}
										className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
									>
										{tab}
									</TabsTrigger>
								))}
							</TabsList>
						</div>

						<TabsContent value="Claim Summary" className="mt-0 space-y-3 p-3">
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
								<SummaryBlock
									items={[
										["Claim ID", selected.claimId],
										["Internal Claim #", selected.id.toUpperCase()],
										["External Claim #", selected.traceId],
										["Claim Type", selected.displayClaimType],
										["Priority", selected.priority],
									]}
								/>
								<SummaryBlock
									items={[
										["Batch / File", selected.batchId],
										["Vendor", selected.vendor],
										["File Name", selected.fileName],
										["Received", selected.receivedAt],
										["Processed", selected.receivedAt],
									]}
								/>
								<SummaryBlock
									items={[
										["Payer", selected.payer],
										["Group / Plan", `${selected.group} / ${selected.plan}`],
										["Plan Name", selected.plan],
										["LOB", selected.program],
										["Status", selected.claimStatus],
									]}
								/>
								<SummaryBlock
									items={[
										["Response Status", selected.responseStatus],
										[
											"Paid Date",
											selected.amountPaid > 0
												? selected.receivedAt.slice(0, 10)
												: "—",
										],
										[
											"Check / EFT #",
											selected.amountPaid > 0
												? `EFT-${selected.claimId.replace(/\D/g, "").slice(-8)}`
												: "—",
										],
										["Payment Method", selected.amountPaid > 0 ? "EFT" : "—"],
										["Repriced / Adjusted", "No"],
									]}
								/>
							</div>

							<div className="grid gap-3 lg:grid-cols-3">
								<Card className="gap-2 py-3">
									<CardHeader className="flex-row items-center justify-between px-3 py-0">
										<CardTitle className="text-sm">
											Services ({services.length})
										</CardTitle>
										<button
											type="button"
											className="text-[11px] text-primary hover:underline"
											onClick={() => setDetailTab("Services")}
										>
											View all services
										</button>
									</CardHeader>
									<CardContent className="px-3 pb-0">
										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow className="hover:bg-transparent">
														<TableHead>CPT/HCPCS</TableHead>
														<TableHead>Mod</TableHead>
														<TableHead>Dx</TableHead>
														<TableHead className="text-right">Units</TableHead>
														<TableHead className="text-right">Charge</TableHead>
														<TableHead>Status</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{services.slice(0, 3).map((s) => (
														<TableRow key={s.id}>
															<TableCell className="font-mono text-xs">
																{s.code}
															</TableCell>
															<TableCell className="text-xs">
																{s.modifier || "—"}
															</TableCell>
															<TableCell className="font-mono text-xs">
																{s.diagnosis}
															</TableCell>
															<TableCell className="text-right text-xs tabular-nums">
																{s.units}
															</TableCell>
															<TableCell className="text-right text-xs tabular-nums">
																{formatCurrency(s.charge)}
															</TableCell>
															<TableCell>
																<ClaimStatusBadge status={s.status} />
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>

								<Card className="gap-2 py-3">
									<CardHeader className="flex-row items-center justify-between px-3 py-0">
										<CardTitle className="text-sm">Providers</CardTitle>
										<button
											type="button"
											className="text-[11px] text-primary hover:underline"
											onClick={() => setDetailTab("Providers")}
										>
											View all providers
										</button>
									</CardHeader>
									<CardContent className="space-y-2 px-3 pb-0 text-xs">
										<ProviderRow
											role="Billing"
											name={selected.provider}
											npi={selected.providerNpi}
										/>
										<ProviderRow
											role="Rendering"
											name={selected.provider}
											npi={selected.providerNpi}
										/>
										<ProviderRow
											role="Referring"
											name="Metro Referral Network"
											npi={String(Number(selected.providerNpi) + 17)}
										/>
										<div className="border-t border-border/40 pt-2 text-muted-foreground">
											<p>Facility · {selected.provider} ASC</p>
											<p>Place of Service · 11 (Office)</p>
										</div>
									</CardContent>
								</Card>

								<Card className="gap-2 py-3">
									<CardHeader className="flex-row items-center justify-between px-3 py-0">
										<CardTitle className="text-sm">Financial Summary</CardTitle>
										<button
											type="button"
											className="text-[11px] text-primary hover:underline"
											onClick={() => setDetailTab("Financial")}
										>
											View financial details
										</button>
									</CardHeader>
									<CardContent className="px-3 pb-0">
										<dl className="space-y-1.5 text-xs">
											{[
												["Total Charge", formatCurrency(selected.amountBilled)],
												[
													"Allowed Amount",
													formatCurrency(
														Math.round(selected.amountBilled * 0.85)
													),
												],
												["Paid Amount", formatCurrency(selected.amountPaid)],
												[
													"Member Responsibility",
													formatCurrency(
														Math.max(
															0,
															Math.round(selected.amountBilled * 0.85) -
																selected.amountPaid
														)
													),
												],
												["Deductible", formatCurrency(25)],
												["Copay", formatCurrency(15)],
												["Coinsurance", formatCurrency(0)],
											].map(([label, value]) => (
												<div
													key={label}
													className="flex items-center justify-between gap-2"
												>
													<dt className="text-muted-foreground">{label}</dt>
													<dd className="font-medium tabular-nums">{value}</dd>
												</div>
											))}
										</dl>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="Member" className="mt-0 p-3">
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								<SummaryBlock
									items={[
										["Member ID", selected.memberId],
										["Name", selected.memberName],
										["Program", selected.program],
										["Group", selected.group],
										["Plan", selected.plan],
									]}
								/>
								<SummaryBlock
									items={[
										["Payer", selected.payer],
										["Vendor source", selected.vendor],
										["Account", selected.account],
										["Auth #", selected.authNumber || "—"],
										["Rx #", selected.rxNumber || "—"],
									]}
								/>
							</div>
						</TabsContent>

						<TabsContent value="Services" className="mt-0 p-3">
							<div className="overflow-x-auto rounded-lg border border-border/50">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="pl-3">CPT/HCPCS</TableHead>
											<TableHead>Modifier</TableHead>
											<TableHead>Diagnosis</TableHead>
											<TableHead className="text-right">Units</TableHead>
											<TableHead className="text-right">Charge</TableHead>
											<TableHead className="text-right">Allowed</TableHead>
											<TableHead className="text-right">Paid</TableHead>
											<TableHead className="pr-3">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{services.map((s) => (
											<TableRow key={s.id}>
												<TableCell className="pl-3 font-mono text-xs">
													{s.code}
												</TableCell>
												<TableCell className="text-xs">
													{s.modifier || "—"}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{s.diagnosis}
												</TableCell>
												<TableCell className="text-right text-xs tabular-nums">
													{s.units}
												</TableCell>
												<TableCell className="text-right text-xs tabular-nums">
													{formatCurrency(s.charge)}
												</TableCell>
												<TableCell className="text-right text-xs tabular-nums">
													{formatCurrency(s.allowed)}
												</TableCell>
												<TableCell className="text-right text-xs tabular-nums">
													{formatCurrency(s.paid)}
												</TableCell>
												<TableCell className="pr-3">
													<ClaimStatusBadge status={s.status} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</TabsContent>

						<TabsContent value="Providers" className="mt-0 p-3">
							<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								<ProviderRow
									role="Billing"
									name={selected.provider}
									npi={selected.providerNpi}
								/>
								<ProviderRow
									role="Rendering"
									name={selected.provider}
									npi={selected.providerNpi}
								/>
								<ProviderRow
									role="Referring"
									name="Metro Referral Network"
									npi={String(Number(selected.providerNpi) + 17)}
								/>
							</div>
						</TabsContent>

						<TabsContent value="Financial" className="mt-0 p-3">
							<div className="max-w-md rounded-lg border border-border/50 p-3">
								<dl className="space-y-2 text-sm">
									{[
										["Total Charge", formatCurrency(selected.amountBilled)],
										[
											"Allowed Amount",
											formatCurrency(Math.round(selected.amountBilled * 0.85)),
										],
										["Paid Amount", formatCurrency(selected.amountPaid)],
										[
											"Member Responsibility",
											formatCurrency(
												Math.max(
													0,
													Math.round(selected.amountBilled * 0.85) -
														selected.amountPaid
												)
											),
										],
										["Deductible", formatCurrency(25)],
										["Copay", formatCurrency(15)],
										["Coinsurance", formatCurrency(0)],
										["Interest", formatCurrency(0)],
										["Withhold", formatCurrency(0)],
									].map(([label, value]) => (
										<div
											key={label}
											className="flex items-center justify-between gap-3"
										>
											<dt className="text-muted-foreground">{label}</dt>
											<dd className="font-medium tabular-nums">{value}</dd>
										</div>
									))}
								</dl>
							</div>
						</TabsContent>

						<TabsContent value="Responses" className="mt-0 p-3">
							<div className="space-y-2 text-sm">
								<p>
									<span className="text-muted-foreground">
										Response status:{" "}
									</span>
									<ClaimStatusBadge status={selected.responseStatus} />
								</p>
								<p className="text-muted-foreground">
									Response file:{" "}
									<span className="font-mono text-foreground">
										{selected.responseFileName || "—"}
									</span>
								</p>
								{selected.rejectReasons.length > 0 ? (
									<ul className="space-y-1">
										{selected.rejectReasons.map((r) => (
											<li
												key={r.code}
												className="rounded border border-red-200/60 bg-red-50/80 px-2 py-1.5 text-xs dark:border-red-900/40 dark:bg-red-950/30"
											>
												<span className="font-mono font-semibold">
													{r.code}
												</span>{" "}
												— {r.description}
											</li>
										))}
									</ul>
								) : (
									<p className="text-xs text-muted-foreground">
										No reject / denial codes on this claim.
									</p>
								)}
							</div>
						</TabsContent>

						{(["History", "Attachments", "Notes"] as const).map((tab) => (
							<TabsContent key={tab} value={tab} className="mt-0 p-3">
								<p className="text-sm text-muted-foreground">
									{tab} for{" "}
									<span className="font-mono text-foreground">
										{selected.claimId}
									</span>{" "}
									will connect when the claims API is available.
								</p>
							</TabsContent>
						))}
					</Tabs>
				</Card>
			) : null}

			<EdiViewerDialog
				open={ediOpen}
				onOpenChange={setEdiOpen}
				fixture="837I"
				fileName={selected?.fileName}
				title={selected ? `EDI · ${selected.claimId}` : "EDI Viewer"}
			/>
		</div>
	);
}

function SummaryBlock({ items }: { items: Array<[string, ReactNode]> }) {
	return (
		<div className="rounded-lg border border-border/50 bg-background/40 p-3">
			<dl className="space-y-2">
				{items.map(([label, value]) => (
					<div key={label}>
						<dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							{label}
						</dt>
						<dd className="mt-0.5 text-xs font-medium break-all">
							{typeof value === "string" &&
							(value === "Paid" ||
								value === "Denied" ||
								value === "Pending" ||
								value === "Accepted" ||
								value === "Rejected" ||
								value === "Partial") ? (
								<ClaimStatusBadge status={value} />
							) : (
								value
							)}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

function ProviderRow({
	role,
	name,
	npi,
}: {
	role: string;
	name: string;
	npi: string;
}) {
	return (
		<div className="rounded-md border border-border/40 px-2.5 py-2">
			<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
				{role}
			</p>
			<p className="mt-0.5 text-xs font-medium">{name}</p>
			<p className="font-mono text-[10px] text-muted-foreground">NPI {npi}</p>
		</div>
	);
}
