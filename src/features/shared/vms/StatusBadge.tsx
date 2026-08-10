import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
	success:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	failed:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	late: "border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	missing:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	warning:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	inbound:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	outbound:
		"border-violet-200/80 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
	processing:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	// vendor
	prospect:
		"border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
	invited:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	onboarding:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	under_review:
		"border-violet-200/80 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
	active:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	suspended:
		"border-orange-200/80 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
	offboarded:
		"border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
	at_risk:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	inactive:
		"border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
	// shared
	draft:
		"border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
	pending:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	pending_approval:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	approved:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	rejected:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	expired:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	expiring:
		"border-orange-200/80 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
	valid:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	published:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	closed:
		"border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
	evaluating:
		"border-violet-200/80 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
	awarded:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	cancelled:
		"border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
	sent: "border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	acknowledged:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	partially_received:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	received:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	submitted:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	matched:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	exception:
		"border-orange-200/80 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
	disputed:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	paid: "border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	in_progress:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	not_started:
		"border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
	changes_requested:
		"border-orange-200/80 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
	terminated:
		"border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
	low: "border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	medium:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	high: "border-orange-200/80 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
	critical:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	// claim / encounter display labels
	accepted:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	denied:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	partial:
		"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	open: "border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	complete:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	completed:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	error:
		"border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	processed:
		"border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

function normalizeStatusKey(status: string) {
	return status
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "_");
}

function formatLabel(status: string) {
	return status.replace(/_/g, " ");
}

type StatusBadgeProps = {
	status: string;
	className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const key = normalizeStatusKey(status);
	const style = STATUS_STYLES[key] ?? STATUS_STYLES.draft;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize leading-none tracking-wide",
				style,
				className
			)}
		>
			{formatLabel(status)}
		</span>
	);
}
