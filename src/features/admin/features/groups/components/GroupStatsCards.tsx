"use client";

import { useTranslations } from "next-intl";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";

import type { GroupModel } from "../types/group.types";

export function GroupStatsCards({ groups }: { groups: GroupModel[] }) {
	const t = useTranslations("Groups.stats");
	const enumerated = groups.filter(
		(g) => g.membershipMode === "enumerated"
	).length;
	const definitional = groups.filter(
		(g) => g.membershipMode === "definitional"
	).length;
	const pending = groups.filter((g) => g.syncStatus === "pending").length;

	return (
		<SummaryCardsGrid columns={3}>
			<SummaryCard label={t("total")} value={groups.length} />
			<SummaryCard
				label={t("byMode")}
				value={
					<span className="text-base font-semibold leading-snug">
						{t("byModeValue", { enumerated, definitional })}
					</span>
				}
			/>
			<SummaryCard label={t("pendingSync")} value={pending} />
		</SummaryCardsGrid>
	);
}
