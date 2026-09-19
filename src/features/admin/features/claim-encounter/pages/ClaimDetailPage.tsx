"use client";

import { useParams } from "next/navigation";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	AlertTriangle,
	ArrowLeft,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	ExternalLink,
	FileDown,
	FileSpreadsheet,
	FileText,
	List,
	Printer,
	RefreshCw,
	StickyNote,
	WalletCards,
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
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimDetail,
	type ClaimDetailNote,
	addClaimLineOperationalNote,
	buildClaimDetailFromLine,
	downloadClaimVendorFile,
	exportRowsAsCsv,
	formatCurrency,
	getClaimDetail,
	getClaimHeaderLive,
	parseClaimOperationalNotes,
	reprocessInboundFile,
	resolveClaimVendorFile,
	saveVendorCoreBlob,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import {
	useClaimHeadersLiveQuery,
	useRevalidateClaimHeadersMutation,
	useVendorCoreClaimLines,
} from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { claimHeaderDtosToClaimLines } from "@/features/admin/features/claim-encounter/live-claim-headers";
import { findClaimLineByClaimId } from "@/features/admin/features/claim-encounter/live-claims";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { Link } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import type { ClaimHeaderValidateResultDto } from "@/lib/vendor-core/types";

const PANEL = CMS_EDGE_PANEL_CLASS;

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const actionItemClass =
	"cursor-pointer gap-2 rounded-sm px-2.5 py-2 text-xs font-medium";

const MAIN_TABS = [
	"Claim Summary",
	"Service Lines",
	"Financials",
	"Contract & Financials",
	"History",
	"Documents (2)",
	"Notes",
] as const;
type MainTab = (typeof MAIN_TABS)[number];

const RELATED_FILTERS = ["All", "Adjustments", "Voids", "Reversals"] as const;

function ClaimTabsNav({
	tab,
	onTabChange,
}: {
	tab: MainTab;
	onTabChange: (next: MainTab) => void;
}) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	const updateOverflow = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		setCanLeft(el.scrollLeft > 2);
		setCanRight(max - el.scrollLeft > 2);
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		updateOverflow();
		el.addEventListener("scroll", updateOverflow, { passive: true });
		const ro = new ResizeObserver(updateOverflow);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", updateOverflow);
			ro.disconnect();
		};
	}, [updateOverflow]);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const active = el.querySelector<HTMLElement>('[data-active-tab="true"]');
		if (!active) return;
		const parentRect = el.getBoundingClientRect();
		const tabRect = active.getBoundingClientRect();
		const outLeft = tabRect.left < parentRect.left + 4;
		const outRight = tabRect.right > parentRect.right - 4;
		if (outLeft || outRight) {
			active.scrollIntoView({
				behavior: "smooth",
				inline: "nearest",
				block: "nearest",
			});
		}
		requestAnimationFrame(updateOverflow);
	}, [tab, updateOverflow]);

	function scrollByDir(dir: -1 | 1) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({
			left: dir * Math.max(160, el.clientWidth * 0.55),
			behavior: "smooth",
		});
	}

	return (
		<nav className="relative flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1.5 shadow-sm">
			<button
				type="button"
				aria-label="Scroll tabs left"
				disabled={!canLeft}
				onClick={() => scrollByDir(-1)}
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-lg transition-opacity",
					canLeft
						? "text-muted-foreground hover:bg-muted hover:text-foreground"
						: "pointer-events-none opacity-0"
				)}
			>
				<ChevronLeft className="size-3.5" />
			</button>
			<div
				ref={scrollerRef}
				className={cn(
					"flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden",
					"[scrollbar-width:thin] [scrollbar-color:oklch(0.55_0_0_/_0.35)_transparent]",
					"[&::-webkit-scrollbar]:h-1.5",
					"[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40",
					"[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/25",
					"hover:[&::-webkit-scrollbar-thumb]:bg-foreground/40",
					"[&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent",
					"[&::-webkit-scrollbar-thumb]:bg-clip-padding"
				)}
			>
				{MAIN_TABS.map((item) => {
					const active = tab === item;
					return (
						<button
							key={item}
							type="button"
							data-active-tab={active ? "true" : undefined}
							onClick={() => onTabChange(item)}
							className={cn(
								"shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors",
								active
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
							)}
						>
							{item}
						</button>
					);
				})}
			</div>
			<button
				type="button"
				aria-label="Scroll tabs right"
				disabled={!canRight}
				onClick={() => scrollByDir(1)}
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-lg transition-opacity",
					canRight
						? "text-muted-foreground hover:bg-muted hover:text-foreground"
						: "pointer-events-none opacity-0"
				)}
			>
				<ChevronRight className="size-3.5" />
			</button>
		</nav>
	);
}

function formatDos(iso: string) {
	const [y, m, d] = iso.split("-");
	if (!y || !m || !d) return iso;
	return `${m}/${d}/${y}`;
}

function Panel({
	title,
	children,
	footer,
	className,
	bodyClassName,
}: {
	title: string;
	children: ReactNode;
	footer?: { label: string; href?: string; onClick?: () => void };
	className?: string;
	bodyClassName?: string;
}) {
	return (
		<section className={cn("flex flex-col overflow-hidden", PANEL, className)}>
			<div className="shrink-0 border-b border-border/50 px-4 py-2.5">
				<h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					{title}
				</h2>
			</div>
			<div className={cn("min-h-0 flex-1 p-3", bodyClassName)}>{children}</div>
			{footer ? (
				<div className="shrink-0 border-t border-border/50 px-4 py-2.5">
					{footer.href ? (
						<Link
							href={footer.href}
							className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
						>
							{footer.label}
							<ChevronRight className="size-3.5" />
						</Link>
					) : (
						<button
							type="button"
							onClick={footer.onClick}
							className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
						>
							{footer.label}
							<ChevronRight className="size-3.5" />
						</button>
					)}
				</div>
			) : null}
		</section>
	);
}

function MoneyTile({
	label,
	value,
	tone = "default",
}: {
	label: string;
	value: string;
	tone?: "default" | "primary" | "success" | "warning";
}) {
	const accent = {
		default: "border-l-border",
		primary: "border-l-primary",
		success: "border-l-emerald-600",
		warning: "border-l-amber-500",
	}[tone];
	const valueClass = {
		default: "text-foreground",
		primary: "text-primary",
		success: "text-emerald-700 dark:text-emerald-300",
		warning: "text-amber-700 dark:text-amber-300",
	}[tone];

	return (
		<div className={cn(PANEL, "border-l-2 px-4 py-3.5", accent)}>
			<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
				{label}
			</p>
			<p
				className={cn("mt-1.5 text-xl font-semibold tabular-nums", valueClass)}
			>
				{value}
			</p>
		</div>
	);
}

function FileTable({ rows }: { rows: ClaimDetail["responseFiles"] }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="h-9 pl-0 text-[11px]">File Type</TableHead>
						<TableHead className="h-9 text-[11px]">File Name</TableHead>
						<TableHead className="h-9 text-[11px]">Received Date</TableHead>
						<TableHead className="h-9 pr-0 text-[11px]">Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.fileName} className="hover:bg-muted/20">
							<TableCell className="py-2.5 pl-0 text-xs">
								{row.fileType}
							</TableCell>
							<TableCell className="max-w-[180px] truncate py-2.5 font-mono text-[11px] text-primary">
								{row.fileName}
							</TableCell>
							<TableCell className="py-2.5 text-xs tabular-nums text-muted-foreground">
								{row.receivedDate}
							</TableCell>
							<TableCell className="py-2.5 pr-0">
								<StatusBadge status={row.status} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function OverviewTab({ claim }: { claim: ClaimDetail }) {
	return (
		<div className="space-y-3">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MoneyTile
					label="Amount Billed"
					value={formatCurrency(claim.amountBilled)}
					tone="primary"
				/>
				<MoneyTile
					label="Amount Allowed"
					value={formatCurrency(claim.amountAllowed)}
				/>
				<MoneyTile
					label="Amount Paid"
					value={formatCurrency(claim.amountPaid)}
					tone="success"
				/>
				<MoneyTile
					label="Patient Responsibility"
					value={formatCurrency(claim.patientResponsibility)}
					tone="warning"
				/>
			</div>

			<div className="grid gap-3 lg:grid-cols-3">
				<Panel title="Claim Summary">
					<dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-xs">
						{[
							["Claim ID", claim.claimId],
							["Claim Type", claim.claimType],
							["Priority", claim.priority],
							["Status", claim.status],
							["Trace ID", claim.traceId],
							["Auth #", claim.authNumber || "—"],
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt className="text-muted-foreground">{k}</dt>
								<dd className="font-medium break-all">{v}</dd>
							</div>
						))}
					</dl>
				</Panel>

				<Panel title="Member">
					<dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-xs">
						{[
							["Member ID", claim.memberId],
							["Name", claim.memberName],
							["Group", claim.group],
							["Plan", claim.plan],
							["Payer", claim.payer],
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt className="text-muted-foreground">{k}</dt>
								<dd className="font-medium break-all">{v}</dd>
							</div>
						))}
					</dl>
				</Panel>

				<Panel title="Provider & Vendor">
					<dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-xs">
						{[
							["Provider", claim.provider],
							["NPI", claim.providerNpi],
							["Vendor", claim.vendor],
							["Program", claim.program],
							["DOS", formatDos(claim.dateOfService)],
							["Paid Date", claim.paidDate ?? "—"],
							["Check / EFT", claim.checkEft ?? "—"],
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt className="text-muted-foreground">{k}</dt>
								<dd className="font-medium break-all">{v}</dd>
							</div>
						))}
					</dl>
				</Panel>
			</div>

			<Panel title="Service Lines">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-9 pl-0 text-[11px] font-bold uppercase tracking-wide">
									Code
								</TableHead>
								<TableHead className="h-9 text-[11px] font-bold uppercase tracking-wide">
									Mod
								</TableHead>
								<TableHead className="h-9 text-[11px] font-bold uppercase tracking-wide">
									Diagnosis
								</TableHead>
								<TableHead className="h-9 text-right text-[11px] font-bold uppercase tracking-wide">
									Units
								</TableHead>
								<TableHead className="h-9 text-right text-[11px] font-bold uppercase tracking-wide">
									Charge
								</TableHead>
								<TableHead className="h-9 text-right text-[11px] font-bold uppercase tracking-wide">
									Allowed
								</TableHead>
								<TableHead className="h-9 text-right text-[11px] font-bold uppercase tracking-wide">
									Paid
								</TableHead>
								<TableHead className="h-9 pr-0 text-[11px] font-bold uppercase tracking-wide">
									Status
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{claim.serviceLines.map((line) => (
								<TableRow key={line.id} className="hover:bg-muted/30">
									<TableCell className="py-2.5 pl-0 font-mono text-xs">
										{line.code}
									</TableCell>
									<TableCell className="py-2.5 text-xs">
										{line.modifier || "—"}
									</TableCell>
									<TableCell className="py-2.5 font-mono text-xs">
										{line.diagnosis}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums">
										{line.units}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums">
										{formatCurrency(line.charge)}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums">
										{formatCurrency(line.allowed)}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums text-emerald-700">
										{formatCurrency(line.paid)}
									</TableCell>
									<TableCell className="py-2.5 pr-0">
										<StatusBadge status={line.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>
		</div>
	);
}

function ServiceLinesTab({ claim }: { claim: ClaimDetail }) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-base font-semibold">
					Service Lines ({claim.serviceLines.length})
				</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					Line-level charges, adjudication and payment status.
				</p>
			</div>
			<Panel title="Claim Service Lines">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="pl-0">Line</TableHead>
							<TableHead>Procedure Code</TableHead>
							<TableHead>Modifiers</TableHead>
							<TableHead>Diagnosis Code</TableHead>
							<TableHead className="text-right">Units</TableHead>
							<TableHead className="text-right">Charge</TableHead>
							<TableHead className="text-right">Allowed</TableHead>
							<TableHead className="text-right">Paid</TableHead>
							<TableHead className="pr-0">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{claim.serviceLines.map((line, index) => (
							<TableRow key={line.id}>
								<TableCell className="py-3 pl-0">{index + 1}</TableCell>
								<TableCell className="py-3 font-mono text-xs">
									{line.code}
								</TableCell>
								<TableCell className="py-3">{line.modifier || "—"}</TableCell>
								<TableCell className="py-3 font-mono text-xs">
									{line.diagnosis}
								</TableCell>
								<TableCell className="py-3 text-right">{line.units}</TableCell>
								<TableCell className="py-3 text-right tabular-nums">
									{formatCurrency(line.charge)}
								</TableCell>
								<TableCell className="py-3 text-right tabular-nums">
									{formatCurrency(line.allowed)}
								</TableCell>
								<TableCell className="py-3 text-right tabular-nums text-emerald-700">
									{formatCurrency(line.paid)}
								</TableCell>
								<TableCell className="py-3 pr-0">
									<StatusBadge status={line.status} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Panel>
		</div>
	);
}

function FinancialsTab({ claim }: { claim: ClaimDetail }) {
	const adjustments = claim.amountAllowed - claim.amountPaid;
	return (
		<div className="space-y-3">
			<div>
				<h2 className="text-sm font-semibold text-foreground">Financials</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					Claim payment, member responsibility and remittance summary.
				</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MoneyTile
					label="Billed Amount"
					value={formatCurrency(claim.amountBilled)}
					tone="primary"
				/>
				<MoneyTile
					label="Allowed Amount"
					value={formatCurrency(claim.amountAllowed)}
				/>
				<MoneyTile
					label="Paid Amount"
					value={formatCurrency(claim.amountPaid)}
					tone="success"
				/>
				<MoneyTile
					label="Member Responsibility"
					value={formatCurrency(claim.patientResponsibility)}
					tone="warning"
				/>
			</div>
			<div className="grid gap-3 xl:grid-cols-2">
				<Panel title="Payment Summary">
					<dl className="space-y-3 text-xs">
						{[
							["Payer", claim.payer],
							["Plan", claim.payerPlan],
							["Payment Date", claim.paidDate ?? "Pending"],
							["Check / EFT", claim.checkEft ?? "—"],
							["Total Adjustment", formatCurrency(adjustments)],
							[
								"Patient Responsibility",
								formatCurrency(claim.patientResponsibility),
							],
						].map(([label, value]) => (
							<div
								key={label as string}
								className="flex justify-between gap-3 border-b border-border/40 pb-2 last:border-0"
							>
								<dt className="text-muted-foreground">{label}</dt>
								<dd className="font-medium">{value}</dd>
							</div>
						))}
					</dl>
				</Panel>
				<Panel title="Remittance & Reconciliation">
					<div className="space-y-3 text-xs">
						<p className="rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
							Payment reconciliation is complete. The remittance amount is
							aligned to the adjudicated claim total.
						</p>
						<dl className="space-y-2">
							{[
								["Expected payment", formatCurrency(claim.amountPaid)],
								["Remitted payment", formatCurrency(claim.amountPaid)],
								["Variance", "$0.00"],
							].map(([label, value]) => (
								<div key={label} className="flex justify-between">
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="font-medium">{value}</dd>
								</div>
							))}
						</dl>
					</div>
				</Panel>
			</div>
		</div>
	);
}

function DocumentsTab({ claim }: { claim: ClaimDetail }) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-base font-semibold">
					Documents ({claim.attachments.length})
				</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					Files and supporting documents attached to this claim.
				</p>
			</div>
			<Panel title="Attached Documents">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-0">File Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Uploaded By</TableHead>
							<TableHead>Date</TableHead>
							<TableHead className="pr-0 text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{claim.attachments.map((item) => (
							<TableRow key={item.id}>
								<TableCell className="py-3 pl-0 font-mono text-xs text-primary">
									{item.fileName}
								</TableCell>
								<TableCell className="py-3">{item.type}</TableCell>
								<TableCell className="py-3">{item.uploadedBy}</TableCell>
								<TableCell className="py-3">{item.date}</TableCell>
								<TableCell className="py-3 pr-0 text-right">
									<Button
										variant="outline"
										size="sm"
										className="h-7 text-xs"
										onClick={() => toast.message(`Opening ${item.fileName}`)}
									>
										View
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Panel>
		</div>
	);
}

function NotesTab({
	claim,
	notes,
	onAddNote,
}: {
	claim: ClaimDetail;
	notes: ClaimDetailNote[];
	onAddNote: () => void;
}) {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold text-foreground">Notes</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Operational notes and claim communication history.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className={cn(toolbarBtn, "border-border/80")}
					onClick={onAddNote}
				>
					<StickyNote className="size-3.5" />
					Add note
				</Button>
			</div>
			<Panel title={`Claim Notes (${notes.length})`}>
				<div className="space-y-3">
					{notes.length === 0 ? (
						<p className="py-6 text-center text-xs text-muted-foreground">
							No notes on this claim yet.
						</p>
					) : (
						notes.map((note) => (
							<div
								key={note.id}
								className="rounded-sm border border-primary/15 bg-primary/5 px-3 py-2.5"
							>
								<div className="flex justify-between gap-3 text-xs">
									<p className="font-medium text-foreground">{note.addedBy}</p>
									<p className="text-muted-foreground">{note.date}</p>
								</div>
								<p className="mt-2 text-sm text-foreground">{note.text}</p>
							</div>
						))
					)}
				</div>
			</Panel>
			<p className="text-[11px] text-muted-foreground">Claim {claim.claimId}</p>
		</div>
	);
}

function ContractFinancialsTab({ claim }: { claim: ClaimDetail }) {
	const contractedAmount = Math.round(claim.amountBilled * 0.67 * 100) / 100;
	const allowedAmount = claim.amountAllowed;
	const variance = Math.round((allowedAmount - contractedAmount) * 100) / 100;
	const serviceRows = claim.serviceLines.slice(0, 4);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-semibold">Contract &amp; Financials</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Compare claim amounts against applicable contract terms.
					</p>
				</div>
				<Button asChild variant="outline" size="sm" className="h-8">
					<Link href="/admin/contracts">
						View Contract <ExternalLink className="ml-1.5 size-3.5" />
					</Link>
				</Button>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
				{(
					[
						[
							"Billed Amount",
							formatCurrency(claim.amountBilled),
							"bg-primary text-primary-foreground",
							"text-primary",
							FileText,
						],
						[
							"Contracted Amount",
							formatCurrency(contractedAmount),
							"bg-emerald-600 text-white",
							"text-emerald-700 dark:text-emerald-300",
							WalletCards,
						],
						[
							"Allowed Amount",
							formatCurrency(allowedAmount),
							"bg-primary text-primary-foreground",
							"text-primary",
							WalletCards,
						],
						[
							"Paid Amount",
							formatCurrency(claim.amountPaid),
							"bg-emerald-600 text-white",
							"text-emerald-700 dark:text-emerald-300",
							WalletCards,
						],
						[
							"Contract Variance",
							`${variance >= 0 ? "+" : ""}${formatCurrency(variance)}`,
							"bg-amber-500 text-white",
							"text-amber-700 dark:text-amber-300",
							AlertTriangle,
						],
						[
							"Contract Status",
							variance > 0 ? "Review" : "Compliant",
							variance > 0
								? "bg-amber-500 text-white"
								: "bg-emerald-600 text-white",
							variance > 0
								? "text-amber-700 dark:text-amber-300"
								: "text-emerald-700 dark:text-emerald-300",
							AlertTriangle,
						],
					] as const
				).map(([label, value, well, valueTone, Icon]) => {
					const MetricIcon = Icon as typeof FileText;
					return (
						<div
							key={label}
							className={cn(PANEL, "border-l-2 border-l-border px-3 py-3")}
						>
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"flex size-7 items-center justify-center rounded-full shadow-sm",
										well
									)}
								>
									<MetricIcon className="size-3.5" />
								</span>
								<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
									{label}
								</p>
							</div>
							<p
								className={cn(
									"mt-2 text-base font-semibold tabular-nums",
									valueTone
								)}
							>
								{value}
							</p>
							{label === "Contract Variance" ? (
								<p className="mt-0.5 text-[10px] text-muted-foreground">
									Potential variance
								</p>
							) : null}
						</div>
					);
				})}
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<Panel title="Amount Comparison">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-8 pl-0 text-[10px]">
									Description
								</TableHead>
								<TableHead className="h-8 text-right text-[10px]">
									Amount
								</TableHead>
								<TableHead className="h-8 text-right text-[10px]">
									Difference from Contract
								</TableHead>
								<TableHead className="h-8 pr-0 text-right text-[10px]">
									% Difference
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[
								[
									"Billed Amount",
									claim.amountBilled,
									claim.amountBilled - contractedAmount,
								],
								["Contracted Amount", contractedAmount, 0],
								["Allowed Amount", allowedAmount, variance],
								[
									"Paid Amount",
									claim.amountPaid,
									claim.amountPaid - contractedAmount,
								],
								["Member Responsibility", claim.patientResponsibility, 0],
								[
									"Plan Paid Amount",
									claim.amountPaid,
									claim.amountPaid - contractedAmount,
								],
							].map(([label, amount, difference]) => {
								const diff = Number(difference);
								const amountValue = Number(amount);
								return (
									<TableRow key={label as string} className="hover:bg-muted/20">
										<TableCell className="py-2 pl-0 text-xs">{label}</TableCell>
										<TableCell className="py-2 text-right text-xs tabular-nums">
											{formatCurrency(amountValue)}
										</TableCell>
										<TableCell
											className={cn(
												"py-2 text-right text-xs tabular-nums",
												diff > 0 && "text-red-700"
											)}
										>
											{diff === 0
												? "—"
												: `${diff > 0 ? "+" : ""}${formatCurrency(diff)}`}
										</TableCell>
										<TableCell
											className={cn(
												"py-2 pr-0 text-right text-xs tabular-nums",
												diff > 0 && "text-red-700"
											)}
										>
											{diff === 0
												? "—"
												: `${diff > 0 ? "+" : ""}${Math.round((diff / contractedAmount) * 1000) / 10}%`}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<p className="mt-3 text-[10px] text-muted-foreground">
						Positive variance indicates amount is over the contracted amount.
					</p>
				</Panel>

				<Panel title="Contract Information">
					<dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-xs">
						{[
							["Contract ID", "ABC-2026-001"],
							["Contract Name", "Professional Services Agreement"],
							["Vendor", claim.vendor],
							["Provider", claim.provider],
							["Effective Dates", "01/01/2026 – 12/31/2026"],
							["Rate Type", "Contracted Rate"],
							["Payment Model", "Per Visit"],
							["Fee Schedule", "Professional Services Fee Schedule 2026"],
							[
								"Applicable Rule",
								"Use contracted rate for all covered services.",
							],
						].map(([label, value]) => (
							<div key={label} className="contents">
								<dt className="text-muted-foreground">{label}</dt>
								<dd
									className={cn(
										"font-medium",
										label === "Contract ID" && "text-primary"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="mt-4 h-8 text-xs"
					>
						<Link href="/admin/contracts/details">
							View Contract Details <ExternalLink className="ml-1.5 size-3" />
						</Link>
					</Button>
				</Panel>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<Panel
					title="Service vs Contract Summary"
					footer={{
						label: "View all service lines",
						href: `/admin/claim-encounter/claims/${encodeURIComponent(claim.claimId)}`,
					}}
				>
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-8 pl-0 text-[10px]">Service</TableHead>
								<TableHead className="h-8 text-[10px]">Service Date</TableHead>
								<TableHead className="h-8 text-right text-[10px]">
									Billed
								</TableHead>
								<TableHead className="h-8 text-right text-[10px]">
									Contracted
								</TableHead>
								<TableHead className="h-8 text-right text-[10px]">
									Allowed
								</TableHead>
								<TableHead className="h-8 pr-0 text-right text-[10px]">
									Variance
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{serviceRows.map((line) => {
								const contracted = Math.round(line.charge * 0.67 * 100) / 100;
								const lineVariance = line.allowed - contracted;
								return (
									<TableRow key={line.id} className="hover:bg-muted/20">
										<TableCell className="py-2 pl-0 text-xs">
											{line.code} – Service
										</TableCell>
										<TableCell className="py-2 text-xs">
											{formatDos(claim.dateOfService)}
										</TableCell>
										<TableCell className="py-2 text-right text-xs">
											{formatCurrency(line.charge)}
										</TableCell>
										<TableCell className="py-2 text-right text-xs">
											{formatCurrency(contracted)}
										</TableCell>
										<TableCell className="py-2 text-right text-xs">
											{formatCurrency(line.allowed)}
										</TableCell>
										<TableCell
											className={cn(
												"py-2 pr-0 text-right text-xs",
												lineVariance > 0 && "text-red-700"
											)}
										>
											{lineVariance > 0 ? "+" : ""}
											{formatCurrency(lineVariance)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Panel>
				<Panel title="Variance Explanation">
					<div className="flex gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
						<div>
							<p className="font-medium">
								The allowed amount exceeds the contracted amount by{" "}
								{formatCurrency(Math.max(variance, 0))}.
							</p>
							<p className="mt-3 font-semibold text-foreground">
								Potential Reasons
							</p>
							<ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
								<li>Contract exception or case rate adjustment</li>
								<li>Fee schedule update not applied</li>
								<li>Manual adjustment by payer</li>
								<li>Bundled service override</li>
							</ul>
							<Button
								variant="outline"
								size="sm"
								className="mt-4 h-8 text-xs"
								onClick={() => toast.success("Resolution note added")}
							>
								Add Resolution Note
							</Button>
						</div>
					</div>
				</Panel>
			</div>
		</div>
	);
}

function OperationsAuditTab({
	claim,
	notes,
	onAddNote,
	validateResult,
	headerValidationStatus,
}: {
	claim: ClaimDetail;
	notes: ClaimDetailNote[];
	onAddNote: () => void;
	validateResult?: ClaimHeaderValidateResultDto | null;
	headerValidationStatus?: string | null;
}) {
	const [ediTab, setEdiTab] = useState<"837I" | "835">("837I");
	const [relatedFilter, setRelatedFilter] =
		useState<(typeof RELATED_FILTERS)[number]>("All");
	const [notesTab, setNotesTab] = useState<"notes" | "attachments">("notes");
	const [ediFullscreen, setEdiFullscreen] = useState(false);

	const validationStatus =
		validateResult?.validation_status ??
		headerValidationStatus ??
		null;
	const exceptions = validateResult?.exceptions ?? [];
	const showLiveValidation = Boolean(validationStatus || exceptions.length > 0);

	const load837 = useCallback(() => loadEdiFixture("837I"), []);
	const load835 = useCallback(() => loadEdiFixture("835"), []);

	const relatedCounts = useMemo(() => {
		const all = claim.relatedClaims.length;
		const adjustments = claim.relatedClaims.filter(
			(c) => c.relationship === "Adjustment"
		).length;
		const voids = claim.relatedClaims.filter(
			(c) => c.relationship === "Void"
		).length;
		const reversals = claim.relatedClaims.filter(
			(c) => c.relationship === "Reversal"
		).length;
		return {
			All: all,
			Adjustments: adjustments,
			Voids: voids,
			Reversals: reversals,
		};
	}, [claim.relatedClaims]);

	const filteredRelated = useMemo(() => {
		if (relatedFilter === "All") return claim.relatedClaims;
		const map: Record<
			string,
			ClaimDetail["relatedClaims"][number]["relationship"]
		> = {
			Adjustments: "Adjustment",
			Voids: "Void",
			Reversals: "Reversal",
		};
		const rel = map[relatedFilter];
		return claim.relatedClaims.filter((c) => c.relationship === rel);
	}, [claim.relatedClaims, relatedFilter]);

	return (
		<div className="space-y-4">
			{/* Top row: Response Files | Validation */}
			<div className="grid gap-4 xl:grid-cols-2">
				<Panel
					title="Response Files"
					footer={{
						label: "View all response files",
						href: "/admin/claim-encounter/responses",
					}}
				>
					<FileTable rows={claim.responseFiles} />
				</Panel>

				<Panel
					title="Validation Results"
					footer={
						showLiveValidation
							? {
									label: "Domain validation (not EDI)",
									onClick: () =>
										toast.message("Domain validation", {
											description:
												"Re-validate runs required-field, duplicate, and void/replace checks only.",
										}),
								}
							: {
									label: "View validation details",
									onClick: () =>
										toast.message("Validation details", {
											description: `${claim.validation.passed} of ${claim.validation.total} passed`,
										}),
								}
					}
				>
					{showLiveValidation ? (
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
									Validation status
								</p>
								{validationStatus ? (
									<StatusBadge status={validationStatus} />
								) : null}
								{validateResult?.is_duplicate ? (
									<span className="rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
										Duplicate
									</span>
								) : null}
							</div>
							{exceptions.length === 0 ? (
								<p className="text-xs text-muted-foreground">
									No open exception rows in this response (status is source of
									truth).
								</p>
							) : (
								<ul className="max-h-48 space-y-2 overflow-y-auto">
									{exceptions.map((ex) => (
										<li
											key={ex.id}
											className="rounded-sm border border-border/50 bg-card px-3 py-2 text-xs"
										>
											<div className="flex flex-wrap items-center gap-1.5">
												<span className="font-mono text-[10px] font-semibold text-primary">
													{ex.code}
												</span>
												<span className="text-[10px] uppercase text-muted-foreground">
													{ex.severity}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{ex.status}
												</span>
											</div>
											<p className="mt-1 text-foreground">{ex.message}</p>
										</li>
									))}
								</ul>
							)}
						</div>
					) : (
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{[
								{
									label: "Total Validations",
									value: claim.validation.total,
									className: "text-foreground",
								},
								{
									label: "Passed",
									value: claim.validation.passed,
									className: "text-emerald-700",
								},
								{
									label: "Warnings",
									value: claim.validation.warnings,
									className: "text-amber-700",
								},
								{
									label: "Errors",
									value: claim.validation.errors,
									className: "text-red-700",
								},
							].map((item) => (
								<div
									key={item.label}
									className="rounded-sm border border-border/50 bg-card px-3 py-3"
								>
									<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
										{item.label}
									</p>
									<p
										className={cn(
											"mt-1 text-xl font-semibold tabular-nums",
											item.className
										)}
									>
										{item.value}
									</p>
								</div>
							))}
						</div>
					)}
				</Panel>
			</div>

			{/* EDI | File History + Batch + Related Claims */}
			<div className="grid items-stretch gap-4 xl:grid-cols-2">
				<Panel
					title="EDI Viewer"
					footer={{
						label: "View in full screen",
						onClick: () => setEdiFullscreen(true),
					}}
					className="h-full min-h-[640px]"
					bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden !p-0"
				>
					<div className="shrink-0 px-4 pt-3.5">
						<div className="flex items-center gap-1 border-b border-border/50">
							{(
								[
									["837I", "837 Professional"],
									["835", "835 Remittance"],
								] as const
							).map(([key, label]) => (
								<button
									key={key}
									type="button"
									onClick={() => setEdiTab(key)}
									className={cn(
										"border-b-2 px-3 py-2 text-xs font-medium transition-colors",
										ediTab === key
											? "border-primary text-primary"
											: "border-transparent text-muted-foreground hover:text-foreground"
									)}
								>
									{label}
								</button>
							))}
						</div>
					</div>
					<div className="relative min-h-0 flex-1">
						<div className="absolute inset-0 overflow-hidden px-4 py-3.5">
							<EdiViewerLoader
								key={ediTab}
								load={ediTab === "837I" ? load837 : load835}
								fileName={
									ediTab === "837I"
										? claim.edi837FileName
										: claim.edi835FileName
								}
								compact
								showInspector={false}
								className="h-full min-h-0 !rounded-md"
							/>
						</div>
					</div>
				</Panel>

				<div className="flex h-full min-h-[640px] flex-col gap-4">
					<Panel
						title="File History"
						footer={{
							label: "View full file history",
							href: "/admin/file-history",
						}}
					>
						<FileTable rows={claim.fileHistory} />
					</Panel>

					<Panel
						title="Batch Information"
						footer={{
							label: "View batch details",
							href: claim.batchId
								? `/admin/claim-encounter/batches/${encodeURIComponent(claim.batch.inboundBatch)}`
								: "/admin/claim-encounter/inbound",
						}}
					>
						<dl className="space-y-3 text-xs">
							{[
								[
									"Inbound Batch",
									claim.batch.inboundBatch,
									claim.batch.inboundAt,
								],
								[
									"Outbound Batch",
									claim.batch.outboundBatch,
									claim.batch.outboundAt,
								],
								["Run ID", claim.batch.runId, null],
								["Processing Job", claim.batch.processingJob, null],
							].map(([label, value, sub]) => (
								<div
									key={label}
									className="flex items-start justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
								>
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="text-right">
										<p className="font-mono font-medium text-primary">
											{value}
										</p>
										{sub ? (
											<p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
												{sub}
											</p>
										) : null}
									</dd>
								</div>
							))}
						</dl>
					</Panel>

					<Panel
						title="Related Claims"
						footer={{
							label: "View all related claims",
							href: "/admin/claim-encounter/claims",
						}}
						className="flex min-h-0 flex-1 flex-col"
						bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
					>
						<div className="mb-2 flex shrink-0 flex-wrap gap-0 border-b border-border/50">
							{RELATED_FILTERS.map((filter) => (
								<button
									key={filter}
									type="button"
									onClick={() => setRelatedFilter(filter)}
									className={cn(
										"border-b-2 px-2.5 py-2 text-[11px] font-medium transition-colors",
										relatedFilter === filter
											? "border-primary text-primary"
											: "border-transparent text-muted-foreground hover:text-foreground"
									)}
								>
									{filter} ({relatedCounts[filter]})
								</button>
							))}
						</div>
						<div className="min-h-0 flex-1 overflow-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">
											Claim ID
										</TableHead>
										<TableHead className="h-9 text-[11px]">
											Relationship
										</TableHead>
										<TableHead className="h-9 text-[11px]">
											Service Date
										</TableHead>
										<TableHead className="h-9 text-[11px]">Status</TableHead>
										<TableHead className="h-9 pr-0 text-right text-[11px]">
											Paid Amount
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredRelated.map((row) => (
										<TableRow key={row.claimId} className="hover:bg-muted/20">
											<TableCell className="py-2.5 pl-0">
												{row.claimId === claim.claimId ? (
													<span className="font-mono text-xs font-medium text-primary">
														{row.claimId}
													</span>
												) : (
													<Link
														href={`/admin/claim-encounter/claims/${encodeURIComponent(row.claimId)}`}
														className="font-mono text-xs font-medium text-primary hover:underline"
													>
														{row.claimId}
													</Link>
												)}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{row.relationship}
											</TableCell>
											<TableCell className="py-2.5 text-xs tabular-nums">
												{formatDos(row.serviceDate)}
											</TableCell>
											<TableCell className="py-2.5">
												<StatusBadge status={row.status} />
											</TableCell>
											<TableCell className="py-2.5 pr-0 text-right text-xs tabular-nums">
												{formatCurrency(row.paidAmount)}
											</TableCell>
										</TableRow>
									))}
									{filteredRelated.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="py-6 text-center text-xs text-muted-foreground"
											>
												No related claims in this category.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</div>
					</Panel>
				</div>
			</div>

			{/* Processing Logs — full width */}
			<Panel
				title="Processing Logs"
				footer={{
					label: "View full processing logs",
					href: "/admin/processing-logs",
				}}
			>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-9 pl-0 text-[11px]">
									Timestamp
								</TableHead>
								<TableHead className="h-9 text-[11px]">Step</TableHead>
								<TableHead className="h-9 text-[11px]">Message</TableHead>
								<TableHead className="h-9 text-[11px]">Status</TableHead>
								<TableHead className="h-9 pr-0 text-[11px]">Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{claim.processingLogs.map((row) => (
								<TableRow
									key={`${row.timestamp}-${row.step}`}
									className="hover:bg-muted/20"
								>
									<TableCell className="py-2.5 pl-0 text-[11px] tabular-nums text-muted-foreground">
										{row.timestamp}
									</TableCell>
									<TableCell className="py-2.5 text-xs font-medium">
										{row.step}
									</TableCell>
									<TableCell className="max-w-[320px] truncate py-2.5 text-xs">
										{row.message}
									</TableCell>
									<TableCell className="py-2.5">
										<StatusBadge status={row.status} />
									</TableCell>
									<TableCell className="max-w-[240px] truncate py-2.5 pr-0 text-[11px] text-muted-foreground">
										{row.details}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>

			{/* Bottom row */}
			<div className="grid gap-4 lg:grid-cols-3">
				<Panel
					title="Audit Trail"
					footer={{
						label: "View full audit trail",
						href: "/admin/audit-trail",
					}}
				>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-9 pl-0 text-[11px]">
										Date / Time
									</TableHead>
									<TableHead className="h-9 text-[11px]">Action</TableHead>
									<TableHead className="h-9 text-[11px]">
										User / System
									</TableHead>
									<TableHead className="h-9 pr-0 text-[11px]">
										Details
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{claim.auditTrail.map((row) => (
									<TableRow
										key={`${row.dateTime}-${row.action}`}
										className="hover:bg-muted/20"
									>
										<TableCell className="py-2.5 pl-0 text-[11px] tabular-nums text-muted-foreground">
											{row.dateTime}
										</TableCell>
										<TableCell className="py-2.5 text-xs font-medium">
											{row.action}
										</TableCell>
										<TableCell className="py-2.5 text-xs">
											{row.userSystem}
										</TableCell>
										<TableCell className="max-w-[160px] truncate py-2.5 pr-0 text-xs text-muted-foreground">
											{row.details}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</Panel>

				<Panel title="Reprocessing History">
					{claim.reprocessingHistory.length === 0 ? (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">
											Date / Time
										</TableHead>
										<TableHead className="h-9 text-[11px]">Reason</TableHead>
										<TableHead className="h-9 text-[11px]">Status</TableHead>
										<TableHead className="h-9 pr-0 text-[11px]">User</TableHead>
									</TableRow>
								</TableHeader>
							</Table>
							<p className="py-10 text-center text-xs text-muted-foreground">
								No reprocessing history found for this claim.
							</p>
						</div>
					) : (
						<ul className="space-y-2 text-xs">
							{claim.reprocessingHistory.map((row) => (
								<li
									key={`${row.timestamp}-${row.step}`}
									className="rounded-md border border-border/50 px-2.5 py-2"
								>
									<p className="font-medium">{row.step}</p>
									<p className="mt-0.5 text-muted-foreground">{row.message}</p>
								</li>
							))}
						</ul>
					)}
				</Panel>

				<Panel
					title="Notes & Attachments"
					footer={{
						label: "View all notes & attachments",
						onClick: () =>
							toast.message("Notes & attachments", {
								description: `${notes.length} notes · ${claim.attachments.length} attachments`,
							}),
					}}
				>
					<div className="mb-2 flex items-center gap-1 border-b border-border/50">
						<button
							type="button"
							onClick={() => setNotesTab("notes")}
							className={cn(
								"border-b-2 px-3 py-2 text-xs font-medium",
								notesTab === "notes"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground"
							)}
						>
							Notes ({notes.length})
						</button>
						<button
							type="button"
							onClick={() => setNotesTab("attachments")}
							className={cn(
								"border-b-2 px-3 py-2 text-xs font-medium",
								notesTab === "attachments"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground"
							)}
						>
							Attachments ({claim.attachments.length})
						</button>
						{notesTab === "notes" ? (
							<Button
								variant="ghost"
								size="sm"
								className="ml-auto h-7 gap-1.5 px-2 text-xs"
								onClick={onAddNote}
							>
								<StickyNote className="size-3.5" />
								Add note
							</Button>
						) : null}
					</div>

					{notesTab === "notes" ? (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">Note</TableHead>
										<TableHead className="h-9 text-[11px]">Added By</TableHead>
										<TableHead className="h-9 pr-0 text-[11px]">Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{notes.length === 0 ? (
										<TableRow className="hover:bg-transparent">
											<TableCell
												colSpan={3}
												className="py-8 text-center text-xs text-muted-foreground"
											>
												No notes yet.
											</TableCell>
										</TableRow>
									) : (
										notes.map((note) => (
											<TableRow key={note.id} className="hover:bg-muted/20">
												<TableCell className="py-2.5 pl-0 text-xs">
													{note.text}
												</TableCell>
												<TableCell className="py-2.5 text-xs">
													{note.addedBy}
												</TableCell>
												<TableCell className="py-2.5 pr-0 text-xs tabular-nums text-muted-foreground">
													{note.date}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">
											File Name
										</TableHead>
										<TableHead className="h-9 text-[11px]">Type</TableHead>
										<TableHead className="h-9 text-[11px]">
											Uploaded By
										</TableHead>
										<TableHead className="h-9 pr-0 text-[11px]">Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{claim.attachments.map((att) => (
										<TableRow key={att.id} className="hover:bg-muted/20">
											<TableCell className="py-2.5 pl-0 font-mono text-[11px] text-primary">
												{att.fileName}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{att.type}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{att.uploadedBy}
											</TableCell>
											<TableCell className="py-2.5 pr-0 text-xs tabular-nums text-muted-foreground">
												{att.date}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</Panel>
			</div>

			{ediFullscreen ? (
				<div className="fixed inset-0 z-50 flex flex-col bg-background">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<div>
							<p className="text-sm font-semibold">
								EDI ·{" "}
								{ediTab === "837I" ? "837 Professional" : "835 Remittance"}
							</p>
							<p className="text-xs text-muted-foreground">
								{ediTab === "837I"
									? claim.edi837FileName
									: claim.edi835FileName}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEdiFullscreen(false)}
						>
							Close
						</Button>
					</div>
					<div className="min-h-0 flex-1 p-4">
						<EdiViewerLoader
							key={`fs-${ediTab}`}
							load={ediTab === "837I" ? load837 : load835}
							fileName={
								ediTab === "837I" ? claim.edi837FileName : claim.edi835FileName
							}
							className="h-full"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}

export function ClaimDetailPage() {
	const useFixtures = isMockEnabled();
	if (!useFixtures) {
		return (
			<VendorCoreGate title="Claim Overview">
				<ClaimDetailBody useLive />
			</VendorCoreGate>
		);
	}
	return <ClaimDetailBody useLive={false} />;
}

function ClaimDetailBody({ useLive }: { useLive: boolean }) {
	const params = useParams<{ claimId: string }>();
	const claimIdParam = decodeURIComponent(params.claimId);
	const claimLinesQ = useVendorCoreClaimLines(useLive);
	const headersQ = useClaimHeadersLiveQuery(useLive);

	const matchedLineDto = useMemo(() => {
		if (!useLive) return null;
		return (
			(claimLinesQ.data ?? []).find(
				(row) =>
					row.id === claimIdParam ||
					row.claim_reference_id === claimIdParam ||
					row.claim_id === claimIdParam
			) ?? null
		);
	}, [useLive, claimLinesQ.data, claimIdParam]);

	const matchedHeaderDto = useMemo(() => {
		if (!useLive) return null;
		return (
			(headersQ.data ?? []).find((row) => {
				const id = String(row.id ?? "");
				const ref = String(row.claim_reference_id ?? row.reference_id ?? "");
				return id === claimIdParam || ref === claimIdParam;
			}) ?? null
		);
	}, [useLive, headersQ.data, claimIdParam]);

	const claim = useMemo(() => {
		if (useLive) {
			if (matchedHeaderDto) {
				const mapped = claimHeaderDtosToClaimLines([matchedHeaderDto])[0];
				if (mapped) return buildClaimDetailFromLine(mapped);
			}
			const line = findClaimLineByClaimId(claimLinesQ.data ?? [], claimIdParam);
			return line ? buildClaimDetailFromLine(line) : undefined;
		}
		return getClaimDetail(claimIdParam);
	}, [useLive, matchedHeaderDto, claimLinesQ.data, claimIdParam]);

	/** Prefer exact line match; else first line sharing claim reference (header view). */
	const noteTargetLineDto = useMemo(() => {
		if (!useLive) return null;
		if (matchedLineDto) return matchedLineDto;
		const ref =
			String(
				matchedHeaderDto?.claim_reference_id ??
					matchedHeaderDto?.reference_id ??
					claim?.claimId ??
					claimIdParam
			) || "";
		if (!ref) return null;
		return (
			(claimLinesQ.data ?? []).find(
				(row) =>
					row.claim_reference_id === ref ||
					row.claim_id === ref ||
					row.id === ref
			) ?? null
		);
	}, [
		useLive,
		matchedLineDto,
		matchedHeaderDto,
		claim?.claimId,
		claimIdParam,
		claimLinesQ.data,
	]);

	const [tab, setTab] = useState<MainTab>("Claim Summary");
	const [actionBusy, setActionBusy] = useState(false);
	const [noteOpen, setNoteOpen] = useState(false);
	const [noteText, setNoteText] = useState("");
	const [noteSaving, setNoteSaving] = useState(false);
	const [localNotes, setLocalNotes] = useState<ClaimDetailNote[]>([]);
	const [validateResult, setValidateResult] =
		useState<ClaimHeaderValidateResultDto | null>(null);
	const revalidateMutation = useRevalidateClaimHeadersMutation();

	useEffect(() => {
		setLocalNotes([]);
		setValidateResult(null);
	}, [claimIdParam]);

	const headerUuid = matchedHeaderDto?.id
		? String(matchedHeaderDto.id)
		: null;
	const headerValidationStatus =
		validateResult?.validation_status ??
		(matchedHeaderDto?.validation_status
			? String(matchedHeaderDto.validation_status)
			: null);

	const displayNotes = useMemo((): ClaimDetailNote[] => {
		if (!claim) return localNotes;
		if (!useLive) {
			const byId = new Map(claim.notes.map((n) => [n.id, n]));
			for (const n of localNotes) byId.set(n.id, n);
			return Array.from(byId.values());
		}
		const fromMeta = parseClaimOperationalNotes(noteTargetLineDto?.metadata);
		const byId = new Map(fromMeta.map((n) => [n.id, n]));
		for (const n of localNotes) byId.set(n.id, n);
		return Array.from(byId.values());
	}, [claim, useLive, noteTargetLineDto?.metadata, localNotes]);

	async function handleRevalidate() {
		if (!useLive) {
			toast.message("Re-validate needs live mode", {
				description:
					"Set NEXT_PUBLIC_USE_MOCK=false, restart pnpm, open a claim from the live Claims list (not showcase CLM724…).",
			});
			return;
		}
		if (!headerUuid) {
			toast.message("No claim header linked", {
				description:
					"Open a claim that comes from claim-headers (live list), not a fixture row.",
			});
			return;
		}
		try {
			const data = await revalidateMutation.mutateAsync([headerUuid]);
			const row = data.results[0] ?? null;
			setValidateResult(row);
			const invalid = data.results.filter(
				(r) => r.validation_status === "invalid"
			).length;
			toast.success(
				invalid === 0
					? `Re-validated ${data.validated_count} claim(s) — all clean`
					: `Re-validated ${data.validated_count} claim(s) — ${invalid} still invalid`
			);
			await headersQ.refetch();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Re-validate failed"
			);
		}
	}

	async function handleSaveNote() {
		const trimmed = noteText.trim();
		if (!trimmed) {
			toast.message("Enter a note before saving");
			return;
		}
		setNoteSaving(true);
		try {
			if (useLive) {
				const lineId = noteTargetLineDto?.id;
				if (!lineId) {
					toast.error(
						"No claim line linked — notes persist on claim-line metadata"
					);
					return;
				}
				const saved = await addClaimLineOperationalNote({
					claimLineId: lineId,
					text: trimmed,
				});
				setLocalNotes((prev) => [...prev, saved]);
				await claimLinesQ.refetch();
				toast.success("Note saved");
			} else {
				const note: ClaimDetailNote = {
					id: `local-note-${Date.now()}`,
					text: trimmed,
					addedBy: "You",
					date: new Date().toISOString().slice(0, 19).replace("T", " "),
				};
				setLocalNotes((prev) => [...prev, note]);
				toast.success("Note added (fixture session)");
			}
			setNoteText("");
			setNoteOpen(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save note");
		} finally {
			setNoteSaving(false);
		}
	}

	async function resolveInboundFileId(): Promise<string | null> {
		if (matchedHeaderDto?.source_inbound_file_id) {
			return String(matchedHeaderDto.source_inbound_file_id);
		}
		const headerVendorFile = matchedHeaderDto?.vendor_file as
			| { id?: string }
			| null
			| undefined;
		const vendorFileId =
			headerVendorFile?.id ?? matchedLineDto?.vendor_file_id ?? null;
		if (vendorFileId) {
			const vf = await resolveClaimVendorFile(String(vendorFileId));
			if (vf?.sourceInboundFileId) return vf.sourceInboundFileId;
		}
		if (claim?.fileId) {
			const vf = await resolveClaimVendorFile(claim.fileId);
			if (vf?.sourceInboundFileId) return vf.sourceInboundFileId;
		}
		try {
			const header = await getClaimHeaderLive(claim?.id ?? claimIdParam);
			if (header && typeof header === "object") {
				const inbound = (header as { source_inbound_file_id?: string | null })
					.source_inbound_file_id;
				if (inbound) return String(inbound);
			}
		} catch {
			/* ignore */
		}
		return null;
	}

	function resolveVendorFileId(): string | null {
		const headerVendorFile = matchedHeaderDto?.vendor_file as
			| { id?: string }
			| null
			| undefined;
		if (headerVendorFile?.id) {
			return String(headerVendorFile.id);
		}
		if (matchedLineDto?.vendor_file_id) {
			return String(matchedLineDto.vendor_file_id);
		}
		return null;
	}

	async function handleReprocess() {
		if (!useLive) {
			toast.message("Reprocess requires live vendor-core");
			return;
		}
		setActionBusy(true);
		try {
			const inboundId = await resolveInboundFileId();
			if (!inboundId) {
				toast.error(
					"No source inbound file linked to this claim — cannot reprocess"
				);
				return;
			}
			await reprocessInboundFile(inboundId);
			toast.success("Reprocess queued");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Reprocess failed");
		} finally {
			setActionBusy(false);
		}
	}

	async function handleDownloadEdi() {
		if (!useLive) {
			toast.message("EDI download requires live vendor-core");
			return;
		}
		const vendorFileId = resolveVendorFileId();
		if (!vendorFileId) {
			toast.error("No vendor file linked to this claim — cannot download EDI");
			return;
		}
		setActionBusy(true);
		try {
			const result = await downloadClaimVendorFile(vendorFileId);
			saveVendorCoreBlob(
				result,
				claim?.edi837FileName || claim?.fileName || "claim.edi"
			);
			toast.success("EDI download started");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "EDI download failed");
		} finally {
			setActionBusy(false);
		}
	}

	if (useLive && (claimLinesQ.isLoading || headersQ.isLoading) && !claim) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Loading claim from vendor-core…
				</p>
			</div>
		);
	}

	if (useLive && claimLinesQ.error && headersQ.error && !claim) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-destructive">
					Could not load claim: {claimLinesQ.error.message}
				</p>
				<Link
					href="/admin/claim-encounter/claims"
					className="text-sm text-primary hover:underline"
				>
					Back to Claims
				</Link>
			</div>
		);
	}

	if (!claim) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-destructive">Claim not found.</p>
				<Link
					href="/admin/claim-encounter/claims"
					className="text-sm text-primary hover:underline"
				>
					Back to Claims
				</Link>
			</div>
		);
	}

	function handleExport() {
		exportRowsAsCsv(
			`${claim!.claimId}-overview.csv`,
			[
				"Claim ID",
				"Member ID",
				"Member Name",
				"Provider",
				"Vendor",
				"Payer",
				"DOS",
				"Status",
				"Amount Billed",
				"Amount Paid",
			],
			[
				[
					claim!.claimId,
					claim!.memberId,
					claim!.memberName,
					claim!.provider,
					claim!.vendor,
					claim!.payer,
					claim!.dateOfService,
					claim!.status,
					claim!.amountBilled,
					claim!.amountPaid,
				],
			]
		);
		toast.success("Claim exported");
	}

	function handlePrint() {
		window.print();
		toast.message("Print dialog opened");
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
						asChild
					>
						<Link href="/admin/claim-encounter/claims">
							<ArrowLeft className="mr-1.5 size-3.5" />
							Back to Claims
						</Link>
					</Button>
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							<span className="font-mono text-primary">{claim.claimId}</span>
						</h1>
						<StatusBadge status={claim.status} />
						{headerValidationStatus ? (
							<StatusBadge status={headerValidationStatus} />
						) : null}
						{claim.priority !== "Normal" ? (
							<span
								className={cn(
									CMS_EDGE_STATUS_PILL_CLASS,
									claim.priority === "Urgent"
										? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
										: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
								)}
							>
								{claim.priority}
							</span>
						) : null}
					</div>
					<p className="text-sm text-muted-foreground">
						{claim.claimType} · {claim.vendor} · {claim.program}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{useLive ? (
						<Button
							variant="outline"
							size="sm"
							className={cn(
								toolbarBtn,
								"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
							)}
							disabled={
								!headerUuid ||
								revalidateMutation.isPending ||
								actionBusy
							}
							onClick={() => void handleRevalidate()}
						>
							<RefreshCw
								className={cn(
									"size-3.5",
									revalidateMutation.isPending && "animate-spin"
								)}
							/>
							Re-validate
						</Button>
					) : null}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									toolbarBtn,
									"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
								)}
							>
								<FileDown className="size-3.5" />
								Export
								<ChevronDown className="size-3.5 opacity-70" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56 p-1.5">
							<DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Download
							</DropdownMenuLabel>
							<DropdownMenuGroup>
								<DropdownMenuItem
									className={actionItemClass}
									onClick={handleExport}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
										<FileSpreadsheet className="size-3.5" />
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span>Export CSV</span>
										<span className="text-[10px] font-normal text-muted-foreground">
											Claim overview spreadsheet
										</span>
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className={actionItemClass}
									onClick={() =>
										toast.message("PDF export", {
											description: "Queued for generation",
										})
									}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-rose-500/10 text-rose-700 dark:text-rose-300">
										<FileText className="size-3.5" />
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span>Export PDF</span>
										<span className="text-[10px] font-normal text-muted-foreground">
											Printable claim packet
										</span>
									</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handlePrint}
					>
						<Printer className="size-3.5" />
						Print
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="sm"
								className={cn(
									toolbarBtn,
									"bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
								)}
							>
								Actions
								<ChevronDown className="size-3.5 opacity-80" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64 p-1.5">
							<DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Claim operations
							</DropdownMenuLabel>
							<DropdownMenuGroup>
								<DropdownMenuItem
									className={actionItemClass}
									disabled={
										actionBusy || revalidateMutation.isPending
									}
									onClick={() => void handleRevalidate()}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
										<RefreshCw
											className={cn(
												"size-3.5",
												revalidateMutation.isPending && "animate-spin"
											)}
										/>
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span>Re-validate</span>
										<span className="text-[10px] font-normal text-muted-foreground">
											{useLive
												? "Domain rules (fields, duplicates, void/replace)"
												: "Requires live vendor-core (turn mocks off)"}
										</span>
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className={actionItemClass}
									disabled={actionBusy}
									onClick={() => void handleReprocess()}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-amber-500/10 text-amber-800 dark:text-amber-200">
										<RefreshCw className="size-3.5" />
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span>Reprocess claim</span>
										<span className="text-[10px] font-normal text-muted-foreground">
											Queue source inbound file again
										</span>
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className={actionItemClass}
									disabled={actionBusy}
									onClick={() => void handleDownloadEdi()}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-sky-500/10 text-sky-800 dark:text-sky-200">
										<Download className="size-3.5" />
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span>Download EDI</span>
										<span className="text-[10px] font-normal text-muted-foreground">
											837 / package bytes from vendor-core
										</span>
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className={actionItemClass}
									onClick={() => setNoteOpen(true)}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-violet-500/10 text-violet-800 dark:text-violet-200">
										<StickyNote className="size-3.5" />
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span>Add note</span>
										<span className="text-[10px] font-normal text-muted-foreground">
											{useLive
												? "Saved on claim-line metadata"
												: "Fixture session only"}
										</span>
									</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator className="my-1.5" />
							<DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Quick links
							</DropdownMenuLabel>
							<DropdownMenuGroup>
								<DropdownMenuItem
									className={actionItemClass}
									onClick={() => {
										void navigator.clipboard.writeText(claim.claimId);
										toast.success("Claim ID copied");
									}}
								>
									<span className="flex size-7 items-center justify-center rounded-sm bg-muted text-muted-foreground">
										<Copy className="size-3.5" />
									</span>
									<span>Copy claim ID</span>
								</DropdownMenuItem>
								<DropdownMenuItem asChild className={actionItemClass}>
									<Link href="/admin/claim-encounter/claims">
										<span className="flex size-7 items-center justify-center rounded-sm bg-muted text-muted-foreground">
											<List className="size-3.5" />
										</span>
										<span>Back to claims list</span>
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<Dialog open={noteOpen} onOpenChange={setNoteOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Add note</DialogTitle>
						<DialogDescription>
							{useLive
								? "Saved to the linked claim line via metadata.operational_notes."
								: "Fixture mode — note stays in this browser session only."}
						</DialogDescription>
					</DialogHeader>
					<Textarea
						value={noteText}
						onChange={(e) => setNoteText(e.target.value)}
						placeholder="Write an operational note…"
						rows={5}
						className="resize-none text-sm"
					/>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							className={toolbarBtn}
							onClick={() => setNoteOpen(false)}
							disabled={noteSaving}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							className={cn(toolbarBtn, "bg-primary text-primary-foreground")}
							disabled={noteSaving || !noteText.trim()}
							onClick={() => void handleSaveNote()}
						>
							{noteSaving ? "Saving…" : "Save note"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Metadata strip */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="grid grid-cols-2 divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-6">
					{[
						{
							label: "Member",
							value: `${claim.memberName}`,
							sub: claim.memberId,
						},
						{ label: "DOS", value: formatDos(claim.dateOfService) },
						{
							label: "Provider",
							value: claim.provider,
							sub: claim.providerNpi,
						},
						{ label: "Vendor", value: claim.vendor },
						{ label: "Payer", value: claim.payer },
						{ label: "Trace", value: claim.traceId },
					].map((field) => (
						<div key={field.label} className="min-w-0 px-3 py-2.5">
							<p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
								{field.label}
							</p>
							<p
								className="mt-1 truncate text-xs font-semibold text-foreground"
								title={field.value}
							>
								{field.value}
							</p>
							{"sub" in field && field.sub ? (
								<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
									{field.sub}
								</p>
							) : null}
						</div>
					))}
				</div>
			</section>

			<ClaimTabsNav tab={tab} onTabChange={setTab} />

			<div>
				{tab === "Claim Summary" ? <OverviewTab claim={claim} /> : null}
				{tab === "Service Lines" ? <ServiceLinesTab claim={claim} /> : null}
				{tab === "Financials" ? <FinancialsTab claim={claim} /> : null}
				{tab === "Contract & Financials" ? (
					<ContractFinancialsTab claim={claim} />
				) : null}
				{tab === "History" ? (
					<OperationsAuditTab
						claim={claim}
						notes={displayNotes}
						onAddNote={() => setNoteOpen(true)}
						validateResult={validateResult}
						headerValidationStatus={headerValidationStatus}
					/>
				) : null}
				{tab === "Documents (2)" ? <DocumentsTab claim={claim} /> : null}
				{tab === "Notes" ? (
					<NotesTab
						claim={claim}
						notes={displayNotes}
						onAddNote={() => setNoteOpen(true)}
					/>
				) : null}
			</div>
		</div>
	);
}
