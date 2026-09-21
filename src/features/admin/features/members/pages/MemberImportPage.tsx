"use client";

import { useCallback, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	FileSpreadsheet,
	Files,
	HeartPulse,
	Layers,
	Loader2,
	Pill,
	Plus,
	RefreshCw,
	Sparkles,
	Trash2,
	Upload,
	Users,
	WalletCards,
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
	useImportMembersBulkMutation,
	useInvalidateVendorCore,
	useMemberVendorsQuery,
} from "../feature/queries/useMembersQuery";
import {
	COLUMN_LABELS,
	type ColumnMapping,
	MEMBER_IMPORT_FILE_KINDS,
	type MemberImportColumn,
	type MemberImportFileKind,
	type MemberImportRowDraft,
	REVIEW_VISIBLE_COLUMNS,
	collectDuplicateMemberKeys,
	createBlankMemberImportRow,
	parseMemberImportFile,
	sampleDownloadSpec,
	validateMemberImportRow,
} from "../lib/member-import";

const FLAT_CARD_CLASS =
	"overflow-hidden rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const actionBtnOutline =
	"h-8 gap-1.5 rounded-sm border-border/70 bg-background px-3 text-xs font-medium shadow-none";
const actionBtnGhost =
	"h-8 gap-1.5 rounded-sm px-2.5 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground";

const fieldClass =
	"h-8 rounded-sm border-border bg-background text-xs shadow-none hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

const thClass =
	"px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap";

const STAT_TONE = {
	sky: "text-sky-700 dark:text-sky-400",
	emerald: "text-emerald-700 dark:text-emerald-400",
	amber: "text-amber-700 dark:text-amber-400",
	violet: "text-violet-700 dark:text-violet-400",
	orange: "text-orange-700 dark:text-orange-400",
} as const;

type ImportStep = "upload" | "review";

const IMPORT_STEPS: { id: ImportStep; label: string }[] = [
	{ id: "upload", label: "Configure & upload" },
	{ id: "review", label: "Review & import" },
];

const FILE_KIND_ICON: Record<MemberImportFileKind, typeof HeartPulse> = {
	eligibility: HeartPulse,
	claim: Pill,
	accumulator: WalletCards,
};

function ImportStepper({ step }: { step: ImportStep }) {
	const activeIndex = IMPORT_STEPS.findIndex((s) => s.id === step);

	return (
		<div className="flex flex-wrap items-center gap-1">
			{IMPORT_STEPS.map((item, index) => {
				const active = item.id === step;
				const done = index < activeIndex;
				return (
					<div key={item.id} className="flex items-center">
						<div
							className={cn(
								"flex items-center gap-2 rounded-sm px-2.5 py-1.5 transition-colors",
								active && "bg-primary/10",
								done && "opacity-80"
							)}
						>
							<span
								className={cn(
									"flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
									active && "bg-primary text-primary-foreground",
									done && "bg-emerald-600 text-white",
									!active && !done && "bg-muted text-muted-foreground"
								)}
							>
								{done ? <CheckCircle2 className="size-3" /> : index + 1}
							</span>
							<span
								className={cn(
									"text-xs font-medium",
									active ? "text-foreground" : "text-muted-foreground"
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

function MappingChips({ mappings }: { mappings: ColumnMapping[] }) {
	if (mappings.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-1.5">
			{mappings.map((m) => (
				<span
					key={`${m.field}-${m.index}`}
					className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
					title={`File column “${m.header}” → ${COLUMN_LABELS[m.field]}`}
				>
					<span className="font-medium text-foreground/80">{m.header}</span>
					<span aria-hidden>→</span>
					<span className="font-mono text-[9px]">{m.field}</span>
				</span>
			))}
		</div>
	);
}

function ImportStatsSection({
	members,
	rawRows,
	filename,
	fileKind,
	validCount,
	issueCount,
	readyPercent,
	dedupedCount,
}: {
	members: number;
	rawRows: number;
	filename: string;
	fileKind: MemberImportFileKind;
	validCount: number;
	issueCount: number;
	readyPercent: number;
	dedupedCount: number;
}) {
	const kindMeta = MEMBER_IMPORT_FILE_KINDS.find((k) => k.id === fileKind);
	const KindIcon = FILE_KIND_ICON[fileKind];

	const stats = [
		{
			id: "members",
			label: "Members",
			value: members.toLocaleString(),
			icon: Users,
			tone: STAT_TONE.sky,
			sub: filename || "In this batch",
		},
		{
			id: "source",
			label: "Source type",
			value: kindMeta?.shortLabel ?? fileKind,
			icon: KindIcon,
			tone: STAT_TONE.violet,
			sub:
				rawRows > members
					? `${rawRows} file rows → ${members} unique`
					: "Unique members extracted",
		},
		{
			id: "dedupe",
			label: "Collapsed",
			value: dedupedCount.toLocaleString(),
			icon: Files,
			tone: STAT_TONE.orange,
			sub:
				dedupedCount > 0
					? "Duplicate claim/accum rows"
					: "No duplicates merged",
		},
		{
			id: "ready",
			label: "Ready",
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
									typeof stat.value === "string" && stat.value.length > 6
										? "text-lg"
										: "",
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

type ImportRowEditorProps = {
	row: MemberImportRowDraft;
	index: number;
	issues: ReturnType<typeof validateMemberImportRow>;
	onUpdate: (patch: Partial<MemberImportRowDraft>) => void;
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

	return (
		<tr
			className={cn(
				"border-b border-border/40 align-top transition-colors",
				hasIssues && "bg-amber-500/[0.04]"
			)}
		>
			<td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
				<div>{index + 1}</div>
				{row.sourceHits > 1 ? (
					<div className="mt-0.5 text-[9px] text-violet-600 dark:text-violet-400">
						×{row.sourceHits} rows
					</div>
				) : null}
			</td>
			{REVIEW_VISIBLE_COLUMNS.map((col) => (
				<td key={col} className="px-2 py-1.5">
					<Input
						value={row[col]}
						onChange={(e) => onUpdate({ [col]: e.target.value })}
						className={cn(
							fieldClass,
							col === "cardholder_id" && "min-w-[108px] font-mono text-[11px]",
							col === "person_code" && "w-14 font-mono",
							(col === "first_name" || col === "last_name") && "min-w-[100px]",
							col === "email" && "min-w-[140px]",
							col === "date_of_birth" && "min-w-[108px] font-mono text-[11px]"
						)}
						placeholder={COLUMN_LABELS[col]}
						aria-label={COLUMN_LABELS[col]}
					/>
				</td>
			))}
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

export function MemberImportPage() {
	return (
		<VendorCoreGate title="Import members">
			<MemberImportBody />
		</VendorCoreGate>
	);
}

function MemberImportBody() {
	const router = useRouter();
	const invalidate = useInvalidateVendorCore();
	const vendorsQ = useMemberVendorsQuery();
	const importBulk = useImportMembersBulkMutation();

	const vendors = vendorsQ.data ?? [];
	const vendorLabel = (v: (typeof vendors)[number]) =>
		v.trade_name || v.legal_name || v.name || v.code || v.id;

	const [step, setStep] = useState<ImportStep>("upload");
	const [vendorId, setVendorId] = useState("");
	const [fileKind, setFileKind] = useState<MemberImportFileKind>("eligibility");
	const [filename, setFilename] = useState("");
	const [rows, setRows] = useState<MemberImportRowDraft[]>([]);
	const [fileErrors, setFileErrors] = useState<string[]>([]);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [mappings, setMappings] = useState<ColumnMapping[]>([]);
	const [skippedEmptyRows, setSkippedEmptyRows] = useState(0);
	const [rawRowCount, setRawRowCount] = useState(0);
	const [dedupedCount, setDedupedCount] = useState(0);
	const [importProgress, setImportProgress] = useState<{
		done: number;
		total: number;
	} | null>(null);

	const duplicateKeys = useMemo(() => collectDuplicateMemberKeys(rows), [rows]);

	const rowIssues = useMemo(() => {
		const map = new Map<string, ReturnType<typeof validateMemberImportRow>>();
		for (const row of rows) {
			map.set(row.id, validateMemberImportRow(row, duplicateKeys));
		}
		return map;
	}, [rows, duplicateKeys]);

	const issueCount = useMemo(() => {
		let total = 0;
		for (const issues of rowIssues.values()) {
			total += issues.length;
		}
		return total;
	}, [rowIssues]);

	const validCount = rows.filter(
		(r) => (rowIssues.get(r.id)?.length ?? 0) === 0
	).length;
	const readyPercent =
		rows.length > 0 ? Math.round((validCount / rows.length) * 100) : 0;

	const selectedVendor = vendors.find((v) => v.id === vendorId);
	const kindMeta = MEMBER_IMPORT_FILE_KINDS.find((k) => k.id === fileKind);
	const KindIcon = FILE_KIND_ICON[fileKind];
	const kindTone =
		fileKind === "eligibility"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
			: fileKind === "claim"
				? "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400"
				: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-400";
	const kindHint =
		fileKind === "eligibility"
			? "Upload an eligibility roster — one row per member with coverage fields."
			: fileKind === "claim"
				? "Upload a claim extract — members are inferred from patient columns."
				: "Upload an accumulator feed — unique members extracted from deductible / OOP rows.";

	const processFile = useCallback(
		async (file: File) => {
			if (!vendorId) {
				toast.error("Select a vendor before uploading");
				return;
			}

			const text = await file.text();
			const parsed = parseMemberImportFile(text, fileKind);

			setMappings(parsed.mappings);
			setWarnings(parsed.warnings);
			setSkippedEmptyRows(parsed.skippedEmptyRows);
			setRawRowCount(parsed.rawRowCount);
			setDedupedCount(parsed.dedupedCount);
			setFilename(file.name);

			if (parsed.fileErrors.length > 0) {
				setFileErrors(parsed.fileErrors);
				setRows([]);
				toast.error("Could not map member columns — check file type & headers");
				return;
			}

			if (parsed.rows.length === 0) {
				setFileErrors(["No importable members found."]);
				setRows([]);
				toast.error("File has no member rows");
				return;
			}

			setFileErrors([]);
			setRows(parsed.rows);
			setStep("review");
			toast.success(
				`Loaded ${parsed.rows.length} member(s) from ${file.name}${
					parsed.dedupedCount > 0
						? ` (${parsed.dedupedCount} duplicates collapsed)`
						: ""
				}`
			);
		},
		[vendorId, fileKind]
	);

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
		accept: {
			"text/csv": [".csv", ".txt"],
			"text/plain": [".txt", ".psv"],
			"application/vnd.ms-excel": [".csv"],
		},
		maxFiles: 1,
		multiple: false,
		disabled: !vendorId,
	});

	function updateRow(id: string, patch: Partial<MemberImportRowDraft>) {
		setRows((prev) =>
			prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
		);
	}

	function removeRow(id: string) {
		setRows((prev) => prev.filter((row) => row.id !== id));
	}

	function addRow() {
		setRows((prev) => [...prev, createBlankMemberImportRow(prev.length + 2)]);
	}

	function downloadSample() {
		const spec = sampleDownloadSpec(fileKind);
		downloadCsv(spec.filename, spec.headers, spec.rows);
	}

	async function handleImport() {
		if (!vendorId) {
			toast.error("Select a vendor");
			return;
		}
		if (rows.length === 0) {
			toast.error("Add at least one member to import");
			return;
		}
		if (issueCount > 0) {
			toast.error(`Fix ${issueCount} validation issue(s) before importing`);
			return;
		}

		setImportProgress({ done: 0, total: rows.length });
		try {
			const result = await importBulk.mutateAsync({
				vendorId,
				fileKind,
				rows,
				filename,
				onProgress: (done, total) => setImportProgress({ done, total }),
			});
			invalidate();

			if (result.errorCount > 0) {
				toast.warning(
					`Imported ${result.createdCount} member(s) with ${result.errorCount} error(s)`
				);
			} else {
				toast.success(`Imported ${result.createdCount} member(s)`);
			}
			router.push("/admin/members");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Import failed");
		} finally {
			setImportProgress(null);
		}
	}

	function resetImport() {
		setStep("upload");
		setFilename("");
		setRows([]);
		setFileErrors([]);
		setWarnings([]);
		setMappings([]);
		setSkippedEmptyRows(0);
		setRawRowCount(0);
		setDedupedCount(0);
		setImportProgress(null);
	}

	return (
		<div className="mx-auto max-w-[1400px] space-y-6 pb-10">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 space-y-2">
					<Link
						href="/admin/members"
						className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-3.5" />
						Back to Members
					</Link>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">
							Bulk import members
						</h1>
						<div className="mt-2 flex flex-wrap items-center gap-2.5">
							<span
								className={cn(
									"inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold tracking-tight",
									kindTone
								)}
							>
								<KindIcon className="size-3.5 shrink-0" />
								{kindMeta?.label ?? fileKind}
							</span>
							<p className="max-w-xl text-sm text-muted-foreground">
								{kindHint}
							</p>
						</div>
					</div>
				</div>

				<ImportStepper step={step} />
			</div>

			{step === "upload" ? (
				<div className="space-y-4">
					<div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
						<div className={cn(FLAT_CARD_CLASS, "p-4")}>
							<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
								1 · Vendor
							</p>
							<p className="mt-1 text-sm font-semibold">Import into vendor</p>
							<div className="mt-3 space-y-2">
								<Select
									value={vendorId || undefined}
									onValueChange={setVendorId}
								>
									<SelectTrigger
										className={cn(fieldClass, "h-10 w-full max-w-md")}
									>
										<SelectValue
											placeholder={
												vendorsQ.isLoading
													? "Loading vendors…"
													: vendorsQ.isError
														? "Could not load vendors"
														: vendors.length === 0
															? "No vendors found"
															: "Select vendor"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{vendors.map((v) => (
											<SelectItem key={v.id} value={v.id}>
												{vendorLabel(v)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{vendorsQ.isError ? (
									<p className="text-xs text-destructive">
										{vendorsQ.error instanceof Error
											? vendorsQ.error.message
											: "Failed to load vendors"}
									</p>
								) : null}
								{!vendorsQ.isLoading &&
								!vendorsQ.isError &&
								vendors.length === 0 ? (
									<p className="text-xs text-muted-foreground">
										No vendors in the database yet. Seed vendors, then refresh.
									</p>
								) : null}
							</div>
						</div>

						<div className={cn(FLAT_CARD_CLASS, "p-4")}>
							<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
								2 · File type
							</p>
							<p className="mt-1 text-sm font-semibold">Source feed format</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Headers differ by feed — we auto-map columns to member fields.
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-3">
								{MEMBER_IMPORT_FILE_KINDS.map((kind) => {
									const Icon = FILE_KIND_ICON[kind.id];
									const selected = fileKind === kind.id;
									return (
										<button
											key={kind.id}
											type="button"
											onClick={() => {
												setFileKind(kind.id);
												setFileErrors([]);
											}}
											className={cn(
												"rounded-sm border px-3 py-3 text-left transition-all",
												selected
													? "border-primary bg-primary/5 shadow-[inset_0_0_0_1px] shadow-primary/30"
													: "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/30"
											)}
										>
											<Icon
												className={cn(
													"size-4",
													selected ? "text-primary" : "text-muted-foreground"
												)}
											/>
											<p className="mt-2 text-xs font-semibold">{kind.label}</p>
											<p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
												{kind.description}
											</p>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
						<div className={cn(FLAT_CARD_CLASS, "p-0")}>
							<div
								{...getRootProps()}
								className={cn(
									"relative flex min-h-[300px] flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-12 transition-colors",
									!vendorId
										? "cursor-not-allowed border-border/40 bg-muted/10 opacity-70"
										: isDragActive
											? "cursor-pointer border-primary bg-primary/5"
											: "cursor-pointer border-border/70 bg-gradient-to-b from-muted/30 to-background hover:border-primary/40 hover:bg-muted/20"
								)}
							>
								<input {...getInputProps()} />
								<div className="flex size-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
									<Upload className="size-6" />
								</div>
								<div className="text-center">
									<p className="text-base font-semibold text-foreground">
										{!vendorId
											? "Select a vendor to enable upload"
											: isDragActive
												? "Drop your file here"
												: `Drag & drop ${kindMeta?.shortLabel.toLowerCase()} file`}
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										.csv / .txt · comma or pipe delimited
									</p>
								</div>
								{vendorId ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className={cn(actionBtnOutline, "mt-2")}
									>
										Choose file
									</Button>
								) : null}
							</div>
						</div>

						<div className="space-y-3">
							<div className={cn(FLAT_CARD_CLASS, "p-4")}>
								<div className="flex items-start gap-3">
									<div className="rounded-sm bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
										<Sparkles className="size-4" />
									</div>
									<div>
										<p className="text-sm font-semibold">
											Smart column mapping
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Required for members:{" "}
											<code className="text-[11px]">
												cardholder / member id
											</code>
											, <code className="text-[11px]">first name</code>,{" "}
											<code className="text-[11px]">last name</code>
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											Claim &amp; accumulator feeds often repeat the same member
											— duplicates collapse automatically.
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
										<p className="text-sm font-semibold">Sample files</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Download a realistic {kindMeta?.shortLabel.toLowerCase()}{" "}
											template with vendor-style headers.
										</p>
										<Button
											type="button"
											variant="outline"
											size="sm"
											className={cn(actionBtnOutline, "mt-3")}
											onClick={downloadSample}
										>
											<FileSpreadsheet className="size-3.5" />
											Download {kindMeta?.shortLabel} sample
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
				</div>
			) : null}

			{step === "review" ? (
				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-3 rounded-sm border border-border/60 bg-muted/20 px-4 py-3 text-xs">
						<span className="font-medium text-foreground">
							{selectedVendor ? vendorLabel(selectedVendor) : "Vendor"}
						</span>
						<span className="text-muted-foreground">·</span>
						<span className="text-muted-foreground">{kindMeta?.label}</span>
						<span className="text-muted-foreground">·</span>
						<span className="truncate text-muted-foreground">{filename}</span>
					</div>

					<ImportStatsSection
						members={rows.length}
						rawRows={rawRowCount || rows.length}
						filename={filename}
						fileKind={fileKind}
						validCount={validCount}
						issueCount={issueCount}
						readyPercent={readyPercent}
						dedupedCount={dedupedCount}
					/>

					{mappings.length > 0 ? (
						<div className={cn(FLAT_CARD_CLASS, "space-y-2 p-4")}>
							<p className="text-xs font-semibold">Detected column mapping</p>
							<MappingChips mappings={mappings} />
						</div>
					) : null}

					{warnings.length > 0 || skippedEmptyRows > 0 ? (
						<p className="text-xs text-muted-foreground">
							{[
								...warnings,
								skippedEmptyRows > 0
									? `Skipped ${skippedEmptyRows} row(s) with empty cardholder ID.`
									: null,
							]
								.filter(Boolean)
								.join(" ")}
						</p>
					) : null}

					<div className={cn(FLAT_CARD_CLASS, "overflow-hidden")}>
						<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 px-4 py-3.5">
							<div className="flex min-w-0 items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
									<Layers className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-semibold tracking-tight">
										Review members
									</p>
									<p className="truncate text-xs text-muted-foreground">
										Edit rows in place before confirming import
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
							Fields marked{" "}
							<span className="font-semibold text-foreground">*</span> are
							required. Scroll horizontally for more columns.
						</p>

						<div className="overflow-x-auto">
							<table className="w-full min-w-[1100px] border-collapse">
								<thead>
									<tr className="border-b border-border/60 bg-muted/30">
										<th className={cn(thClass, "px-3")}>#</th>
										{REVIEW_VISIBLE_COLUMNS.map((col) => (
											<th key={col} className={thClass}>
												{COLUMN_LABELS[col]}
												{(
													[
														"cardholder_id",
														"first_name",
														"last_name",
													] as MemberImportColumn[]
												).includes(col)
													? " *"
													: ""}
											</th>
										))}
										<th className={thClass}>Status</th>
										<th className={thClass} />
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
					</div>

					<div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border/70 bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
						<div className="text-xs text-muted-foreground">
							{importProgress ? (
								<span className="inline-flex items-center gap-2 font-medium text-foreground">
									<Loader2 className="size-3.5 animate-spin" />
									Importing {importProgress.done} / {importProgress.total}
								</span>
							) : (
								<>
									{validCount} ready · {issueCount} issue
									{issueCount === 1 ? "" : "s"} · vendor{" "}
									<span className="font-medium text-foreground">
										{selectedVendor ? vendorLabel(selectedVendor) : "—"}
									</span>
								</>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className={actionBtnOutline}
								onClick={resetImport}
								disabled={importBulk.isPending}
							>
								Cancel
							</Button>
							<Button
								type="button"
								size="sm"
								className="h-8 gap-1.5 rounded-sm px-4 text-xs"
								disabled={
									importBulk.isPending ||
									rows.length === 0 ||
									issueCount > 0 ||
									!vendorId
								}
								onClick={() => void handleImport()}
							>
								{importBulk.isPending ? (
									<Loader2 className="size-3.5 animate-spin" />
								) : (
									<Upload className="size-3.5" />
								)}
								Import {rows.length} member{rows.length === 1 ? "" : "s"}
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
