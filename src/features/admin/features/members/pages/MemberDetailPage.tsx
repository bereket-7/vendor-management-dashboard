"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

import {
	AlertTriangle,
	BadgeCheck,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	Download,
	History,
	Info,
	Languages,
	Mail,
	MapPin,
	Phone,
	Printer,
	ShieldAlert,
	ShieldCheck,
	UserRound,
	Users,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ClaimStatus,
	type EligibilityStatus,
	type ExceptionStatus,
	type MemberStatus,
	displayName,
	formatCurrency,
	formatDate,
	getMember,
	maskSsn,
	memberAge,
} from "@/features/admin/features/members/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
	"Overview",
	"Demographics",
	"Eligibility",
	"Coverage & Plan History",
	"Family / Dependents",
	"Claims & Encounters",
	"Accumulators",
	"Vendor / Source History",
	"Eligibility Exceptions",
] as const;

type Tab = (typeof TABS)[number];

function MemberStatusPill({ status }: { status: MemberStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "active" && "bg-emerald-100 text-emerald-800",
				status === "pending" && "bg-amber-100 text-amber-900",
				status === "inactive" && "bg-slate-100 text-slate-700",
				status === "termed" && "bg-red-100 text-red-800"
			)}
		>
			{status}
		</span>
	);
}

function EligPill({ status }: { status: EligibilityStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "eligible" && "bg-emerald-100 text-emerald-800",
				status === "termed" && "bg-red-100 text-red-800",
				status === "pending" && "bg-amber-100 text-amber-900",
				status === "ineligible" && "bg-slate-100 text-slate-700"
			)}
		>
			{status === "eligible" ? "Eligible" : status}
		</span>
	);
}

function ClaimPill({ status }: { status: ClaimStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "paid" && "bg-emerald-100 text-emerald-800",
				status === "denied" && "bg-red-100 text-red-800",
				status === "pending" && "bg-amber-100 text-amber-900",
				status === "partial" && "bg-sky-100 text-sky-900"
			)}
		>
			{status}
		</span>
	);
}

function ExceptionPill({ status }: { status: ExceptionStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "open" && "bg-red-100 text-red-800",
				status === "in_progress" && "bg-amber-100 text-amber-900",
				status === "resolved" && "bg-emerald-100 text-emerald-800"
			)}
		>
			{status.replace("_", " ")}
		</span>
	);
}

function Panel({
	title,
	action,
	children,
	className,
	dense,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	dense?: boolean;
}) {
	return (
		<section
			className={cn(
				"flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			<div
				className={cn(
					"flex items-center justify-between gap-3 border-b border-border/30 bg-gradient-to-r from-primary/[0.06] via-sky-500/[0.04] to-transparent",
					dense ? "px-4 py-2.5" : "px-5 py-3.5"
				)}
			>
				<h3 className="text-sm font-semibold tracking-tight">{title}</h3>
				{action}
			</div>
			<div className={cn("min-h-0 flex-1", dense ? "p-4" : "p-5")}>
				{children}
			</div>
		</section>
	);
}

function ViewAllLink({
	onClick,
	label = "View all",
}: {
	onClick?: () => void;
	label?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="mt-3 text-sm font-medium text-primary hover:underline"
		>
			{label} →
		</button>
	);
}

function MetaField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<div className="text-sm font-medium text-foreground break-words">
				{value ?? "—"}
			</div>
		</div>
	);
}

function MetricStrip({
	title,
	items,
	compact,
	className,
}: {
	title?: string;
	items: Array<{
		label: string;
		value: ReactNode;
		accent?: boolean;
		mono?: boolean;
	}>;
	compact?: boolean;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			{title ? (
				<div className="border-b border-border/30 bg-gradient-to-r from-emerald-500/[0.08] via-primary/[0.05] to-sky-500/[0.06] px-3 py-1.5 sm:px-4">
					<p className="text-[11px] font-semibold tracking-tight text-primary/80 uppercase">
						{title}
					</p>
				</div>
			) : null}
			<div className="flex w-full flex-wrap bg-gradient-to-b from-muted/20 to-transparent lg:flex-nowrap">
				{items.map((item, index) => (
					<div
						key={item.label}
						className={cn(
							"min-w-0 flex-1",
							compact
								? "min-w-[5.5rem] basis-[5.5rem] px-2.5 py-2.5 sm:px-3"
								: "min-w-[8.5rem] basis-[8.5rem] px-3 py-3 sm:px-4",
							index > 0 && "border-l border-border/30"
						)}
					>
						<p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
							{item.label}
						</p>
						<div
							className={cn(
								"mt-1 truncate text-sm font-semibold",
								item.mono &&
									"font-mono text-[13px] tabular-nums tracking-tight",
								item.accent ? "text-emerald-700" : "text-foreground"
							)}
						>
							{item.value ?? "—"}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function TableScroll({
	children,
	minWidthClassName = "min-w-[52rem]",
}: {
	children: ReactNode;
	minWidthClassName?: string;
}) {
	return (
		<ScrollArea className="w-full">
			<div className={minWidthClassName}>{children}</div>
		</ScrollArea>
	);
}

export function MemberDetailPage({
	memberId: memberIdProp,
}: {
	memberId?: string;
}) {
	const params = useParams<{ memberId?: string | string[] }>();
	const raw = memberIdProp ?? params.memberId;
	const memberId = decodeURIComponent(
		Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")
	);
	const member = useMemo(
		() => (memberId ? getMember(memberId) : undefined),
		[memberId]
	);
	const [tab, setTab] = useState<Tab>("Overview");
	const [claimsPane, setClaimsPane] = useState<"claims" | "encounters">(
		"claims"
	);

	if (!member) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-destructive">Member not found.</p>
				<Button asChild variant="outline" size="sm">
					<Link href="/admin/members">Back to members</Link>
				</Button>
			</div>
		);
	}

	const name = displayName(member);
	const claimRows = claimsPane === "claims" ? member.claims : member.encounters;

	return (
		<div className="space-y-5">
			{/* Page actions */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground">
					<span className="text-foreground/80">Members</span>
					<span className="mx-1.5 text-border">/</span>
					Member Profile
				</p>
				<div className="flex flex-wrap gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-9">
								Member Summary
								<ChevronDown className="ml-1 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => toast.message("Opening member summary PDF…")}
							>
								One-page summary
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => toast.message("Opening eligibility letter…")}
							>
								Eligibility letter
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => toast.message("Opening coverage card…")}
							>
								Coverage card
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={() => toast.success("Print dialog opened")}
					>
						<Printer className="mr-1.5 size-3.5" />
						Print
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" className="h-9">
								<Download className="mr-1.5 size-3.5" />
								Export
								<ChevronDown className="ml-1 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => toast.success("Exported CSV")}>
								Export CSV
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => toast.success("Exported PDF")}>
								Export PDF
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Identity header */}
			<section className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-sky-500/[0.05] p-5 shadow-sm">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex min-w-0 gap-4">
						<div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
							<UserRound className="size-8" />
						</div>
						<div className="min-w-0 space-y-2">
							<div className="flex flex-wrap items-center gap-2.5">
								<h1 className="text-2xl font-semibold tracking-tight">
									{name}
								</h1>
								<MemberStatusPill status={member.status} />
							</div>
							<div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
								<span>
									Member ID{" "}
									<span className="font-mono font-medium text-foreground">
										{member.memberId}
									</span>
								</span>
								<span>
									DOB{" "}
									<span className="font-medium tabular-nums text-foreground">
										{formatDate(member.dob)}
									</span>
								</span>
								<span>
									Gender{" "}
									<span className="font-medium text-foreground">
										{member.gender}
									</span>
								</span>
								<span>
									SSN{" "}
									<span className="font-mono font-medium text-foreground">
										{maskSsn(member.ssnLast4)}
									</span>
								</span>
							</div>
							<div className="flex flex-col gap-1.5 pt-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
								<span className="inline-flex items-center gap-2">
									<Phone className="size-3.5 shrink-0" />
									{member.phone}
								</span>
								<span className="inline-flex items-center gap-2">
									<Mail className="size-3.5 shrink-0" />
									<span className="break-all">{member.email}</span>
								</span>
								<span className="inline-flex items-start gap-2">
									<MapPin className="mt-0.5 size-3.5 shrink-0" />
									<span>
										{member.addressLine1}
										{member.addressLine2
											? `, ${member.addressLine2}`
											: ""}, {member.city}, {member.state} {member.zip}
									</span>
								</span>
							</div>
						</div>
					</div>

					<div className="grid shrink-0 gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:w-[360px]">
						<MetaField label="Current plan" value={member.planName} />
						<MetaField
							label="Program"
							value={`${member.planType} · ${member.program}`}
						/>
						<MetaField label="PCP" value={member.pcpName} />
						<MetaField
							label="PCP NPI"
							value={<span className="font-mono text-sm">{member.pcpNpi}</span>}
						/>
					</div>
				</div>
			</section>

			{/* Tabs */}
			<nav className="overflow-x-auto border-b border-border/40">
				<div className="flex min-w-max gap-1">
					{TABS.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => setTab(item)}
							className={cn(
								"border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
								tab === item
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							)}
						>
							{item}
						</button>
					))}
				</div>
			</nav>

			{tab === "Overview" ? (
				<div className="space-y-4">
					{/* Top row */}
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<Panel title="Member Snapshot">
							<dl className="grid grid-cols-2 gap-x-4 gap-y-5">
								<div>
									<dt className="text-xs font-medium text-muted-foreground">
										Member since
									</dt>
									<dd className="mt-1 text-sm font-medium tabular-nums">
										{formatDate(member.memberSince)}
									</dd>
								</div>
								<div>
									<dt className="text-xs font-medium text-muted-foreground">
										Last claim
									</dt>
									<dd className="mt-1 text-sm font-medium tabular-nums">
										{formatDate(member.lastClaimDate)}
									</dd>
								</div>
								<div>
									<dt className="text-xs font-medium text-muted-foreground">
										Total claims (YTD)
									</dt>
									<dd className="mt-1 text-xl font-semibold tabular-nums">
										{member.claimsYtd}
									</dd>
								</div>
								<div>
									<dt className="text-xs font-medium text-muted-foreground">
										Total paid (YTD)
									</dt>
									<dd className="mt-1 text-xl font-semibold tabular-nums">
										{formatCurrency(member.paidYtd)}
									</dd>
								</div>
							</dl>
						</Panel>

						<Panel title="Eligibility Status">
							<div className="flex flex-col items-center justify-center gap-3 py-3 text-center">
								<span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
									<CheckCircle2 className="size-8" />
								</span>
								<p className="text-base font-semibold capitalize text-emerald-800">
									{member.eligibilityStatus === "eligible"
										? "Eligible"
										: member.eligibilityStatus}
								</p>
								<p className="text-sm text-muted-foreground">
									{formatDate(member.coverageStart)}
									{" – "}
									{member.coverageEnd
										? formatDate(member.coverageEnd)
										: "Present"}
								</p>
							</div>
						</Panel>

						<Panel title="Plan Information">
							<div className="grid grid-cols-2 gap-x-4 gap-y-4">
								<MetaField
									label="Plan ID"
									value={<span className="font-mono">{member.planId}</span>}
								/>
								<MetaField label="Type" value={member.planType} />
								<MetaField label="LOB" value={member.lob} />
								<MetaField label="Program" value={member.program} />
							</div>
						</Panel>

						<Panel title="Important Alerts">
							{member.alerts.length === 0 ? (
								<p className="text-sm text-muted-foreground">No open alerts.</p>
							) : (
								<ul className="space-y-4">
									{member.alerts.map((a) => (
										<li key={a.id} className="flex items-start gap-3">
											{a.severity === "info" ? (
												<Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
											) : (
												<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
											)}
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium leading-snug">
													{a.title}
												</p>
												<button
													type="button"
													className="text-xs font-medium text-primary hover:underline"
													onClick={() => {
														if (a.title.includes("Exception"))
															setTab("Eligibility Exceptions");
														else if (a.title.includes("Claim"))
															setTab("Claims & Encounters");
														else setTab("Eligibility");
													}}
												>
													{a.hrefLabel}
												</button>
											</div>
										</li>
									))}
								</ul>
							)}
						</Panel>
					</div>

					{/* Middle row */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Panel
							title="Eligibility History"
							action={
								<button
									type="button"
									className="text-xs font-medium text-primary hover:underline"
									onClick={() => setTab("Eligibility")}
								>
									View all
								</button>
							}
						>
							<TableScroll>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Start</TableHead>
											<TableHead className="h-9 text-xs">End</TableHead>
											<TableHead className="h-9 text-xs">Status</TableHead>
											<TableHead className="h-9 text-xs">Source</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{member.eligibilityHistory.slice(0, 4).map((r) => (
											<TableRow key={r.id}>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(r.startDate)}
												</TableCell>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(r.endDate)}
												</TableCell>
												<TableCell className="py-2.5">
													<EligPill status={r.status} />
												</TableCell>
												<TableCell className="py-2.5 text-sm">
													{r.source}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableScroll>
						</Panel>

						<Panel
							title="Coverage / Plan History"
							action={
								<button
									type="button"
									className="text-xs font-medium text-primary hover:underline"
									onClick={() => setTab("Coverage & Plan History")}
								>
									View all
								</button>
							}
						>
							<TableScroll>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Plan</TableHead>
											<TableHead className="h-9 text-xs">Type</TableHead>
											<TableHead className="h-9 text-xs">Dates</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{member.planHistory.map((r) => (
											<TableRow key={r.id}>
												<TableCell className="max-w-[160px] truncate py-2.5 text-sm font-medium">
													{r.planName}
												</TableCell>
												<TableCell className="py-2.5 text-sm">
													{r.planType}
												</TableCell>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(r.startDate)} – {formatDate(r.endDate)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableScroll>
						</Panel>
					</div>

					<Panel
						title="Family / Dependents"
						action={
							<button
								type="button"
								className="text-xs font-medium text-primary hover:underline"
								onClick={() => setTab("Family / Dependents")}
							>
								View all
							</button>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Name</TableHead>
										<TableHead className="h-9 text-xs">Relationship</TableHead>
										<TableHead className="h-9 text-xs">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.dependents.map((d) => (
										<TableRow key={d.id}>
											<TableCell className="py-2.5 text-sm font-medium">
												{d.name}
												<p className="mt-0.5 text-xs font-normal text-muted-foreground">
													{formatDate(d.dob)} · {d.gender}
												</p>
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{d.relationship}
											</TableCell>
											<TableCell className="py-2.5">
												<MemberStatusPill status={d.coverageStatus} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableScroll>
					</Panel>

					{/* Bottom row */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Panel
							title="Recent Claims & Encounters"
							action={
								<button
									type="button"
									className="text-xs font-medium text-primary hover:underline"
									onClick={() => setTab("Claims & Encounters")}
								>
									View all
								</button>
							}
						>
							<div className="mb-3 flex gap-1.5">
								{(
									[
										{ id: "claims", label: `Claims (${member.claims.length})` },
										{
											id: "encounters",
											label: `Encounters (${member.encounters.length})`,
										},
									] as const
								).map((p) => (
									<button
										key={p.id}
										type="button"
										onClick={() => setClaimsPane(p.id)}
										className={cn(
											"rounded-md px-2.5 py-1.5 text-xs font-medium",
											claimsPane === p.id
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:bg-muted/50"
										)}
									>
										{p.label}
									</button>
								))}
							</div>
							<TableScroll>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">DOS</TableHead>
											<TableHead className="h-9 text-xs">Claim #</TableHead>
											<TableHead className="h-9 text-xs">Type</TableHead>
											<TableHead className="h-9 text-right text-xs">
												Paid
											</TableHead>
											<TableHead className="h-9 text-xs">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{claimRows.slice(0, 5).map((c) => (
											<TableRow key={c.id}>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(c.dos)}
												</TableCell>
												<TableCell className="py-2.5 font-mono text-xs">
													{c.claimNumber}
												</TableCell>
												<TableCell className="py-2.5 text-sm">
													{c.type}
												</TableCell>
												<TableCell className="py-2.5 text-right text-sm tabular-nums">
													{formatCurrency(c.paid)}
												</TableCell>
												<TableCell className="py-2.5">
													<ClaimPill status={c.status} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableScroll>
						</Panel>

						<Panel
							title="Accumulators"
							action={
								<button
									type="button"
									className="text-xs font-medium text-primary hover:underline"
									onClick={() => setTab("Accumulators")}
								>
									View all
								</button>
							}
						>
							<TableScroll>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Type</TableHead>
											<TableHead className="h-9 text-right text-xs">
												Individual
											</TableHead>
											<TableHead className="h-9 text-right text-xs">
												Family
											</TableHead>
											<TableHead className="h-9 text-right text-xs">
												Remaining
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{member.accumulators.map((a) => (
											<TableRow key={a.id}>
												<TableCell className="py-2.5 text-sm font-medium">
													{a.label}
												</TableCell>
												<TableCell className="py-2.5 text-right text-sm tabular-nums">
													{formatCurrency(a.individual)}
												</TableCell>
												<TableCell className="py-2.5 text-right text-sm tabular-nums">
													{formatCurrency(a.family)}
												</TableCell>
												<TableCell className="py-2.5 text-right text-sm tabular-nums">
													{formatCurrency(a.remaining)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableScroll>
						</Panel>
					</div>

					<Panel
						title="Vendor / Source History"
						action={
							<button
								type="button"
								className="text-xs font-medium text-primary hover:underline"
								onClick={() => setTab("Vendor / Source History")}
							>
								View all
							</button>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Source</TableHead>
										<TableHead className="h-9 text-xs">Feed</TableHead>
										<TableHead className="h-9 text-xs">Last received</TableHead>
										<TableHead className="h-9 text-xs">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.vendorHistory.map((v) => (
										<TableRow key={v.id}>
											<TableCell className="py-2.5 text-sm font-medium">
												{v.vendor}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{v.fileFeedType}
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{v.lastReceived}
											</TableCell>
											<TableCell className="py-2.5">
												<span
													className={cn(
														"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
														v.status === "success" &&
															"bg-emerald-100 text-emerald-800",
														v.status === "warning" &&
															"bg-amber-100 text-amber-900",
														v.status === "failed" && "bg-red-100 text-red-800"
													)}
												>
													{v.status}
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableScroll>
					</Panel>

					{/* Full-width exceptions */}
					<Panel title="Eligibility Exceptions">
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead>Exception type</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>Detected</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Source</TableHead>
										<TableHead>Resolution</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.exceptions.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="h-16 text-center text-muted-foreground"
											>
												No eligibility exceptions for this member.
											</TableCell>
										</TableRow>
									) : (
										member.exceptions.map((ex) => (
											<TableRow key={ex.id}>
												<TableCell className="text-sm font-semibold text-red-700">
													{ex.exceptionType}
												</TableCell>
												<TableCell className="max-w-[280px] text-sm leading-relaxed">
													{ex.description}
												</TableCell>
												<TableCell className="text-sm tabular-nums">
													{formatDate(ex.startDetected)}
												</TableCell>
												<TableCell>
													<ExceptionPill status={ex.status} />
												</TableCell>
												<TableCell className="text-sm">{ex.source}</TableCell>
												<TableCell className="max-w-[280px] text-sm text-muted-foreground leading-relaxed">
													{ex.resolution}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableScroll>
						<ViewAllLink onClick={() => setTab("Eligibility Exceptions")} />
					</Panel>
				</div>
			) : (
				<TabBody tab={tab} member={member} />
			)}
		</div>
	);
}

function FeedStatusPill({
	status,
}: {
	status: "success" | "warning" | "failed";
}) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "success" && "bg-emerald-100 text-emerald-800",
				status === "warning" && "bg-amber-100 text-amber-900",
				status === "failed" && "bg-red-100 text-red-800"
			)}
		>
			{status}
		</span>
	);
}

function MemberClaimsEncountersTab({
	member,
}: {
	member: NonNullable<ReturnType<typeof getMember>>;
}) {
	const [pane, setPane] = useState<"claims" | "encounters">("claims");
	const rows = pane === "claims" ? member.claims : member.encounters;
	const billedTotal = member.claims.reduce((s, c) => s + c.billed, 0);
	const paidTotal = member.claims.reduce((s, c) => s + c.paid, 0);
	const denied = member.claims.filter((c) => c.status === "denied").length;
	const pending = [...member.claims, ...member.encounters].filter(
		(c) => c.status === "pending"
	).length;

	return (
		<div className="space-y-4">
			<MetricStrip
				title="Claims & encounters snapshot"
				items={[
					{ label: "Claims YTD", value: `${member.claimsYtd}` },
					{
						label: "Paid YTD",
						value: formatCurrency(member.paidYtd),
					},
					{
						label: "Billed (listed)",
						value: formatCurrency(billedTotal),
					},
					{
						label: "Paid (listed)",
						value: formatCurrency(paidTotal),
					},
					{ label: "Denied", value: `${denied}` },
					{
						label: "Pending",
						value: `${pending}`,
						accent: pending === 0,
					},
				]}
			/>

			<div className="grid gap-3 lg:grid-cols-4">
				{(
					[
						{
							label: "Medical claims",
							value: member.claims.filter((c) => c.type === "Medical").length,
						},
						{
							label: "Pharmacy claims",
							value: member.claims.filter((c) => c.type === "Pharmacy").length,
						},
						{
							label: "Encounters",
							value: member.encounters.length,
						},
						{
							label: "Last claim",
							value: formatDate(member.lastClaimDate),
						},
					] as const
				).map((card) => (
					<div
						key={card.label}
						className="rounded-xl border border-border/40 bg-card px-4 py-3 shadow-sm"
					>
						<p className="text-[11px] font-medium text-muted-foreground uppercase">
							{card.label}
						</p>
						<p className="mt-1 text-sm font-semibold tabular-nums">
							{card.value}
						</p>
					</div>
				))}
			</div>

			<Panel
				dense
				title="Recent activity"
				action={
					<div className="flex items-center gap-1 rounded-lg bg-muted/40 p-0.5">
						{(
							[
								{
									id: "claims" as const,
									label: `Claims (${member.claims.length})`,
								},
								{
									id: "encounters" as const,
									label: `Encounters (${member.encounters.length})`,
								},
							] as const
						).map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() => setPane(p.id)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									pane === p.id
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
								)}
							>
								{p.label}
							</button>
						))}
					</div>
				}
			>
				<TableScroll>
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-9 text-xs">DOS</TableHead>
								<TableHead className="h-9 text-xs">Claim #</TableHead>
								<TableHead className="h-9 text-xs">Type</TableHead>
								<TableHead className="h-9 text-xs">Provider</TableHead>
								<TableHead className="h-9 text-right text-xs">Billed</TableHead>
								<TableHead className="h-9 text-right text-xs">Paid</TableHead>
								<TableHead className="h-9 text-xs">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((c) => (
								<TableRow key={c.id}>
									<TableCell className="py-2.5 text-sm tabular-nums">
										{formatDate(c.dos)}
									</TableCell>
									<TableCell className="py-2.5 font-mono text-xs">
										{c.claimNumber}
									</TableCell>
									<TableCell className="py-2.5 text-sm">{c.type}</TableCell>
									<TableCell className="py-2.5 text-sm">{c.provider}</TableCell>
									<TableCell className="py-2.5 text-right text-sm tabular-nums">
										{formatCurrency(c.billed)}
									</TableCell>
									<TableCell className="py-2.5 text-right text-sm tabular-nums">
										{formatCurrency(c.paid)}
									</TableCell>
									<TableCell className="py-2.5">
										<ClaimPill status={c.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableScroll>
				<p className="mt-3 text-[11px] text-muted-foreground">
					Showing recent {pane} for this member · Data as of {member.dataAsOf}
				</p>
			</Panel>
		</div>
	);
}

function TabBody({
	tab,
	member,
}: {
	tab: Tab;
	member: NonNullable<ReturnType<typeof getMember>>;
}) {
	if (tab === "Demographics") {
		const age = memberAge(member.dob);
		const legalName = displayName(member);
		const residential = [
			member.addressLine1,
			member.addressLine2,
			`${member.city}, ${member.state} ${member.zip}`,
		]
			.filter(Boolean)
			.join(", ");
		const mailing = [
			member.mailingAddressLine1,
			member.mailingAddressLine2,
			`${member.mailingCity}, ${member.mailingState} ${member.mailingZip}`,
		]
			.filter(Boolean)
			.join(", ");

		return (
			<div className="space-y-4">
				<div className="grid gap-3 xl:grid-cols-2">
					<MetricStrip
						compact
						title="Snapshot"
						items={[
							{
								label: "Status",
								value: <MemberStatusPill status={member.status} />,
							},
							{ label: "Gender", value: member.gender },
							{
								label: "Age",
								value: age != null ? `${age} yrs` : "—",
							},
							{ label: "Program", value: member.program },
							{ label: "Plan type", value: member.planType },
							{
								label: "Eligibility",
								value:
									member.eligibilityStatus === "eligible"
										? "Eligible"
										: member.eligibilityStatus,
								accent: member.eligibilityStatus === "eligible",
							},
						]}
					/>

					<MetricStrip
						compact
						title="Identifiers"
						items={[
							{
								label: "Member ID",
								value: member.memberId,
								mono: true,
							},
							{
								label: "SSN",
								value: maskSsn(member.ssnLast4),
								mono: true,
							},
							{
								label: "Plan ID",
								value: member.planId,
								mono: true,
							},
							{
								label: "PCP NPI",
								value: member.pcpNpi,
								mono: true,
							},
							{
								label: "Case / group",
								value: member.eligibilityHistory[0]?.groupCaseId ?? "—",
								mono: true,
							},
							{
								label: "Source",
								value: member.vendorSource,
							},
						]}
					/>
				</div>

				<div className="grid gap-3 lg:grid-cols-3">
					<Panel
						dense
						title="Personal identity"
						action={<UserRound className="size-3.5 text-muted-foreground" />}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3">
							<MetaField label="Legal name" value={legalName} />
							<MetaField
								label="Preferred name"
								value={member.preferredName ?? "—"}
							/>
							<MetaField
								label="Date of birth"
								value={
									<span className="tabular-nums">
										{formatDate(member.dob)}
										{age != null ? (
											<span className="ml-1.5 font-normal text-muted-foreground">
												({age})
											</span>
										) : null}
									</span>
								}
							/>
							<MetaField label="Gender" value={member.gender} />
							<MetaField label="Race" value={member.race} />
							<MetaField label="Ethnicity" value={member.ethnicity} />
							<div className="col-span-2">
								<MetaField
									label="Preferred language"
									value={
										<span className="inline-flex items-center gap-1.5">
											<Languages className="size-3.5 text-muted-foreground" />
											{member.preferredLanguage}
										</span>
									}
								/>
							</div>
							<MetaField
								label="SSN"
								value={
									<span className="font-mono tabular-nums">
										{maskSsn(member.ssnLast4)}
									</span>
								}
							/>
							<MetaField
								label="Communication"
								value={member.communicationPreference}
							/>
						</div>
					</Panel>

					<Panel
						dense
						title="Coverage profile"
						action={<BadgeCheck className="size-3.5 text-muted-foreground" />}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3">
							<MetaField label="Program" value={member.program} />
							<MetaField
								label="Member status"
								value={<MemberStatusPill status={member.status} />}
							/>
							<MetaField
								label="Eligibility"
								value={<EligPill status={member.eligibilityStatus} />}
							/>
							<MetaField label="LOB" value={member.lob} />
							<div className="col-span-2">
								<MetaField label="Plan" value={member.planName} />
							</div>
							<MetaField label="Plan type" value={member.planType} />
							<MetaField
								label="Plan ID"
								value={
									<span className="font-mono text-sm">{member.planId}</span>
								}
							/>
							<MetaField
								label="Coverage start"
								value={
									<span className="tabular-nums">
										{formatDate(member.coverageStart)}
									</span>
								}
							/>
							<MetaField
								label="Coverage end"
								value={
									<span className="tabular-nums">
										{formatDate(member.coverageEnd)}
									</span>
								}
							/>
							<div className="col-span-2">
								<MetaField
									label="PCP"
									value={
										<span>
											{member.pcpName}
											<span className="mt-0.5 block font-mono text-xs font-normal text-muted-foreground">
												NPI {member.pcpNpi}
											</span>
										</span>
									}
								/>
							</div>
						</div>
					</Panel>

					<Panel
						dense
						title="Emergency contact"
						action={<Phone className="size-3.5 text-muted-foreground" />}
					>
						<div className="grid grid-cols-1 gap-y-3">
							<MetaField
								label="Contact name"
								value={member.emergencyContactName}
							/>
							<MetaField
								label="Relationship"
								value={member.emergencyContactRelation}
							/>
							<MetaField
								label="Phone"
								value={
									<span className="tabular-nums">
										{member.emergencyContactPhone}
									</span>
								}
							/>
							<div className="border-t border-border/30 pt-3">
								<p className="text-[11px] leading-relaxed text-muted-foreground">
									Eligibility history and plan changes are maintained on their
									dedicated tabs.
									<span className="mt-1 block">
										Data as of {member.dataAsOf}
									</span>
								</p>
							</div>
						</div>
					</Panel>
				</div>

				<Panel
					dense
					title="Address & contact"
					action={<Building2 className="size-3.5 text-muted-foreground" />}
				>
					<div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
						<MetaField
							label="Residential address"
							value={
								<span className="inline-flex items-start gap-1.5">
									<MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
									<span>{residential}</span>
								</span>
							}
						/>
						<MetaField label="Mailing address" value={mailing} />
						<div className="grid grid-cols-1 gap-y-3 sm:col-span-2 xl:col-span-2 xl:grid-cols-2">
							<MetaField
								label="Phone"
								value={
									<span className="inline-flex items-center gap-1.5 tabular-nums">
										<Phone className="size-3.5 text-muted-foreground" />
										{member.phone}
									</span>
								}
							/>
							<MetaField
								label="Email"
								value={
									<span className="inline-flex items-center gap-1.5 truncate">
										<Mail className="size-3.5 shrink-0 text-muted-foreground" />
										<span className="truncate">{member.email}</span>
									</span>
								}
							/>
							<MetaField
								label="Member since"
								value={
									<span className="tabular-nums">
										{formatDate(member.memberSince)}
									</span>
								}
							/>
							<MetaField
								label="Last claim"
								value={
									<span className="tabular-nums">
										{formatDate(member.lastClaimDate)}
									</span>
								}
							/>
						</div>
					</div>
				</Panel>
			</div>
		);
	}

	if (tab === "Eligibility") {
		const current =
			member.eligibilityHistory.find((r) => !r.endDate) ??
			member.eligibilityHistory[0];
		const openExceptions = member.exceptions.filter(
			(e) => e.status === "open" || e.status === "in_progress"
		);
		const termedSpans = member.eligibilityHistory.filter(
			(r) => r.status === "termed"
		).length;
		const pendingSpans = member.eligibilityHistory.filter(
			(r) => r.status === "pending"
		).length;

		return (
			<div className="space-y-4">
				<MetricStrip
					title="Eligibility snapshot"
					items={[
						{
							label: "Status",
							value: <EligPill status={member.eligibilityStatus} />,
						},
						{
							label: "Coverage start",
							value: formatDate(member.coverageStart),
						},
						{
							label: "Coverage end",
							value: member.coverageEnd
								? formatDate(member.coverageEnd)
								: "Present",
						},
						{
							label: "Active source",
							value: current?.source ?? "—",
						},
						{
							label: "Case / group",
							value: current?.groupCaseId ?? "—",
							mono: true,
						},
						{
							label: "Open exceptions",
							value: `${openExceptions.length}`,
							accent: openExceptions.length === 0,
						},
					]}
				/>

				<div className="grid gap-3 lg:grid-cols-5">
					<Panel
						dense
						title="Current eligibility"
						className="lg:col-span-2"
						action={<ShieldCheck className="size-3.5 text-muted-foreground" />}
					>
						<div className="space-y-4">
							<div className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/15 p-3.5">
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full",
										member.eligibilityStatus === "eligible"
											? "bg-emerald-100 text-emerald-700"
											: member.eligibilityStatus === "pending"
												? "bg-amber-100 text-amber-800"
												: "bg-red-100 text-red-700"
									)}
								>
									<CheckCircle2 className="size-5" />
								</span>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground">
										Determination
									</p>
									<p className="mt-0.5 text-base font-semibold capitalize">
										{member.eligibilityStatus === "eligible"
											? "Eligible for benefits"
											: member.eligibilityStatus}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{formatDate(member.coverageStart)} –{" "}
										{member.coverageEnd
											? formatDate(member.coverageEnd)
											: "Present"}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-x-4 gap-y-3">
								<MetaField label="Program" value={member.program} />
								<MetaField
									label="Member status"
									value={<MemberStatusPill status={member.status} />}
								/>
								<MetaField
									label="Verified by"
									value={current?.verifiedBy ?? "—"}
								/>
								<MetaField label="Source file" value={current?.source ?? "—"} />
								<div className="col-span-2">
									<MetaField label="Reason" value={current?.reason ?? "—"} />
								</div>
								<div className="col-span-2">
									<MetaField
										label="Group / case ID"
										value={
											<span className="font-mono text-sm">
												{current?.groupCaseId ?? "—"}
											</span>
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-2 border-t border-border/30 pt-3">
								<div className="rounded-lg bg-muted/20 px-2.5 py-2 text-center">
									<p className="text-[10px] font-medium text-muted-foreground uppercase">
										Spans
									</p>
									<p className="mt-0.5 text-sm font-semibold tabular-nums">
										{member.eligibilityHistory.length}
									</p>
								</div>
								<div className="rounded-lg bg-muted/20 px-2.5 py-2 text-center">
									<p className="text-[10px] font-medium text-muted-foreground uppercase">
										Termed
									</p>
									<p className="mt-0.5 text-sm font-semibold tabular-nums">
										{termedSpans}
									</p>
								</div>
								<div className="rounded-lg bg-muted/20 px-2.5 py-2 text-center">
									<p className="text-[10px] font-medium text-muted-foreground uppercase">
										Pending
									</p>
									<p className="mt-0.5 text-sm font-semibold tabular-nums">
										{pendingSpans}
									</p>
								</div>
							</div>
						</div>
					</Panel>

					<Panel
						dense
						title="Eligibility history"
						className="lg:col-span-3"
						action={
							<span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<History className="size-3.5" />
								{member.eligibilityHistory.length} spans
							</span>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Start</TableHead>
										<TableHead className="h-9 text-xs">End</TableHead>
										<TableHead className="h-9 text-xs">Status</TableHead>
										<TableHead className="h-9 text-xs">Source</TableHead>
										<TableHead className="h-9 text-xs">Case / group</TableHead>
										<TableHead className="h-9 text-xs">Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.eligibilityHistory.map((r) => (
										<TableRow key={r.id}>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{formatDate(r.startDate)}
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{r.endDate ? (
													formatDate(r.endDate)
												) : (
													<span className="font-medium text-emerald-700">
														Present
													</span>
												)}
											</TableCell>
											<TableCell className="py-2.5">
												<EligPill status={r.status} />
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{r.source}
											</TableCell>
											<TableCell className="py-2.5 font-mono text-xs">
												{r.groupCaseId}
											</TableCell>
											<TableCell className="max-w-[220px] py-2.5 text-sm text-muted-foreground">
												{r.reason}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableScroll>
						<p className="mt-3 text-[11px] text-muted-foreground">
							Eligibility spans are ordered newest first · Verified via{" "}
							{current?.verifiedBy ?? "system"} · Data as of {member.dataAsOf}
						</p>
					</Panel>
				</div>

				{openExceptions.length > 0 ? (
					<Panel
						dense
						title="Related eligibility exceptions"
						action={
							<span className="text-[11px] text-muted-foreground">
								{openExceptions.length} open / in progress
							</span>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Type</TableHead>
										<TableHead className="h-9 text-xs">Description</TableHead>
										<TableHead className="h-9 text-xs">Source</TableHead>
										<TableHead className="h-9 text-xs">Status</TableHead>
										<TableHead className="h-9 text-xs">Detected</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{openExceptions.map((ex) => (
										<TableRow key={ex.id}>
											<TableCell className="py-2.5 text-sm font-medium text-amber-800">
												{ex.exceptionType}
											</TableCell>
											<TableCell className="py-2.5 text-sm leading-relaxed">
												{ex.description}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{ex.source}
											</TableCell>
											<TableCell className="py-2.5">
												<ExceptionPill status={ex.status} />
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{formatDate(ex.startDetected)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableScroll>
					</Panel>
				) : null}
			</div>
		);
	}

	if (tab === "Coverage & Plan History") {
		const currentPlan =
			member.planHistory.find((p) => !p.endDate) ?? member.planHistory[0];
		const priorPlans = member.planHistory.filter((p) => p.endDate);

		return (
			<div className="space-y-4">
				<MetricStrip
					title="Coverage snapshot"
					items={[
						{ label: "Plan", value: member.planName },
						{ label: "Type", value: member.planType },
						{ label: "LOB", value: member.lob },
						{ label: "Program", value: member.program },
						{
							label: "Plan ID",
							value: member.planId,
							mono: true,
						},
						{
							label: "Effective",
							value: formatDate(member.coverageStart),
						},
					]}
				/>

				<div className="grid gap-3 lg:grid-cols-5">
					<Panel
						dense
						title="Active plan"
						className="lg:col-span-2"
						action={<BadgeCheck className="size-3.5 text-muted-foreground" />}
					>
						<div className="space-y-4">
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Product
								</p>
								<p className="mt-1 text-base font-semibold tracking-tight">
									{currentPlan?.planName ?? member.planName}
								</p>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{currentPlan?.carrier ?? "—"} ·{" "}
									{currentPlan?.planType ?? member.planType}
								</p>
							</div>
							<div className="grid grid-cols-2 gap-x-4 gap-y-3">
								<MetaField
									label="Plan ID"
									value={
										<span className="font-mono text-sm">
											{currentPlan?.planId ?? member.planId}
										</span>
									}
								/>
								<MetaField label="LOB" value={member.lob} />
								<MetaField
									label="Start"
									value={
										<span className="tabular-nums">
											{formatDate(
												currentPlan?.startDate ?? member.coverageStart
											)}
										</span>
									}
								/>
								<MetaField
									label="End"
									value={
										<span className="font-medium text-emerald-700">
											Present
										</span>
									}
								/>
								<div className="col-span-2">
									<MetaField
										label="Change reason"
										value={currentPlan?.changeReason ?? "Current active plan"}
									/>
								</div>
								<div className="col-span-2">
									<MetaField
										label="Assigned PCP"
										value={
											<span>
												{member.pcpName}
												<span className="mt-0.5 block font-mono text-xs font-normal text-muted-foreground">
													NPI {member.pcpNpi}
												</span>
											</span>
										}
									/>
								</div>
							</div>
							<div className="rounded-lg border border-dashed border-border/50 p-3">
								<p className="text-[11px] leading-relaxed text-muted-foreground">
									Prior products ({priorPlans.length}) are retained for audit.
									Eligibility status and exceptions remain on the Eligibility
									tab.
								</p>
							</div>
						</div>
					</Panel>

					<Panel
						dense
						title="Plan history"
						className="lg:col-span-3"
						action={
							<span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<CalendarDays className="size-3.5" />
								{member.planHistory.length} products
							</span>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Plan</TableHead>
										<TableHead className="h-9 text-xs">Carrier</TableHead>
										<TableHead className="h-9 text-xs">Type</TableHead>
										<TableHead className="h-9 text-xs">Plan ID</TableHead>
										<TableHead className="h-9 text-xs">Start</TableHead>
										<TableHead className="h-9 text-xs">End</TableHead>
										<TableHead className="h-9 text-xs">Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.planHistory.map((r) => (
										<TableRow key={r.id}>
											<TableCell className="py-2.5">
												<p className="text-sm font-medium">{r.planName}</p>
												{!r.endDate ? (
													<span className="mt-0.5 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
														Active
													</span>
												) : null}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{r.carrier}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{r.planType}
											</TableCell>
											<TableCell className="py-2.5 font-mono text-xs">
												{r.planId}
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{formatDate(r.startDate)}
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{r.endDate ? (
													formatDate(r.endDate)
												) : (
													<span className="font-medium text-emerald-700">
														Present
													</span>
												)}
											</TableCell>
											<TableCell className="max-w-[180px] py-2.5 text-sm text-muted-foreground">
												{r.changeReason}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableScroll>
						<p className="mt-3 text-[11px] text-muted-foreground">
							Data as of {member.dataAsOf}
						</p>
					</Panel>
				</div>
			</div>
		);
	}

	if (tab === "Family / Dependents") {
		const household = member.dependents.length;
		const activeCovered = member.dependents.filter(
			(d) => d.coverageStatus === "active"
		).length;
		const children = member.dependents.filter(
			(d) => d.relationship === "Daughter" || d.relationship === "Son"
		).length;
		const subscriber = member.dependents.find((d) => d.relationship === "Self");

		return (
			<div className="space-y-4">
				<MetricStrip
					title="Household snapshot"
					items={[
						{ label: "Household size", value: `${household}` },
						{
							label: "Active covered",
							value: `${activeCovered}`,
							accent: true,
						},
						{ label: "Children", value: `${children}` },
						{
							label: "Subscriber",
							value: subscriber?.name.split(" ")[0] ?? "—",
						},
						{
							label: "Shared plan",
							value: member.planName,
						},
						{
							label: "Program",
							value: member.program,
						},
					]}
				/>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{member.dependents.map((d) => {
						const age = memberAge(d.dob);
						const isSelf = d.relationship === "Self";
						return (
							<section
								key={d.id}
								className={cn(
									"rounded-xl border bg-card p-4 shadow-sm",
									isSelf
										? "border-primary/30 ring-1 ring-primary/15"
										: "border-border/40"
								)}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex min-w-0 items-start gap-3">
										<span
											className={cn(
												"flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
												isSelf
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground"
											)}
										>
											{d.name
												.split(/\s+/)
												.slice(0, 2)
												.map((p) => p[0])
												.join("")
												.toUpperCase()}
										</span>
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold">{d.name}</p>
											<p className="text-sm leading-relaxed text-muted-foreground">
												{d.relationship}
												{age != null ? ` · ${age} yrs` : ""}
											</p>
										</div>
									</div>
									<MemberStatusPill status={d.coverageStatus} />
								</div>

								<div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
									<div>
										<p className="text-[10px] font-medium text-muted-foreground uppercase">
											DOB
										</p>
										<p className="mt-0.5 text-xs font-medium tabular-nums">
											{formatDate(d.dob)}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-medium text-muted-foreground uppercase">
											Gender
										</p>
										<p className="mt-0.5 text-xs font-medium">{d.gender}</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-medium text-muted-foreground uppercase">
											Member ID
										</p>
										<p className="mt-0.5 font-mono text-xs font-medium">
											{d.memberId ?? "—"}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-medium text-muted-foreground uppercase">
											PCP
										</p>
										<p className="mt-0.5 text-xs font-medium">
											{d.pcpName ?? "—"}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-medium text-muted-foreground uppercase">
											Plan
										</p>
										<p className="mt-0.5 truncate text-xs font-medium">
											{d.planName ?? member.planName}
										</p>
									</div>
								</div>
							</section>
						);
					})}
				</div>

				<Panel
					dense
					title="Family roster"
					action={
						<span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
							<Users className="size-3.5" />
							{household} members
						</span>
					}
				>
					<TableScroll>
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-9 text-xs">Name</TableHead>
									<TableHead className="h-9 text-xs">Relationship</TableHead>
									<TableHead className="h-9 text-xs">DOB / age</TableHead>
									<TableHead className="h-9 text-xs">Gender</TableHead>
									<TableHead className="h-9 text-xs">Member ID</TableHead>
									<TableHead className="h-9 text-xs">PCP</TableHead>
									<TableHead className="h-9 text-xs">Coverage</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{member.dependents.map((d) => {
									const age = memberAge(d.dob);
									return (
										<TableRow key={d.id}>
											<TableCell className="py-2.5 text-sm font-medium">
												{d.name}
												{d.relationship === "Self" ? (
													<span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
														Subscriber
													</span>
												) : null}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{d.relationship}
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{formatDate(d.dob)}
												{age != null ? (
													<span className="text-muted-foreground">
														{" "}
														({age})
													</span>
												) : null}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{d.gender}
											</TableCell>
											<TableCell className="py-2.5 font-mono text-xs">
												{d.memberId ?? "—"}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{d.pcpName ?? "—"}
											</TableCell>
											<TableCell className="py-2.5">
												<MemberStatusPill status={d.coverageStatus} />
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableScroll>
					<p className="mt-3 text-[11px] text-muted-foreground">
						Household coverage under {member.planName} · Data as of{" "}
						{member.dataAsOf}
					</p>
				</Panel>
			</div>
		);
	}

	if (tab === "Claims & Encounters") {
		return <MemberClaimsEncountersTab member={member} />;
	}

	if (tab === "Accumulators") {
		const oop = member.accumulators.find((a) =>
			a.label.toLowerCase().includes("out of pocket")
		);
		const deductible = member.accumulators.find(
			(a) => a.label === "Deductible"
		);
		const metCount = member.accumulators.filter((a) => a.remaining <= 0).length;

		return (
			<div className="space-y-4">
				<MetricStrip
					title="Accumulator snapshot"
					items={[
						{
							label: "Deductible used",
							value: deductible ? formatCurrency(deductible.individual) : "—",
						},
						{
							label: "Deductible remaining",
							value: deductible ? formatCurrency(deductible.remaining) : "—",
							accent: (deductible?.remaining ?? 1) === 0,
						},
						{
							label: "OOP used",
							value: oop ? formatCurrency(oop.individual) : "—",
						},
						{
							label: "OOP remaining",
							value: oop ? formatCurrency(oop.remaining) : "—",
						},
						{
							label: "Buckets met",
							value: `${metCount}/${member.accumulators.length}`,
						},
						{
							label: "Plan year paid",
							value: formatCurrency(member.paidYtd),
						},
					]}
				/>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{member.accumulators.map((a) => {
						const pct = a.limit
							? Math.min(100, Math.round((a.individual / a.limit) * 100))
							: 0;
						const familyPct = a.limit
							? Math.min(100, Math.round((a.family / a.limit) * 100))
							: 0;
						return (
							<section
								key={a.id}
								className="rounded-xl border border-border/40 bg-card p-4 shadow-sm"
							>
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="text-sm font-semibold">{a.label}</p>
										<p className="mt-0.5 text-[11px] text-muted-foreground">
											Limit {formatCurrency(a.limit)}
										</p>
									</div>
									<span
										className={cn(
											"rounded-full px-2 py-0.5 text-[10px] font-medium",
											a.remaining <= 0
												? "bg-emerald-100 text-emerald-800"
												: "bg-slate-100 text-slate-700"
										)}
									>
										{a.remaining <= 0 ? "Met" : "Open"}
									</span>
								</div>

								<div className="mt-4 space-y-3">
									<div>
										<div className="mb-1 flex items-center justify-between text-xs">
											<span className="text-muted-foreground">Individual</span>
											<span className="font-medium tabular-nums">
												{formatCurrency(a.individual)} · {pct}%
											</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-primary"
												style={{ width: `${pct}%` }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex items-center justify-between text-xs">
											<span className="text-muted-foreground">Family</span>
											<span className="font-medium tabular-nums">
												{formatCurrency(a.family)} · {familyPct}%
											</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-sky-600"
												style={{ width: `${familyPct}%` }}
											/>
										</div>
									</div>
									<div className="flex items-center justify-between border-t border-border/30 pt-2.5 text-xs">
										<span className="text-muted-foreground">Remaining</span>
										<span className="font-semibold tabular-nums">
											{formatCurrency(a.remaining)}
										</span>
									</div>
								</div>
							</section>
						);
					})}
				</div>

				<Panel
					dense
					title="Accumulator detail"
					action={<Wallet className="size-3.5 text-muted-foreground" />}
				>
					<TableScroll>
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-9 text-xs">Accumulator</TableHead>
									<TableHead className="h-9 text-right text-xs">
										Individual
									</TableHead>
									<TableHead className="h-9 text-right text-xs">
										Family
									</TableHead>
									<TableHead className="h-9 text-right text-xs">
										Limit
									</TableHead>
									<TableHead className="h-9 text-right text-xs">
										Remaining
									</TableHead>
									<TableHead className="h-9 text-xs">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{member.accumulators.map((a) => (
									<TableRow key={a.id}>
										<TableCell className="py-2.5 text-sm font-medium">
											{a.label}
										</TableCell>
										<TableCell className="py-2.5 text-right text-sm tabular-nums">
											{formatCurrency(a.individual)}
										</TableCell>
										<TableCell className="py-2.5 text-right text-sm tabular-nums">
											{formatCurrency(a.family)}
										</TableCell>
										<TableCell className="py-2.5 text-right text-sm tabular-nums">
											{formatCurrency(a.limit)}
										</TableCell>
										<TableCell className="py-2.5 text-right text-sm tabular-nums">
											{formatCurrency(a.remaining)}
										</TableCell>
										<TableCell className="py-2.5">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													a.remaining <= 0
														? "bg-emerald-100 text-emerald-800"
														: "bg-slate-100 text-slate-700"
												)}
											>
												{a.remaining <= 0 ? "Met" : "Open"}
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableScroll>
					<p className="mt-3 text-[11px] text-muted-foreground">
						Plan year accumulators for {member.planName} · Data as of{" "}
						{member.dataAsOf}
					</p>
				</Panel>
			</div>
		);
	}

	if (tab === "Vendor / Source History") {
		const success = member.vendorHistory.filter(
			(v) => v.status === "success"
		).length;
		const warning = member.vendorHistory.filter(
			(v) => v.status === "warning"
		).length;
		const failed = member.vendorHistory.filter(
			(v) => v.status === "failed"
		).length;
		const totalRecords = member.vendorHistory.reduce(
			(s, v) => s + v.recordsProcessed,
			0
		);
		const latest = member.vendorHistory[0];

		return (
			<div className="space-y-4">
				<MetricStrip
					title="Source health"
					items={[
						{
							label: "Feeds",
							value: `${member.vendorHistory.length}`,
						},
						{
							label: "Success",
							value: `${success}`,
							accent: true,
						},
						{ label: "Warning", value: `${warning}` },
						{ label: "Failed", value: `${failed}` },
						{
							label: "Records processed",
							value: totalRecords.toLocaleString("en-US"),
						},
						{
							label: "Primary source",
							value: member.vendorSource,
						},
					]}
				/>

				<div className="grid gap-3 lg:grid-cols-5">
					<Panel
						dense
						title="Latest intake"
						className="lg:col-span-2"
						action={<Building2 className="size-3.5 text-muted-foreground" />}
					>
						{latest ? (
							<div className="space-y-4">
								<div className="rounded-lg border border-border/30 bg-muted/15 p-3.5">
									<p className="text-xs font-medium text-muted-foreground">
										Most recent feed
									</p>
									<p className="mt-1 text-sm font-semibold">{latest.vendor}</p>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{latest.fileFeedType} · {latest.direction}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<MetaField
										label="Last received"
										value={
											<span className="tabular-nums text-sm">
												{latest.lastReceived}
											</span>
										}
									/>
									<MetaField
										label="Status"
										value={<FeedStatusPill status={latest.status} />}
									/>
									<MetaField label="Frequency" value={latest.frequency} />
									<MetaField
										label="Records"
										value={latest.recordsProcessed.toLocaleString("en-US")}
									/>
								</div>
								<p className="text-[11px] leading-relaxed text-muted-foreground">
									Vendor feeds drive eligibility, claims, and encounter updates
									for this member. Failed or warning feeds may delay downstream
									adjudication.
								</p>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No vendor history.
							</p>
						)}
					</Panel>

					<Panel
						dense
						title="Feed history"
						className="lg:col-span-3"
						action={
							<span className="text-[11px] text-muted-foreground">
								{member.vendorHistory.length} sources
							</span>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">
											Vendor / source
										</TableHead>
										<TableHead className="h-9 text-xs">Feed type</TableHead>
										<TableHead className="h-9 text-xs">Direction</TableHead>
										<TableHead className="h-9 text-xs">Frequency</TableHead>
										<TableHead className="h-9 text-right text-xs">
											Records
										</TableHead>
										<TableHead className="h-9 text-xs">Last received</TableHead>
										<TableHead className="h-9 text-xs">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.vendorHistory.map((v) => (
										<TableRow key={v.id}>
											<TableCell className="py-2.5 text-sm font-medium">
												{v.vendor}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{v.fileFeedType}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{v.direction}
											</TableCell>
											<TableCell className="py-2.5 text-sm">
												{v.frequency}
											</TableCell>
											<TableCell className="py-2.5 text-right text-sm tabular-nums">
												{v.recordsProcessed.toLocaleString("en-US")}
											</TableCell>
											<TableCell className="py-2.5 text-sm tabular-nums">
												{v.lastReceived}
											</TableCell>
											<TableCell className="py-2.5">
												<FeedStatusPill status={v.status} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableScroll>
						<p className="mt-3 text-[11px] text-muted-foreground">
							Data as of {member.dataAsOf}
						</p>
					</Panel>
				</div>
			</div>
		);
	}

	if (tab === "Eligibility Exceptions") {
		const open = member.exceptions.filter((e) => e.status === "open");
		const inProgress = member.exceptions.filter(
			(e) => e.status === "in_progress"
		);
		const resolved = member.exceptions.filter((e) => e.status === "resolved");
		const actionNeeded = [...open, ...inProgress];

		return (
			<div className="space-y-4">
				<MetricStrip
					title="Exception health"
					items={[
						{
							label: "Total",
							value: `${member.exceptions.length}`,
						},
						{ label: "Open", value: `${open.length}` },
						{
							label: "In progress",
							value: `${inProgress.length}`,
						},
						{
							label: "Resolved",
							value: `${resolved.length}`,
							accent: true,
						},
						{
							label: "Action needed",
							value: `${actionNeeded.length}`,
						},
						{
							label: "Eligibility",
							value:
								member.eligibilityStatus === "eligible"
									? "Eligible"
									: member.eligibilityStatus,
							accent: member.eligibilityStatus === "eligible",
						},
					]}
				/>

				<div className="grid gap-3 lg:grid-cols-5">
					<Panel
						dense
						title="Needs attention"
						className="lg:col-span-2"
						action={<ShieldAlert className="size-3.5 text-muted-foreground" />}
					>
						{actionNeeded.length === 0 ? (
							<div className="flex flex-col items-center gap-2 py-6 text-center">
								<span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
									<CheckCircle2 className="size-5" />
								</span>
								<p className="text-sm font-medium">No open exceptions</p>
								<p className="text-xs text-muted-foreground">
									All eligibility exceptions are resolved.
								</p>
							</div>
						) : (
							<ul className="space-y-2.5">
								{actionNeeded.map((ex) => (
									<li
										key={ex.id}
										className="rounded-lg border border-border/30 bg-muted/15 px-3 py-2.5"
									>
										<div className="flex items-start justify-between gap-2">
											<p className="text-sm font-medium text-amber-900">
												{ex.exceptionType}
											</p>
											<ExceptionPill status={ex.status} />
										</div>
										<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
											{ex.description}
										</p>
										<p className="mt-1.5 text-[11px] text-muted-foreground">
											Detected {formatDate(ex.startDetected)} · {ex.source}
										</p>
									</li>
								))}
							</ul>
						)}
					</Panel>

					<Panel
						dense
						title="Exception register"
						className="lg:col-span-3"
						action={
							<span className="text-[11px] text-muted-foreground">
								{member.exceptions.length} records
							</span>
						}
					>
						<TableScroll>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Type</TableHead>
										<TableHead className="h-9 text-xs">Description</TableHead>
										<TableHead className="h-9 text-xs">Detected</TableHead>
										<TableHead className="h-9 text-xs">Status</TableHead>
										<TableHead className="h-9 text-xs">Source</TableHead>
										<TableHead className="h-9 text-xs">Resolution</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{member.exceptions.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="h-16 text-center text-sm text-muted-foreground"
											>
												No eligibility exceptions for this member.
											</TableCell>
										</TableRow>
									) : (
										member.exceptions.map((ex) => (
											<TableRow key={ex.id}>
												<TableCell className="py-2.5 text-sm font-medium text-amber-900">
													{ex.exceptionType}
												</TableCell>
												<TableCell className="max-w-[240px] py-2.5 text-sm leading-relaxed">
													{ex.description}
												</TableCell>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(ex.startDetected)}
												</TableCell>
												<TableCell className="py-2.5">
													<ExceptionPill status={ex.status} />
												</TableCell>
												<TableCell className="py-2.5 text-sm">
													{ex.source}
												</TableCell>
												<TableCell className="max-w-[220px] py-2.5 text-sm text-muted-foreground">
													{ex.resolution}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableScroll>
						<p className="mt-3 text-[11px] text-muted-foreground">
							Exceptions may block eligibility confirmation or claims
							adjudication · Data as of {member.dataAsOf}
						</p>
					</Panel>
				</div>
			</div>
		);
	}

	return null;
}
