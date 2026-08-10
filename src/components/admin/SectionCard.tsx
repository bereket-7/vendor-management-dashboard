import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
	title?: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	bodyClassName?: string;
	/** Hide the header bar when title/description/action are absent or set false */
	showHeader?: boolean;
};

/** Contained admin section with border, shadow, and optional titled header. */
export function SectionCard({
	title,
	description,
	action,
	children,
	className,
	bodyClassName,
	showHeader,
}: SectionCardProps) {
	const hasHeader =
		showHeader ?? (title != null || description != null || action != null);

	return (
		<section
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			{hasHeader ? (
				<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
					<div className="min-w-0 space-y-0.5">
						{title != null ? (
							<h2 className="text-sm font-semibold tracking-tight text-foreground">
								{title}
							</h2>
						) : null}
						{description != null ? (
							<p className="text-xs leading-relaxed text-muted-foreground">
								{description}
							</p>
						) : null}
					</div>
					{action ? (
						<div className="flex shrink-0 flex-wrap items-center gap-2">
							{action}
						</div>
					) : null}
				</div>
			) : null}
			<div className={cn("p-4", bodyClassName)}>{children}</div>
		</section>
	);
}

/** Compact shell for data tables — border, radius, and clip for sticky headers. */
export function TableShell({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			{children}
		</div>
	);
}
