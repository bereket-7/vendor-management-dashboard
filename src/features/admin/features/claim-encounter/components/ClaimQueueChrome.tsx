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
import { cn } from "@/lib/utils";

export function parseClaimDate(value: string): Date {
	// "2026-07-20 07:14" → Date
	return new Date(`${value.replace(" ", "T")}:00`);
}

/** Age in hours vs reference (defaults to 2026-07-31 noon for stable mock UX). */
export function hoursSince(
	receivedAt: string,
	now = new Date("2026-07-31T12:00:00")
) {
	const ms = now.getTime() - parseClaimDate(receivedAt).getTime();
	return Math.max(0, Math.round(ms / (1000 * 60 * 60)));
}

export function formatWaitLabel(hours: number) {
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
}: {
	search: string;
	onSearchChange: (v: string) => void;
	searchPlaceholder?: string;
	hasActiveFilters: boolean;
	onClear: () => void;
	children?: ReactNode;
}) {
	return (
		<div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
			<div className="flex flex-wrap items-end gap-2">
				<div className="min-w-[180px] flex-1 space-y-1">
					<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Search
					</label>
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder={searchPlaceholder}
							className="h-9 pl-8"
						/>
					</div>
				</div>
				{children}
				{hasActiveFilters ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-9 text-xs"
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
			<label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
