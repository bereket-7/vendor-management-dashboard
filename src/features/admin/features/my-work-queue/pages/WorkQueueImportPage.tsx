"use client";

import { useCallback, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	FileSpreadsheet,
	Layers,
	Plus,
	RefreshCw,
	Sparkles,
	Trash2,
	Truck,
	Upload,
	Warehouse,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Link, useRouter } from "@/i18n/navigation";
import { downloadCsv } from "@/lib/export/csv";
import { cn } from "@/lib/utils";

import {
	useImportWorkQueueSpreadsheetMutation,
	useInvalidateVendorCore,
} from "../feature/queries/useWorkQueueQuery";
import { workQueueErrorMessage } from "../feature/workQueueErrors";
import {
	SAMPLE_IMPORT_ROWS,
	WORK_QUEUE_IMPORT_COLUMNS,
	WORK_QUEUE_SERVER_TYPE_OPTIONS,
	type WorkQueueImportColumn,
	type WorkQueueImportRowDraft,
	collectDuplicateCodeKeys,
	createBlankImportRowDraft,
	createImportFileFromRows,
	parseWorkQueueCsv,
	validateImportRow,
} from "../lib/work-queue-import";

const FLAT_CARD_CLASS =
	"overflow-hidden rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const COLUMN_LABELS: Record<WorkQueueImportColumn, string> = {
	code: "Code",
	name: "Name",
	vendor_type: "Type",
	wave: "Wave",
	server_type: "Server",
	notes: "Notes",
	primary_contact: "Primary contact",
	primary_email: "Email",
	primary_phone: "Phone",
	next_step: "Next step",
};

const REQUIRED_IMPORT_COLUMNS: WorkQueueImportColumn[] = [
	"code",
	"name",
	"vendor_type",
];

const thClass =
	"px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap";

const fieldClass =
	"h-8 rounded-sm border-border bg-background text-xs shadow-none hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

type ImportRowEditorProps = {
	row: WorkQueueImportRowDraft;
	index: number;
	issues: ReturnType<typeof validateImportRow>;
	onUpdate: (patch: Partial<WorkQueueImportRowDraft>) => void;
	onRemove: () => void;
};

function ImportRowEditor({
	row,
	index,
	issues,
	onUpdate,
	onRemove,
}: ImportRowEditorProps) {
	const hasIssues = issues.length > 0;
	const vendorType = row.vendor_type.trim().toLowerCase();
	const serverIsPreset =
		row.server_type &&
		(WORK_QUEUE_SERVER_TYPE_OPTIONS as readonly string[]).includes(
			row.server_type
		);

	return (
		<tr
			className={cn(
				"border-b border-border/40 align-top transition-colors",
				hasIssues && "bg-amber-500/[0.04]"
			)}
		>
			<td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
				{index + 1}
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.code}
					onChange={(e) => onUpdate({ code: e.target.value })}
					className={cn(fieldClass, "min-w-[108px] font-mono text-[11px]")}
					placeholder="TPA-1001"
					aria-label="Code"
				/>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.name}
					onChange={(e) => onUpdate({ name: e.target.value })}
					className={cn(fieldClass, "min-w-[140px]")}
					placeholder="Vendor name"
					aria-label="Name"
				/>
			</td>
			<td className="px-2 py-1.5">
				<Select
					value={vendorType || undefined}
					onValueChange={(value) => onUpdate({ vendor_type: value })}
				>
					<SelectTrigger
						className={cn(fieldClass, "w-[88px]")}
						aria-label="Type"
					>
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="tpa">TPA</SelectItem>
						<SelectItem value="tpv">TPV</SelectItem>
					</SelectContent>
				</Select>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.wave}
					onChange={(e) => onUpdate({ wave: e.target.value })}
					className={cn(fieldClass, "w-14")}
					placeholder="1"
					aria-label="Wave"
				/>
			</td>
			<td className="px-2 py-1.5">
				<div className="min-w-[120px] space-y-1">
					<Select
						value={
							serverIsPreset
								? row.server_type
								: row.server_type
									? "custom"
									: undefined
						}
						onValueChange={(value) => {
							if (value === "custom") {
								onUpdate({ server_type: "" });
							} else {
								onUpdate({ server_type: value });
							}
						}}
					>
						<SelectTrigger className={fieldClass} aria-label="Server type">
							<SelectValue placeholder="Server" />
						</SelectTrigger>
						<SelectContent>
							{WORK_QUEUE_SERVER_TYPE_OPTIONS.map((opt) => (
								<SelectItem key={opt} value={opt}>
									{opt}
								</SelectItem>
							))}
							<SelectItem value="custom">Custom…</SelectItem>
						</SelectContent>
					</Select>
					{row.server_type && !serverIsPreset ? (
						<Input
							value={row.server_type}
							onChange={(e) => onUpdate({ server_type: e.target.value })}
							className={fieldClass}
							placeholder="Custom server type"
							aria-label="Custom server type"
						/>
					) : null}
				</div>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.notes}
					onChange={(e) => onUpdate({ notes: e.target.value })}
					className={cn(fieldClass, "min-w-[160px]")}
					placeholder="Notes"
					aria-label="Notes"
				/>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.primary_contact}
					onChange={(e) => onUpdate({ primary_contact: e.target.value })}
					className={cn(fieldClass, "min-w-[120px]")}
					placeholder="Contact name"
					aria-label="Primary contact"
				/>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.primary_email}
					onChange={(e) => onUpdate({ primary_email: e.target.value })}
					className={cn(fieldClass, "min-w-[140px]")}
					placeholder="email@vendor.com"
					type="email"
					aria-label="Primary email"
				/>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.primary_phone}
					onChange={(e) => onUpdate({ primary_phone: e.target.value })}
					className={cn(fieldClass, "min-w-[110px]")}
					placeholder="(555) 555-0100"
					aria-label="Primary phone"
				/>
			</td>
			<td className="px-2 py-1.5">
				<Input
					value={row.next_step}
					onChange={(e) => onUpdate({ next_step: e.target.value })}
					className={cn(fieldClass, "min-w-[140px]")}
					placeholder="Next action"
					aria-label="Next step"
				/>
			</td>
			<td className="px-2 py-1.5 min-w-[100px]">
				{hasIssues ? (
					<ul className="space-y-0.5 text-[10px] leading-snug text-amber-800 dark:text-amber-300">
						{issues.map((issue) => (
							<li key={issue.message}>{issue.message}</li>
						))}
					</ul>
				) : (
					<span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
						<CheckCircle2 className="size-3.5 shrink-0" />
						Ready
					</span>
				)}
			</td>
			<td className="px-2 py-1.5">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="size-8 rounded-sm text-muted-foreground shadow-none hover:bg-destructive/10 hover:text-destructive"
					onClick={onRemove}
					aria-label={`Remove row ${index + 1}`}
				>
					<Trash2 className="size-3.5" />
				</Button>
			</td>
		</tr>
	);
}

type ImportStep = "upload" | "review";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none";

const actionBtnOutline = cn(
	toolbarBtn,
	"border-border/50 bg-background hover:bg-muted/40"
);

const actionBtnGhost = cn(
	toolbarBtn,
	"text-muted-foreground hover:bg-muted/40 hover:text-foreground"
);

const actionBtnPrimary = cn(toolbarBtn, "px-4 font-semibold");

const STAT_TONE = {
	sky: "text-sky-700 dark:text-sky-400",
	orange: "text-orange-700 dark:text-orange-400",
	violet: "text-violet-700 dark:text-violet-400",
	emerald: "text-emerald-700 dark:text-emerald-400",
	amber: "text-amber-700 dark:text-amber-400",
	red: "text-red-700 dark:text-red-400",
} as const;

const IMPORT_STEPS: {
	id: ImportStep;
	label: string;
}[] = [
	{ id: "upload", label: "Upload" },
	{ id: "review", label: "Review & edit" },
];

function importStepIndex(step: ImportStep) {
	return step === "upload" ? 0 : 1;
}

function ImportStepper({ step }: { step: ImportStep }) {
	const current = importStepIndex(step);

	return (
		<div
			className="inline-flex items-center gap-1 rounded-sm border border-border/50 bg-muted/15 px-3 py-2"
			aria-label="Import progress"
		>
			{IMPORT_STEPS.map((item, index) => {
				const done = index < current;
				const active = index === current;
				const pending = index > current;

				return (
					<div key={item.id} className="flex items-center gap-1">
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold tabular-nums transition-all duration-300 ease-out",
									done &&
										"bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
									active && "bg-primary text-primary-foreground",
									pending && "bg-muted text-muted-foreground"
								)}
							>
								{done ? (
									<CheckCircle2 className="size-3.5" strokeWidth={2.5} />
								) : (
									index + 1
								)}
							</span>
							<span
								className={cn(
									"text-xs font-medium transition-colors duration-300",
									active || done ? "text-foreground" : "text-muted-foreground"
								)}
							>
								{item.label}
							</span>
						</div>
						{index < IMPORT_STEPS.length - 1 ? (
							<div
								className="mx-1.5 h-px w-6 overflow-hidden rounded-full bg-border/80 sm:w-8"
								aria-hidden
							>
								<div
									className={cn(
										"h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
										done ? "w-full" : "w-0"
									)}
								/>
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
}

function ActionButtonGroup({ children }: { children: React.ReactNode }) {
	return (
		<div className="inline-flex items-center gap-0.5 rounded-sm border border-border/50 bg-muted/20 p-0.5">
			{children}
		</div>
	);
}

function ImportStatsSection({
	rows,
	filename,
	tpaCount,
	tpvCount,
	validCount,
	issueCount,
	readyPercent,
}: {
	rows: number;
	filename: string;
	tpaCount: number;
	tpvCount: number;
	validCount: number;
	issueCount: number;
	readyPercent: number;
}) {
	const tpaPct = rows > 0 ? Math.round((tpaCount / rows) * 100) : 0;
	const tpvPct = rows > 0 ? Math.round((tpvCount / rows) * 100) : 0;

	const stats = [
		{
			id: "total",
			label: "Total rows",
			value: rows.toLocaleString(),
			icon: Layers,
			tone: STAT_TONE.sky,
			sub: filename ? filename : "In this batch",
		},
		{
			id: "tpa",
			label: "TPA",
			value: tpaCount.toLocaleString(),
			icon: Truck,
			tone: STAT_TONE.orange,
			sub: rows > 0 ? `${tpaPct}% of batch` : "Administrators",
		},
		{
			id: "tpv",
			label: "TPV",
			value: tpvCount.toLocaleString(),
			icon: Warehouse,
			tone: STAT_TONE.violet,
			sub: rows > 0 ? `${tpvPct}% of batch` : "Vendors",
		},
		{
			id: "ready",
			label: "Ready to import",
			value: validCount.toLocaleString(),
			icon: CheckCircle2,
			tone: STAT_TONE.emerald,
			sub: `${readyPercent}% validated`,
		},
		{
			id: "issues",
			label: "Issues",
			value: issueCount.toLocaleString(),
			icon: AlertTriangle,
			tone: issueCount > 0 ? STAT_TONE.amber : STAT_TONE.emerald,
			sub: issueCount > 0 ? "Fix before importing" : "No validation errors",
		},
	];

	return (
		<section className={FLAT_CARD_CLASS}>
			<div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-3 sm:divide-x lg:grid-cols-5 lg:divide-y-0">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<div key={stat.id} className="px-4 py-3.5">
							<div className="flex items-start justify-between gap-2">
								<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
									{stat.label}
								</p>
								<Icon
									className={cn("size-3.5 shrink-0 opacity-70", stat.tone)}
								/>
							</div>
							<p
								className={cn(
									"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
									stat.tone
								)}
							>
								{stat.value}
							</p>
							<p className="mt-1 truncate text-[11px] text-muted-foreground">
								{stat.sub}
							</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}

export function WorkQueueImportPage() {
	return (
		<VendorCoreGate title="Import TPA/TPV">
			<WorkQueueImportBody />
		</VendorCoreGate>
	);
}

function WorkQueueImportBody() {
	const router = useRouter();
	const invalidate = useInvalidateVendorCore();
	const importCsv = useImportWorkQueueSpreadsheetMutation();

	const [step, setStep] = useState<ImportStep>("upload");
	const [filename, setFilename] = useState("");
	const [rows, setRows] = useState<WorkQueueImportRowDraft[]>([]);
	const [fileErrors, setFileErrors] = useState<string[]>([]);
	const [skippedEmptyRows, setSkippedEmptyRows] = useState(0);

	const duplicateCodes = useMemo(() => collectDuplicateCodeKeys(rows), [rows]);

	const rowIssues = useMemo(() => {
		const map = new Map<string, ReturnType<typeof validateImportRow>>();
		for (const row of rows) {
			map.set(row.id, validateImportRow(row, duplicateCodes));
		}
		return map;
	}, [rows, duplicateCodes]);

	const issueCount = useMemo(() => {
		let total = 0;
		for (const issues of rowIssues.values()) {
			total += issues.length;
		}
		return total;
	}, [rowIssues]);

	const tpaCount = rows.filter(
		(r) => r.vendor_type.trim().toLowerCase() === "tpa"
	).length;
	const tpvCount = rows.filter(
		(r) => r.vendor_type.trim().toLowerCase() === "tpv"
	).length;
	const validCount = rows.filter(
		(r) => (rowIssues.get(r.id)?.length ?? 0) === 0
	).length;
	const readyPercent =
		rows.length > 0 ? Math.round((validCount / rows.length) * 100) : 0;

	const processFile = useCallback(async (file: File) => {
		const text = await file.text();
		const parsed = parseWorkQueueCsv(text);

		if (parsed.fileErrors.length > 0) {
			setFileErrors(parsed.fileErrors);
			setRows([]);
			setFilename(file.name);
			toast.error("Could not read CSV — check required columns");
			return;
		}

		if (parsed.rows.length === 0) {
			setFileErrors([
				"No importable rows found (code column required per row).",
			]);
			setRows([]);
			setFilename(file.name);
			toast.error("CSV has no rows with a code");
			return;
		}

		setFileErrors([]);
		setSkippedEmptyRows(parsed.skippedEmptyRows);
		setRows(parsed.rows);
		setFilename(file.name);
		setStep("review");
		toast.success(`Loaded ${parsed.rows.length} row(s) from ${file.name}`);
	}, []);

	const onDrop = useCallback(
		(accepted: File[]) => {
			const file = accepted[0];
			if (!file) return;
			void processFile(file);
		},
		[processFile]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
		maxFiles: 1,
		multiple: false,
	});

	function updateRow(id: string, patch: Partial<WorkQueueImportRowDraft>) {
		setRows((prev) =>
			prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
		);
	}

	function removeRow(id: string) {
		setRows((prev) => prev.filter((row) => row.id !== id));
	}

	function addRow() {
		const draft = createBlankImportRowDraft(rows.length + 2);
		setRows((prev) => [...prev, draft]);
	}

	function downloadSample() {
		downloadCsv(
			"tpa-tpv-import-sample.csv",
			[...WORK_QUEUE_IMPORT_COLUMNS],
			SAMPLE_IMPORT_ROWS.map((row) =>
				WORK_QUEUE_IMPORT_COLUMNS.map((col) => row[col])
			)
		);
	}

	async function handleImport() {
		if (rows.length === 0) {
			toast.error("Add at least one row to import");
			return;
		}
		if (issueCount > 0) {
			toast.error(`Fix ${issueCount} validation issue(s) before importing`);
			return;
		}

		const file = createImportFileFromRows(
			rows,
			filename || "tpa-tpv-import.csv"
		);
		try {
			const result = await importCsv.mutateAsync(file);
			invalidate();
			if (result.error_count > 0) {
				toast.warning(
					`Import finished with ${result.error_count} error(s) — created ${result.created_count}, updated ${result.updated_count}`
				);
			} else {
				toast.success(
					`Imported — created ${result.created_count}, updated ${result.updated_count}`
				);
			}
			router.push("/admin/my-work-queue");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Import failed"));
		}
	}

	function resetImport() {
		setStep("upload");
		setFilename("");
		setRows([]);
		setFileErrors([]);
		setSkippedEmptyRows(0);
	}

	return (
		<div className="mx-auto max-w-[1400px] space-y-6 pb-10">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 space-y-2">
					<Link
						href="/admin/my-work-queue"
						className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-3.5" />
						Back to TPA/TPV Tracking
					</Link>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">
							Import TPA/TPV roster
						</h1>
						<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
							Upload a CSV, review and edit rows in place, then confirm to
							create or update migration cases.
						</p>
					</div>
				</div>

				<ImportStepper step={step} />
			</div>

			{step === "upload" ? (
				<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
					<div className={cn(FLAT_CARD_CLASS, "p-0")}>
						<div
							{...getRootProps()}
							className={cn(
								"relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-12 transition-colors",
								isDragActive
									? "border-primary bg-primary/5"
									: "border-border/70 bg-gradient-to-b from-muted/30 to-background hover:border-primary/40 hover:bg-muted/20"
							)}
						>
							<input {...getInputProps()} />
							<div className="flex size-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
								<Upload className="size-6" />
							</div>
							<div className="text-center">
								<p className="text-base font-semibold text-foreground">
									{isDragActive
										? "Drop your CSV here"
										: "Drag & drop a CSV file"}
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									or click to browse · .csv only
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className={cn(actionBtnOutline, "mt-2")}
							>
								Choose file
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						<div className={cn(FLAT_CARD_CLASS, "p-4")}>
							<div className="flex items-start gap-3">
								<div className="rounded-sm bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
									<Sparkles className="size-4" />
								</div>
								<div>
									<p className="text-sm font-semibold">Required columns</p>
									<p className="mt-1 text-xs text-muted-foreground">
										<code className="text-[11px]">code</code>,{" "}
										<code className="text-[11px]">name</code>,{" "}
										<code className="text-[11px]">vendor_type</code> (tpa or
										tpv)
									</p>
									<p className="mt-2 text-xs text-muted-foreground">
										Optional: wave, server_type, notes, primary_contact,
										primary_email, primary_phone, next_step
									</p>
								</div>
							</div>
						</div>

						<div className={cn(FLAT_CARD_CLASS, "p-4")}>
							<div className="flex items-start gap-3">
								<div className="rounded-sm bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
									<FileSpreadsheet className="size-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold">Sample file</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Download a template with every supported column.
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className={cn(actionBtnOutline, "mt-3")}
										onClick={downloadSample}
									>
										<FileSpreadsheet className="size-3.5" />
										Download sample CSV
									</Button>
								</div>
							</div>
						</div>

						{fileErrors.length > 0 ? (
							<div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3">
								<p className="text-xs font-semibold text-destructive">
									File issues
								</p>
								<ul className="mt-1 space-y-1 text-xs text-destructive/90">
									{fileErrors.map((error) => (
										<li key={error}>{error}</li>
									))}
								</ul>
							</div>
						) : null}
					</div>
				</div>
			) : null}

			{step === "review" ? (
				<div className="space-y-4">
					<ImportStatsSection
						rows={rows.length}
						filename={filename}
						tpaCount={tpaCount}
						tpvCount={tpvCount}
						validCount={validCount}
						issueCount={issueCount}
						readyPercent={readyPercent}
					/>

					{skippedEmptyRows > 0 ? (
						<p className="text-xs text-muted-foreground">
							Skipped {skippedEmptyRows} row(s) with empty code.
						</p>
					) : null}

					<div className={cn(FLAT_CARD_CLASS, "overflow-hidden")}>
						<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 px-4 py-3.5">
							<div className="flex min-w-0 items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
									<FileSpreadsheet className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-semibold tracking-tight">
										Review import data
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{filename
											? `Source file · ${filename}`
											: "Manually edited roster"}
									</p>
								</div>
							</div>
							<ActionButtonGroup>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className={actionBtnGhost}
									onClick={resetImport}
								>
									<RefreshCw className="size-3.5" />
									Replace file
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className={cn(
										actionBtnGhost,
										"text-foreground hover:bg-primary/10 hover:text-primary"
									)}
									onClick={addRow}
								>
									<Plus className="size-3.5" />
									Add row
								</Button>
							</ActionButtonGroup>
						</div>

						<p className="border-b border-border/40 px-4 py-2 text-[11px] text-muted-foreground">
							Each column matches the CSV template. Fields marked{" "}
							<span className="font-semibold text-foreground">*</span> are
							required. Scroll horizontally to see all columns.
						</p>

						<div className="overflow-x-auto">
							<table className="w-full min-w-[1480px] border-collapse text-left">
								<thead className="sticky top-0 z-[1] bg-muted/40 backdrop-blur-sm">
									<tr className="border-b border-border/60">
										<th className={cn(thClass, "w-10 px-3")}>#</th>
										{WORK_QUEUE_IMPORT_COLUMNS.map((col) => (
											<th key={col} className={thClass}>
												{COLUMN_LABELS[col]}
												{REQUIRED_IMPORT_COLUMNS.includes(col) ? (
													<span className="ml-0.5 text-primary">*</span>
												) : null}
											</th>
										))}
										<th className={cn(thClass, "w-24")}>Status</th>
										<th className="w-10 px-2 py-2" />
									</tr>
								</thead>
								<tbody>
									{rows.map((row, index) => (
										<ImportRowEditor
											key={row.id}
											row={row}
											index={index}
											issues={rowIssues.get(row.id) ?? []}
											onUpdate={(patch) => updateRow(row.id, patch)}
											onRemove={() => removeRow(row.id)}
										/>
									))}
								</tbody>
							</table>
						</div>

						<div className="sticky bottom-3 z-10 mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border/50 bg-card px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]">
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1.5 rounded-sm border border-border/50 bg-muted/30 px-2 py-0.5 font-medium text-foreground">
									<Layers className="size-3.5 text-primary" />
									{rows.length} row{rows.length === 1 ? "" : "s"}
								</span>
								<span className="hidden sm:inline">
									Same columns as your CSV — add rows anytime before import.
								</span>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className={actionBtnOutline}
									onClick={resetImport}
								>
									Cancel
								</Button>
								<Button
									type="button"
									size="sm"
									className={actionBtnPrimary}
									disabled={
										importCsv.isPending || rows.length === 0 || issueCount > 0
									}
									onClick={() => void handleImport()}
								>
									{importCsv.isPending ? (
										<>
											<RefreshCw className="size-3.5 animate-spin" />
											Importing…
										</>
									) : (
										<>
											<Upload className="size-3.5" />
											Import {rows.length} record
											{rows.length === 1 ? "" : "s"}
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
