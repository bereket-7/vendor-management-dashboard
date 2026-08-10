import type { ProgramFileType } from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";

import type { ComplianceProgramPageConfig } from "./config";
import type { ComplianceProgramRow } from "./mock-data";

function hashSlug(slug: string) {
	let n = 0;
	for (let i = 0; i < slug.length; i += 1) {
		n = (n + slug.charCodeAt(i) * (i + 1)) % 997;
	}
	return n;
}

export type TrendPoint = {
	label: string;
	value: number;
	secondary?: number;
};

export type NamedValue = { name: string; value: number; hint?: string };

export type MeasureTile = {
	id: string;
	label: string;
	actual: number;
	target: number;
	unit: "%" | "count";
	status: "on-track" | "at-risk" | "gap";
};

export type TimelineItem = {
	id: string;
	title: string;
	subtitle: string;
	when: string;
	status: string;
};

export type ScorecardItem = {
	vendor: string;
	turnaroundDays: number;
	denialRate: number;
	volume: number;
};

export type SplitCompareItem = {
	label: string;
	leftLabel: string;
	leftValue: number;
	rightLabel: string;
	rightValue: number;
};

export type PageAnalytics = {
	trend: TrendPoint[];
	statusMix: NamedValue[];
	vendorBars: NamedValue[];
	insights: { title: string; body: string; tone: string }[];
	measures: MeasureTile[];
	timeline: TimelineItem[];
	findings: NamedValue[];
	codes: NamedValue[];
	scorecards: ScorecardItem[];
	calendarDays: { day: number; count: number; tone: "due" | "done" | "upcoming" }[];
	splitCompare: SplitCompareItem[];
	capUsedPct: number;
	capAlertCount: number;
};

const INSIGHT_TONES = [
	"border-primary/25 bg-primary/5",
	"border-amber-500/25 bg-amber-500/5",
	"border-emerald-500/25 bg-emerald-500/5",
	"border-violet-500/25 bg-violet-500/5",
];

export function analyticsForPage(
	config: ComplianceProgramPageConfig,
	program: ProgramFileType,
	rows: ComplianceProgramRow[]
): PageAnalytics {
	const seed = hashSlug(config.slug);
	const vendors =
		VENDOR_NAMES.length > 0
			? VENDOR_NAMES.slice(0, 5)
			: ["UST Healthcare", "Availity", "Change Healthcare", "Optum", "Cigna"];

	const trend = Array.from({ length: 7 }, (_, i) => ({
		label: `Jul ${14 + i}`,
		value: 18 + ((seed + i * 11) % 24),
		secondary: 12 + ((seed + i * 7) % 16),
	}));

	const statusMix = (config.statusOptions ?? [])
		.map((name, i) => ({
			name,
			value: Math.max(1, rows.filter((r) => r.status === name).length + (i % 3)),
		}))
		.filter((d) => d.value > 0);

	const vendorBars = vendors.map((vendor, i) => ({
		name: vendor.length > 12 ? `${vendor.slice(0, 11)}…` : vendor,
		value: 62 + ((seed + i * 13) % 34),
		hint: vendor,
	}));

	const measures: MeasureTile[] = [
		{
			id: "m1",
			label: config.slug.includes("hedis") ? "CBP — Blood Pressure" : "Cardiovascular",
			actual: 74 + (seed % 12),
			target: 80,
			unit: "%",
			status: "at-risk",
		},
		{
			id: "m2",
			label: config.slug.includes("hedis") ? "GSD — Diabetes A1c" : "Diabetes",
			actual: 81 + (seed % 8),
			target: 78,
			unit: "%",
			status: "on-track",
		},
		{
			id: "m3",
			label: config.slug.includes("hedis") ? "WCC — Weight Counseling" : "Respiratory",
			actual: 66 + (seed % 10),
			target: 75,
			unit: "%",
			status: "gap",
		},
		{
			id: "m4",
			label: config.slug.includes("hedis") ? "PPC — Prenatal Care" : "Behavioral",
			actual: 88 + (seed % 6),
			target: 85,
			unit: "%",
			status: "on-track",
		},
	];

	const timeline: TimelineItem[] = rows.slice(0, 5).map((row, i) => ({
		id: row.id,
		title: row.title,
		subtitle: `${row.vendor} · ${row.referenceId}`,
		when: row.lastUpdated,
		status: row.status,
	}));

	const findings: NamedValue[] = [
		{ name: "Critical", value: 1 + (seed % 2) },
		{ name: "High", value: 2 + (seed % 3) },
		{ name: "Medium", value: 4 + (seed % 4) },
		{ name: "Low", value: 3 + (seed % 2) },
	];

	const codes: NamedValue[] = [
		{ name: "CO-16", value: 14 + (seed % 8), hint: "Missing information" },
		{ name: "CO-97", value: 9 + (seed % 5), hint: "Payment adjusted" },
		{ name: "N706", value: 6 + (seed % 4), hint: "Missing provider ID" },
		{ name: "MA130", value: 4 + (seed % 3), hint: "Spend down" },
	];

	const scorecards: ScorecardItem[] = vendors.slice(0, 4).map((vendor, i) => ({
		vendor,
		turnaroundDays: 2 + ((seed + i) % 6),
		denialRate: 3 + ((seed + i * 5) % 12),
		volume: 40 + ((seed + i * 9) % 80),
	}));

	const calendarDays = Array.from({ length: 31 }, (_, i) => {
		const day = i + 1;
		const count = (seed + day) % 5;
		const tone =
			count === 0 ? "upcoming" : count > 2 ? "due" : ("done" as const);
		return { day, count, tone };
	});

	const splitCompare: SplitCompareItem[] = [
		{
			label: "Acceptance rate",
			leftLabel: "Inbound",
			leftValue: 88 + (seed % 8),
			rightLabel: "Outbound",
			rightValue: 92 + (seed % 6),
		},
		{
			label: "Exception rate",
			leftLabel: "Inbound",
			leftValue: 6 + (seed % 4),
			rightLabel: "Outbound",
			rightValue: 4 + (seed % 3),
		},
	];

	const topVendor = vendorBars.sort((a, b) => b.value - a.value)[0];
	const riskRows = rows.filter((r) =>
		/reject|exception|overdue|denied|finding|late|cap alert|gap|at risk/i.test(r.status)
	).length;

	const insights = [
		{
			title: `${program} program scope`,
			body: `${rows.length} active ${config.rowNoun}s tracked with ${riskRows} flagged for follow-up in the current window.`,
			tone: INSIGHT_TONES[0]!,
		},
		topVendor
			? {
					title: "Top performer",
					body: `${topVendor.hint ?? topVendor.name} leads at ${topVendor.value}% against the selected filters.`,
					tone: INSIGHT_TONES[2]!,
				}
			: null,
		{
			title: config.slug.includes("audit")
				? "Remediation window"
				: config.slug.includes("calendar")
					? "Next critical date"
					: "Watch list",
			body: config.slug.includes("calendar")
				? "3 regulatory filings are due within the next 7 days across vendors."
				: config.slug.includes("behavioral")
					? "Carve-out vendor exception rate is 2.4 pts above plan average."
					: `${riskRows} items need review before the next vendor cutoff.`,
			tone: INSIGHT_TONES[1]!,
		},
	].filter(Boolean) as PageAnalytics["insights"];

	return {
		trend,
		statusMix,
		vendorBars,
		insights,
		measures,
		timeline,
		findings,
		codes,
		scorecards,
		calendarDays,
		splitCompare,
		capUsedPct: 68 + (seed % 22),
		capAlertCount: rows.filter((r) => /cap alert/i.test(r.status)).length || 2,
	};
}
