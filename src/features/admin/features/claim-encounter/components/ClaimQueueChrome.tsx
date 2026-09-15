"use client";

import { type ReactNode, useEffect, useMemo } from "react";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

export function parseClaimDate(value: string): Date {
	if (!value?.trim()) return new Date(Number.NaN);
	const trimmed = value.trim();
	// Live ISO / RFC3339 (do not append ":00")
	if (
		trimmed.includes("T") ||
		/[zZ]$/.test(trimmed) ||
		/[+-]\d{2}:\d{2}$/.test(trimmed)
	) {
		return new Date(trimmed);
	}
	// Mock fixture style: "2026-07-20 07:14"
	return new Date(`${trimmed.replace(" ", "T")}:00`);
}

/** Age in hours. Mock fixtures use a fixed "now"; live uses wall clock. */
export function hoursSince(
	receivedAt: string,
	now = isMockEnabled() ? new Date("2026-07-31T12:00:00") : new Date()
) {
	const received = parseClaimDate(receivedAt);
	if (Number.isNaN(received.getTime())) return 0;
	const ms = now.getTime() - received.getTime();
	if (!Number.isFinite(ms)) return 0;
	return Math.max(0, Math.round(ms / (1000 * 60 * 60)));
}

export function formatWaitLabel(hours: number) {
	if (!Number.isFinite(hours) || hours < 0) return "—";
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	const rem = hours % 24;
	return rem ? `${days}d ${rem}h` : `${days}d`;
}

export function pct(n: number, d: number) {
	return d ? Math.round((n / d) * 1000) / 10 : 0;
}

export function usePagedRows<T>(
	rows: T[],
	pageSize: number,
	page: number,
	setPage: (n: number | ((p: number) => number)) => void
) {
	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
	const safePage = Math.min(page, pageCount);

	useEffect(() => {
		if (page !== safePage) setPage(safePage);
	}, [page, safePage, setPage]);

	const pageRows = useMemo(
		() => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
		[rows, safePage, pageSize]
	);

	return { pageRows, pageCount, safePage };
}

export function ClaimTablePagination({
	total,
	page,
	pageSize,
	pageCount,
	onPageChange,
	onPageSizeChange,
	noun = "results",
}: {
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
	onPageChange: (page: number | ((p: number) => number)) => void;
	onPageSizeChange?: (size: number) => void;
	noun?: string;
}) {
	const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);
	const pageNumbers = useMemo(() => {
		const maxButtons = 5;
		if (pageCount <= maxButtons) {
			return Array.from({ length: pageCount }, (_, i) => i + 1);
		}
		const start = Math.max(1, Math.min(page - 2, pageCount - maxButtons + 1));
		return Array.from({ length: maxButtons }, (_, i) => start + i);
	}, [page, pageCount]);

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-3 py-2.5 text-sm text-muted-foreground sm:px-4">
			<p className="text-xs sm:text-sm">
				Showing{" "}
				<span className="font-medium tabular-nums text-foreground">{from}</span>
				–<span className="font-medium tabular-nums text-foreground">{to}</span>{" "}
				of{" "}
				<span className="font-medium tabular-nums text-foreground">
					{total}
				</span>{" "}
				{noun}
			</p>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={page <= 1}
					onClick={() => onPageChange((p) => Math.max(1, p - 1))}
					aria-label="Previous page"
				>
					<ChevronLeft className="size-4" />
				</Button>
				{pageNumbers.map((num) => (
					<Button
						key={num}
						variant={num === page ? "default" : "outline"}
						size="sm"
						className="size-8 p-0"
						onClick={() => onPageChange(num)}
					>
						{num}
					</Button>
				))}
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={page >= pageCount}
					onClick={() => onPageChange((p) => Math.min(pageCount, p + 1))}
					aria-label="Next page"
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>
			{onPageSizeChange ? (
				<div className="flex items-center gap-2">
					<span className="text-xs">Rows</span>
					<Select
						value={String(pageSize)}
						onValueChange={(v) => onPageSizeChange(Number(v))}
					>
						<SelectTrigger className="h-8 w-[72px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[5, 10, 25, 50].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</div>
	);
}

export function ClaimFilterBar({
	search,
	onSearchChange,
	searchPlaceholder = "Search…",
	hasActiveFilters,
	onClear,
	children,
	className,
	tone = "default",
}: {
	search: string;
	onSearchChange: (v: string) => void;
	searchPlaceholder?: string;
	hasActiveFilters: boolean;
	onClear: () => void;
	children?: ReactNode;
	className?: string;
	tone?: "default" | "primary";
}) {
	const primary = tone === "primary";

	return (
		<div
			data-tone={tone}
			className={cn(
				"group",
				primary
					? cn(
							"rounded-sm border border-primary/20 bg-primary p-3.5 text-primary-foreground shadow-[0_1px_3px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)] sm:p-4",
							"[&_[role=combobox]]:border-primary-foreground/25 [&_[role=combobox]]:bg-primary-foreground/10 [&_[role=combobox]]:text-primary-foreground [&_[role=combobox]]:shadow-none",
							"[&_[role=combobox]]:hover:bg-primary-foreground/15 [&_[role=combobox]]:hover:text-primary-foreground",
							"[&_[role=combobox]]:focus:ring-primary-foreground/20 [&_[role=combobox]]:data-[placeholder]:text-primary-foreground/55",
							"[&_[role=combobox]_svg]:text-primary-foreground/60"
						)
					: "rounded-xl border border-border bg-card p-3.5 shadow-sm",
				className
			)}
		>
			<div className="flex flex-wrap items-end gap-2">
				<div className="min-w-[180px] flex-1 space-y-1">
					<label
						className={cn(
							"text-[11px] font-semibold uppercase tracking-[0.08em]",
							primary ? "text-primary-foreground/70" : "text-muted-foreground"
						)}
					>
						Search
					</label>
					<div className="relative">
						<Search
							className={cn(
								"pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2",
								primary ? "text-primary-foreground/55" : "text-muted-foreground"
							)}
						/>
						<Input
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder={searchPlaceholder}
							className={cn(
								"h-9 pl-8",
								primary &&
									"border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground shadow-none placeholder:text-primary-foreground/45 focus-visible:border-primary-foreground/40 focus-visible:ring-primary-foreground/20"
							)}
						/>
					</div>
				</div>
				{children}
				{hasActiveFilters ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={cn(
							"h-9 text-xs",
							primary &&
								"text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
						)}
						onClick={onClear}
					>
						<X className="mr-1 size-3.5" />
						Clear
					</Button>
				) : null}
			</div>
		</div>
	);
}

export function ClaimSectionCard({
	title,
	description,
	action,
	children,
	className,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
				<div className="min-w-0 space-y-0.5">
					<p className="text-sm font-semibold tracking-tight text-foreground">
						{title}
					</p>
					{description ? (
						<p className="text-xs leading-relaxed text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{action}
			</div>
			<div className="p-4">{children}</div>
		</section>
	);
}

export function FilterField({
	label,
	children,
	className,
}: {
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-w-[140px] space-y-1", className)}>
			<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground group-data-[tone=primary]:text-primary-foreground/70">
				{label}
			</label>
			{children}
		</div>
	);
}

export function MetricBar({
	label,
	value,
	max,
	suffix,
	tone = "bg-primary",
}: {
	label: string;
	value: number;
	max: number;
	suffix?: string;
	tone?: string;
}) {
	const width = max > 0 ? Math.max(4, (value / max) * 100) : 0;
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between gap-2 text-xs">
				<span className="truncate font-medium">{label}</span>
				<span className="shrink-0 tabular-nums text-muted-foreground">
					{value.toLocaleString()}
					{suffix ? ` ${suffix}` : ""}
				</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full transition-all", tone)}
					style={{ width: `${width}%` }}
				/>
			</div>
		</div>
	);
}
