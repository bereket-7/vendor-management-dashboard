import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
	eyebrow?: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	className?: string;
};

/** Compact professional page title block used across admin surfaces. */
export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4",
				className
			)}
		>
			<div className="min-w-0 max-w-3xl space-y-1">
				{eyebrow ? (
					<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
						{eyebrow}
					</p>
				) : null}
				<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					{title}
				</h1>
				{description ? (
					<p className="text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{actions}
				</div>
			) : null}
		</div>
	);
}
