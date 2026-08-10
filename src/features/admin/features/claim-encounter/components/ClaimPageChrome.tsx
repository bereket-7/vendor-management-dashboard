"use client";

import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";

export type ClaimKpiItem = {
	label: string;
	value: string;
	hint: string;
	icon: LucideIcon;
	tone: string;
};

export function ClaimPageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description: string;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
			<div className="min-w-0 max-w-3xl space-y-1">
				<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					{title}
				</h1>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
			{actions ? (
				<div className="flex flex-wrap items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}

export function ClaimKpiGrid({ items }: { items: ClaimKpiItem[] }) {
	return (
		<SummaryCardsGrid>
			{items.map((k) => (
				<SummaryCard
					key={k.label}
					label={k.label}
					value={k.value}
					hint={k.hint}
					icon={k.icon}
					tone={k.tone}
				/>
			))}
		</SummaryCardsGrid>
	);
}
