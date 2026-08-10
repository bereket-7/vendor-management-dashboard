"use client";

import { useMemo, useState, type ReactNode } from "react";

import {
	Accessibility,
	Activity,
	Brain,
	CalendarDays,
	ClipboardCheck,
	FileBarChart2,
	HeartPulse,
	Home,
	Hospital,
	Scale,
	ShieldCheck,
	Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import {
	ClaimKpiGrid,
	ClaimPageHeader,
} from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import { ComplianceFilterBar } from "@/features/admin/features/claim-encounter/compliance-program/ComplianceFilterBar";
import { CompliancePageSection } from "@/features/admin/features/claim-encounter/compliance-program/CompliancePageSections";
import { ComplianceQueueTable } from "@/features/admin/features/claim-encounter/compliance-program/ComplianceQueueTable";
import type {
	ComplianceProgramIconKey,
	ComplianceSectionConfig,
} from "@/features/admin/features/claim-encounter/compliance-program/config";
import { getComplianceProgramPage } from "@/features/admin/features/claim-encounter/compliance-program/config";
import {
	filterChipsForPage,
	filterExportLabel,
	filterPlaceholder,
	filterRows,
} from "@/features/admin/features/claim-encounter/compliance-program/filter-utils";
import { analyticsForPage } from "@/features/admin/features/claim-encounter/compliance-program/mock-analytics";
import {
	rowsForComplianceProgramPage,
	statsForRows,
} from "@/features/admin/features/claim-encounter/compliance-program/mock-data";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PAGE_ICONS: Record<ComplianceProgramIconKey, LucideIcon> = {
	"shield-check": ShieldCheck,
	"file-bar-chart-2": FileBarChart2,
	stethoscope: Stethoscope,
	scale: Scale,
	"clipboard-check": ClipboardCheck,
	"calendar-days": CalendarDays,
	activity: Activity,
	accessibility: Accessibility,
	home: Home,
	"heart-pulse": HeartPulse,
	hospital: Hospital,
	brain: Brain,
};

const PAIRABLE_SECTIONS = new Set([
	"trend-chart",
	"vendor-bars",
	"findings",
	"timeline",
	"cap-gauge",
	"code-ranking",
	"split-compare",
]);

type LayoutContext = {
	analytics: ReturnType<typeof analyticsForPage>;
	config: NonNullable<ReturnType<typeof getComplianceProgramPage>>;
	filteredRows: ReturnType<typeof rowsForComplianceProgramPage>;
};

function renderSectionBlock(
	section: ComplianceSectionConfig,
	ctx: LayoutContext,
	variant?: "default" | "sidebar" | "compact"
) {
	if (section.kind === "queue-table") {
		return (
			<ComplianceQueueTable
				key={section.kind + section.title}
				config={ctx.config}
				rows={ctx.filteredRows}
				title={section.title}
			/>
		);
	}
	return (
		<CompliancePageSection
			key={section.kind + section.title + (variant ?? "default")}
			section={section}
			analytics={ctx.analytics}
			variant={variant}
		/>
	);
}

function AnalyticsSections({
	sections,
	ctx,
}: {
	sections: ComplianceSectionConfig[];
	ctx: LayoutContext;
}) {
	const blocks: ReactNode[] = [];
	let pairBuffer: ComplianceSectionConfig[] = [];

	const flushPair = () => {
		if (pairBuffer.length === 0) return;
		if (pairBuffer.length === 1) {
			blocks.push(renderSectionBlock(pairBuffer[0]!, ctx));
		} else {
			blocks.push(
				<div
					key={`pair-${pairBuffer.map((s) => s.title).join("-")}`}
					className="grid items-start gap-4 lg:grid-cols-2"
				>
					{pairBuffer.map((section) =>
						renderSectionBlock(section, ctx, "compact")
					)}
				</div>
			);
		}
		pairBuffer = [];
	};

	for (const section of sections) {
		if (PAIRABLE_SECTIONS.has(section.kind)) {
			pairBuffer.push(section);
			if (pairBuffer.length === 2) flushPair();
			continue;
		}
		flushPair();
		blocks.push(renderSectionBlock(section, ctx));
	}
	flushPair();

	return <>{blocks}</>;
}

function SectionLayout({
	sections,
	ctx,
}: {
	sections: ComplianceSectionConfig[];
	ctx: LayoutContext;
}) {
	const tableSection = sections.find((s) => s.kind === "queue-table");
	const pieSection = sections.find((s) => s.kind === "status-mix");
	const analyticsSections = sections.filter(
		(s) => s.kind !== "queue-table" && s.kind !== "status-mix"
	);

	return (
		<div className="space-y-4">
			{tableSection ? (
				<div
					className={cn(
						"grid gap-4",
						pieSection
							? "items-start xl:grid-cols-[minmax(0,1fr)_320px]"
							: "grid-cols-1"
					)}
				>
					<div className="min-w-0">
						{renderSectionBlock(tableSection, ctx)}
					</div>
					{pieSection ? (
						<div className="min-w-0 xl:sticky xl:top-4">
							{renderSectionBlock(pieSection, ctx, "sidebar")}
						</div>
					) : null}
				</div>
			) : null}

			{analyticsSections.length > 0 ? (
				<AnalyticsSections sections={analyticsSections} ctx={ctx} />
			) : null}
		</div>
	);
}

export function ComplianceProgramPage({ slug }: { slug: string }) {
	const config = getComplianceProgramPage(slug)!;
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [status, setStatus] = useState("all");
	const [search, setSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const baseRows = useMemo(
		() => rowsForComplianceProgramPage(config, programFilter),
		[config, programFilter]
	);

	const filteredRows = useMemo(
		() => filterRows(baseRows, { vendor, status, search }),
		[baseRows, vendor, status, search]
	);

	const filterChips = useMemo(
		() => filterChipsForPage(config, baseRows),
		[config, baseRows]
	);

	const stats = useMemo(() => statsForRows(baseRows, config), [baseRows, config]);

	const analytics = useMemo(
		() => analyticsForPage(config, programFilter, baseRows),
		[config, programFilter, baseRows]
	);

	const Icon = PAGE_ICONS[config.iconKey] ?? ShieldCheck;
	const layoutCtx: LayoutContext = {
		analytics,
		config,
		filteredRows,
	};

	function handleRefresh() {
		setRefreshing(true);
		window.setTimeout(() => {
			setRefreshing(false);
			toast.success(`${config.title} refreshed`);
		}, 600);
	}

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title={config.title}
				description={config.description}
			/>

			<ClaimKpiGrid
				items={stats.map((item) => ({
					label: item.label,
					value: formatCount(item.value),
					hint: programFilter,
					icon: Icon,
					tone:
						item.label === config.kpiLabels[3]
							? "text-red-700 bg-red-500/15 ring-red-500/20"
							: item.label === config.kpiLabels[1]
								? "text-emerald-700 bg-emerald-500/15 ring-emerald-500/20"
								: "text-primary bg-primary/10 ring-primary/20",
				}))}
			/>

			<ComplianceFilterBar
				chips={filterChips}
				status={status}
				onStatusChange={(value) => {
					setStatus(value);
				}}
				vendor={vendor}
				onVendorChange={setVendor}
				search={search}
				onSearchChange={setSearch}
				searchPlaceholder={filterPlaceholder(config)}
				exportLabel={filterExportLabel(config)}
				onExport={() => toast.success("Export queued")}
				onRefresh={handleRefresh}
				refreshing={refreshing}
			/>

			<SectionLayout sections={config.sections ?? []} ctx={layoutCtx} />
		</div>
	);
}
