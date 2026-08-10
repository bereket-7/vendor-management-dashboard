"use client";

import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SummaryCardProps = {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon?: LucideIcon;
	/** Icon well classes, e.g. `text-sky-700 bg-sky-500/10` */
	tone?: string;
	hintClassName?: string;
	className?: string;
};

export function SummaryCard({
	label,
	value,
	hint,
	icon: Icon,
	tone = "text-primary bg-primary/10",
	hintClassName,
	className,
}: SummaryCardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors",
				className
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						{label}
					</p>
					<p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
						{value}
					</p>
					{hint != null && hint !== "" ? (
						<p
							className={cn(
								"mt-1.5 text-xs leading-snug text-muted-foreground",
								hintClassName
							)}
						>
							{hint}
						</p>
					) : null}
				</div>
				{Icon ? (
					<div
						className={cn(
							"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
							tone
						)}
					>
						<Icon className="size-[18px]" aria-hidden />
					</div>
				) : null}
			</div>
		</div>
	);
}

export type SummaryCardsGridProps = {
	children: ReactNode;
	/** Max columns at xl breakpoint. Defaults to 6. */
	columns?: 2 | 3 | 4 | 5 | 6;
	className?: string;
};

const GRID_COLS: Record<
	NonNullable<SummaryCardsGridProps["columns"]>,
	string
> = {
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-2 lg:grid-cols-3",
	4: "sm:grid-cols-2 lg:grid-cols-4",
	5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
	6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

export function SummaryCardsGrid({
	children,
	columns = 6,
	className,
}: SummaryCardsGridProps) {
	return (
		<div className={cn("grid gap-3", GRID_COLS[columns], className)}>
			{children}
		</div>
	);
}
