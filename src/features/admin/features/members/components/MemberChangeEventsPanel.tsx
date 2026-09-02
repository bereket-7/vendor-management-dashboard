"use client";

import { useMemo, useState } from "react";

import { Eye, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { useMemberChangeEventsQuery } from "@/features/admin/features/members/feature/queries/useMembersQuery";
import type { MemberChangeEventRow } from "@/features/admin/features/members/map-member-core";
import {
	CATEGORY_CHIPS,
	type ChangeEventCategoryFilter,
	summarizeChangeEvents,
} from "@/features/admin/features/members/member-change-events-mock";
import { cn } from "@/lib/utils";

function ChangeTypePill({
	type,
}: {
	type: MemberChangeEventRow["changeType"];
}) {
	const styles = {
		Update: "bg-sky-500/15 text-sky-900 dark:text-sky-200",
		Add: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200",
		Remove: "bg-red-500/15 text-red-900 dark:text-red-200",
	};
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
				styles[type]
			)}
		>
			{type}
		</span>
	);
}

function ValuePill({ value, tone }: { value: string; tone: "old" | "new" }) {
	return (
		<span
			className={cn(
				"inline-block max-w-[140px] truncate rounded px-1.5 py-0.5 text-[11px]",
				tone === "old"
					? "bg-red-500/10 text-red-900 dark:text-red-200"
					: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
			)}
			title={value}
		>
			{value}
		</span>
	);
}

export function MemberChangeEventsPanel({ memberId }: { memberId: string }) {
	const query = useMemberChangeEventsQuery(memberId, true);
	const rows = query.data ?? [];

	const [categoryFilter, setCategoryFilter] =
		useState<ChangeEventCategoryFilter>("all");
	const [sourceFilter, setSourceFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [detailRow, setDetailRow] = useState<MemberChangeEventRow | null>(null);

	const summary = useMemo(() => summarizeChangeEvents(rows), [rows]);

	const sources = useMemo(
		() => Array.from(new Set(rows.map((r) => r.source))).sort(),
		[rows]
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (categoryFilter !== "all" && row.category !== categoryFilter) {
				return false;
			}
			if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
			if (typeFilter !== "all" && row.changeType !== typeFilter) return false;
			if (!q) return true;
			return (
				row.fieldName.toLowerCase().includes(q) ||
				row.reason.toLowerCase().includes(q) ||
				row.oldValue.toLowerCase().includes(q) ||
				row.newValue.toLowerCase().includes(q) ||
				row.changedBy.toLowerCase().includes(q)
			);
		});
	}, [rows, categoryFilter, sourceFilter, typeFilter, search]);

	if (query.isLoading) {
		return (
			<section className="rounded-xl border border-border/40 bg-card p-4 shadow-sm">
				<p className="text-sm text-muted-foreground">Loading change events…</p>
			</section>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
					<p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
						Total Changes
					</p>
					<p className="mt-1 text-2xl font-semibold tabular-nums">
						{summary.total}
					</p>
					<p className="text-xs text-muted-foreground">All time</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
					<p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
						Last 30 Days
					</p>
					<p className="mt-1 flex items-baseline gap-2 text-2xl font-semibold tabular-nums">
						{summary.last30Days}
						<span className="text-xs font-semibold text-emerald-600">
							+ {summary.last30TrendPct}%
						</span>
					</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
					<p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
						Most Recent Change
					</p>
					<p className="mt-1 text-sm font-semibold">{summary.mostRecent}</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
					<p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
						Changed By
					</p>
					<p className="mt-1 text-sm font-semibold">{summary.changedBy}</p>
					<p className="text-xs text-muted-foreground">Source system</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
					<p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
						Change Types
					</p>
					<p className="mt-1 text-2xl font-semibold tabular-nums">
						{summary.uniqueChangeTypes}
					</p>
					<p className="text-xs text-muted-foreground">Unique fields changed</p>
				</div>
			</div>

			<section className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
				<div className="flex flex-wrap gap-1.5 border-b border-border/40 p-3">
					<button
						type="button"
						onClick={() => setCategoryFilter("all")}
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
							categoryFilter === "all"
								? "bg-primary text-primary-foreground"
								: "bg-muted/60 text-muted-foreground hover:bg-muted"
						)}
					>
						All Types
					</button>
					{CATEGORY_CHIPS.map((chip) => (
						<button
							key={chip}
							type="button"
							onClick={() => setCategoryFilter(chip)}
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
								categoryFilter === chip
									? "bg-primary text-primary-foreground"
									: "bg-muted/60 text-muted-foreground hover:bg-muted"
							)}
						>
							{chip}
						</button>
					))}
				</div>

				<div className="mx-3 mt-3 rounded-lg border-2 border-primary bg-primary/5 p-3">
					<div className="flex flex-wrap items-center gap-2">
						<div className="relative min-w-[200px] flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search change events…"
								className="h-8 border-primary/30 bg-background pl-8 text-xs"
							/>
						</div>
						<Select value={sourceFilter} onValueChange={setSourceFilter}>
							<SelectTrigger className="h-8 w-[150px] border-primary/30 bg-background text-xs">
								<SelectValue placeholder="All sources" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All sources</SelectItem>
								{sources.map((source) => (
									<SelectItem key={source} value={source}>
										{source}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="h-8 w-[150px] border-primary/30 bg-background text-xs">
								<SelectValue placeholder="All change types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All change types</SelectItem>
								<SelectItem value="Update">Update</SelectItem>
								<SelectItem value="Add">Add</SelectItem>
								<SelectItem value="Remove">Remove</SelectItem>
							</SelectContent>
						</Select>
						<span className="text-xs font-medium text-primary">
							Last 90 days
						</span>
					</div>
				</div>

				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="text-[11px] font-bold uppercase">
									Change Date
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Change Type
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Field Changed
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Old Value
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									New Value
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Reason
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Changed By
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Source
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Effective Date
								</TableHead>
								<TableHead className="text-[11px] font-bold uppercase">
									Details
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-16 text-center text-sm text-muted-foreground"
									>
										No change events match your filters.
									</TableCell>
								</TableRow>
							) : (
								filtered.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="whitespace-nowrap text-xs">
											{row.changeDate}
										</TableCell>
										<TableCell>
											<ChangeTypePill type={row.changeType} />
										</TableCell>
										<TableCell className="max-w-[160px]">
											<p className="truncate text-xs font-medium">
												{row.fieldName}
											</p>
											{row.fieldReason ? (
												<p className="truncate text-[10px] text-muted-foreground">
													{row.fieldReason}
												</p>
											) : null}
										</TableCell>
										<TableCell>
											<ValuePill value={row.oldValue} tone="old" />
										</TableCell>
										<TableCell>
											<ValuePill value={row.newValue} tone="new" />
										</TableCell>
										<TableCell
											className="max-w-[180px] truncate text-xs"
											title={row.reason}
										>
											{row.reason}
										</TableCell>
										<TableCell className="whitespace-nowrap text-xs">
											{row.changedBy}
										</TableCell>
										<TableCell
											className="max-w-[140px] truncate text-xs text-muted-foreground"
											title={row.source}
										>
											{row.source}
										</TableCell>
										<TableCell className="whitespace-nowrap text-xs">
											{row.effectiveDate}
										</TableCell>
										<TableCell>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-7 gap-1 px-2 text-xs"
												onClick={() => setDetailRow(row)}
											>
												<Eye className="size-3.5" />
												View
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</section>

			<Dialog open={Boolean(detailRow)} onOpenChange={() => setDetailRow(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Change event details</DialogTitle>
					</DialogHeader>
					{detailRow ? (
						<dl className="grid gap-2 text-sm">
							{[
								["Change date", detailRow.changeDate],
								["Change type", detailRow.changeType],
								["Field", detailRow.fieldName],
								["Old value", detailRow.oldValue],
								["New value", detailRow.newValue],
								["Reason", detailRow.reason],
								["Changed by", detailRow.changedBy],
								["Source", detailRow.source],
								["Effective date", detailRow.effectiveDate],
							].map(([label, value]) => (
								<div key={label} className="grid grid-cols-3 gap-2">
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="col-span-2 font-medium">{value}</dd>
								</div>
							))}
						</dl>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
