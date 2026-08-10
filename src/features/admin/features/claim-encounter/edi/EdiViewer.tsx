"use client";

import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	ChevronDown,
	ChevronRight,
	Copy,
	Download,
	PanelRightClose,
	PanelRightOpen,
	Search,
	UnfoldHorizontal,
	WrapText,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
	type StructuredSegment,
	allCollapsedIds,
	extractClaimRaw,
	listClaimControls,
	structureDocument,
	visibleStructuredRows,
} from "./loop-structure";
import {
	type X12Document,
	findSegmentIndexes,
	parseX12,
	summarizeX12,
} from "./parse-x12";
import {
	SEGMENT_ROLE_BADGE,
	SEGMENT_ROLE_CLASS,
	segmentDescription,
	segmentRole,
} from "./segment-meta";

type EdiViewerProps = {
	raw: string;
	fileName?: string;
	className?: string;
	jumpTo?: string | null;
	focusClaimIndex?: number | null;
	compact?: boolean;
	/** When false, hides the selection inspector panel entirely. */
	showInspector?: boolean;
};

const ROW_H = 28;
const VIRTUALIZE_THRESHOLD = 500;

function formatMoney(value: number | null) {
	if (value == null) return "—";
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	});
}

function useViewportVirtual(
	viewportRef: React.RefObject<HTMLDivElement | null>,
	count: number,
	rowHeight: number,
	enabled: boolean,
	overscan = 20
) {
	const [scrollTop, setScrollTop] = useState(0);
	const [viewport, setViewport] = useState(480);

	useEffect(() => {
		if (!enabled) return;
		const el = viewportRef.current;
		if (!el) return;
		const onScroll = () => setScrollTop(el.scrollTop);
		const ro = new ResizeObserver(() => setViewport(el.clientHeight || 480));
		el.addEventListener("scroll", onScroll, { passive: true });
		ro.observe(el);
		setViewport(el.clientHeight || 480);
		return () => {
			el.removeEventListener("scroll", onScroll);
			ro.disconnect();
		};
	}, [enabled, viewportRef]);

	const total = count * rowHeight;
	const start = enabled
		? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
		: 0;
	const visibleCount = enabled
		? Math.ceil(viewport / rowHeight) + overscan * 2
		: count;
	const end = enabled ? Math.min(count, start + visibleCount) : count;

	const items = useMemo(() => {
		const rows: { index: number; start: number; size: number }[] = [];
		for (let i = start; i < end; i++) {
			rows.push({ index: i, start: i * rowHeight, size: rowHeight });
		}
		return rows;
	}, [start, end, rowHeight]);

	const scrollToIndex = useCallback(
		(index: number, align: "center" | "start" = "center") => {
			const el = viewportRef.current;
			if (!el) return;
			const top =
				align === "center"
					? Math.max(0, index * rowHeight - viewport / 2 + rowHeight / 2)
					: index * rowHeight;
			el.scrollTo({ top, behavior: "smooth" });
		},
		[rowHeight, viewport, viewportRef]
	);

	const scrollToTop = useCallback(() => {
		viewportRef.current?.scrollTo({ top: 0 });
	}, [viewportRef]);

	return { total, items, scrollToIndex, scrollToTop };
}

export function EdiViewer({
	raw,
	fileName = "edi-file.txt",
	className,
	jumpTo,
	focusClaimIndex = null,
	compact = false,
	showInspector = true,
}: EdiViewerProps) {
	const fullDoc = useMemo(() => parseX12(raw), [raw]);

	const claimFocus = useMemo(() => {
		if (focusClaimIndex == null || focusClaimIndex < 0) return null;
		const controls = listClaimControls(fullDoc);
		if (controls.length === 0) return null;
		const ordinal = focusClaimIndex % controls.length;
		return extractClaimRaw(fullDoc, ordinal);
	}, [fullDoc, focusClaimIndex]);

	const activeRaw = claimFocus?.raw ?? raw;
	const doc = useMemo(() => parseX12(activeRaw), [activeRaw]);
	const structured = useMemo(() => structureDocument(doc), [doc]);
	const summary = useMemo(() => summarizeX12(doc), [doc]);
	const claimControls = useMemo(() => listClaimControls(fullDoc), [fullDoc]);

	// All loops open by default
	const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
	const [search, setSearch] = useState("");
	const [hitIndex, setHitIndex] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [wrap, setWrap] = useState(false);
	const [inspectorOpen, setInspectorOpen] = useState(showInspector && !compact);
	const pendingScroll = useRef<number | null>(null);
	const viewportRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setCollapsed(new Set());
		setSelectedIndex(null);
		setHitIndex(0);
		setSearch("");
	}, [activeRaw]);

	const hits = useMemo(() => findSegmentIndexes(doc, search), [doc, search]);

	const visible = useMemo(
		() => visibleStructuredRows(structured, collapsed),
		[structured, collapsed]
	);

	const shouldVirtualize = visible.length > VIRTUALIZE_THRESHOLD;
	const { total, items, scrollToIndex, scrollToTop } = useViewportVirtual(
		viewportRef,
		visible.length,
		ROW_H,
		shouldVirtualize
	);

	useEffect(() => {
		scrollToTop();
	}, [activeRaw, scrollToTop]);

	const scrollToSegmentIndex = useCallback(
		(segmentIndex: number) => {
			const visiblePos = visible.findIndex(
				(r) => r.segment.index === segmentIndex
			);
			if (visiblePos < 0) {
				pendingScroll.current = segmentIndex;
				setCollapsed((prev) => {
					const next = new Set(prev);
					for (const row of structured) {
						if (
							row.isCollapseRoot &&
							row.segment.index < segmentIndex &&
							row.groupEnd >= segmentIndex
						) {
							next.delete(row.segment.index);
						}
					}
					return next;
				});
				setSelectedIndex(segmentIndex);
				return;
			}
			setSelectedIndex(segmentIndex);
			scrollToIndex(visiblePos, "center");
		},
		[visible, structured, scrollToIndex]
	);

	useEffect(() => {
		if (pendingScroll.current == null) return;
		const target = pendingScroll.current;
		const visiblePos = visible.findIndex((r) => r.segment.index === target);
		if (visiblePos >= 0) {
			pendingScroll.current = null;
			scrollToIndex(visiblePos, "center");
		}
	}, [collapsed, visible, scrollToIndex]);

	useEffect(() => {
		if (!jumpTo) return;
		setSearch(jumpTo);
		setHitIndex(0);
	}, [jumpTo]);

	useEffect(() => {
		if (hits.length === 0) return;
		const target = hits[Math.min(hitIndex, hits.length - 1)]!;
		scrollToSegmentIndex(target);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hits, hitIndex]);

	function toggleCollapse(index: number) {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(index)) next.delete(index);
			else next.add(index);
			return next;
		});
	}

	function expandAll() {
		setCollapsed(new Set());
	}

	function collapseAll() {
		setCollapsed(allCollapsedIds(structured));
	}

	function goNextHit() {
		if (!hits.length) return;
		setHitIndex((i) => (i + 1) % hits.length);
	}

	function goPrevHit() {
		if (!hits.length) return;
		setHitIndex((i) => (i - 1 + hits.length) % hits.length);
	}

	function copySelected() {
		const seg =
			selectedIndex != null ? doc.segments[selectedIndex] : doc.segments[0];
		if (!seg) return;
		void navigator.clipboard.writeText(seg.raw);
		toast.success("Segment copied");
	}

	function downloadRaw() {
		const blob = new Blob([activeRaw], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = claimFocus
			? `${fileName.replace(/\.txt$/i, "")}_${claimFocus.claimControlId}.txt`
			: fileName;
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		toast.success("EDI downloaded");
	}

	const selected = selectedIndex != null ? doc.segments[selectedIndex] : null;
	const selectedMeta =
		selectedIndex != null
			? structured.find((r) => r.segment.index === selectedIndex)
			: null;

	const chrome = (
		<div className="shrink-0 border-b border-border/50 bg-card">
			<div className="grid gap-1.5 border-b border-border/40 px-2.5 py-2 sm:grid-cols-2 lg:grid-cols-5">
				<div className="rounded-md border border-border/40 bg-background/50 px-2 py-1">
					<p className="text-[10px] uppercase text-muted-foreground">Type</p>
					<p className="text-sm font-semibold">
						<span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-primary">
							{summary.transactionSet}
						</span>
						{claimFocus ? (
							<span className="ml-1 text-[10px] font-medium text-muted-foreground">
								· claim
							</span>
						) : null}
					</p>
				</div>
				<div className="rounded-md border border-border/40 bg-background/50 px-2 py-1">
					<p className="text-[10px] uppercase text-muted-foreground">
						{claimFocus ? "Claim control" : "Guide"}
					</p>
					<p className="truncate font-mono text-xs font-medium">
						{claimFocus?.claimControlId ?? summary.guide ?? "—"}
					</p>
				</div>
				<div className="rounded-md border border-border/40 bg-background/50 px-2 py-1">
					<p className="text-[10px] uppercase text-muted-foreground">
						Segments / Claims
					</p>
					<p className="text-sm font-semibold tabular-nums">
						{summary.segmentCount.toLocaleString()} / {summary.claimCount}
						{claimControls.length > 1 && focusClaimIndex != null ? (
							<span className="text-xs font-normal text-muted-foreground">
								{" "}
								({(focusClaimIndex % claimControls.length) + 1}/
								{claimControls.length})
							</span>
						) : null}
					</p>
				</div>
				<div className="rounded-md border border-border/40 bg-background/50 px-2 py-1">
					<p className="text-[10px] uppercase text-muted-foreground">
						Service lines
					</p>
					<p className="text-sm font-semibold tabular-nums">
						{summary.serviceLineCount.toLocaleString()}
					</p>
				</div>
				<div className="rounded-md border border-border/40 bg-background/50 px-2 py-1">
					<p className="text-[10px] uppercase text-muted-foreground">
						{summary.paymentTotal != null ? "Payment total" : "Top CAS"}
					</p>
					<p className="truncate text-sm font-semibold tabular-nums">
						{summary.paymentTotal != null
							? formatMoney(summary.paymentTotal)
							: (summary.topCasCodes[0]?.code ?? "—")}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
				<div className="relative min-w-[140px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setHitIndex(0);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								if (e.shiftKey) goPrevHit();
								else goNextHit();
							}
						}}
						placeholder="Search segments…"
						className="h-8 pl-8 text-xs"
					/>
				</div>
				{hits.length > 0 ? (
					<span className="text-[11px] tabular-nums text-muted-foreground">
						{hitIndex + 1}/{hits.length}
					</span>
				) : search.trim() ? (
					<span className="text-[11px] text-muted-foreground">No hits</span>
				) : null}
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs"
					onClick={goPrevHit}
					disabled={!hits.length}
				>
					Prev
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs"
					onClick={goNextHit}
					disabled={!hits.length}
				>
					Next
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs"
					onClick={expandAll}
				>
					Expand
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs"
					onClick={collapseAll}
				>
					Collapse
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8"
					onClick={() => setWrap((w) => !w)}
					title="Toggle wrap"
				>
					{wrap ? (
						<UnfoldHorizontal className="size-3.5" />
					) : (
						<WrapText className="size-3.5" />
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8"
					onClick={copySelected}
					title="Copy segment"
				>
					<Copy className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8"
					onClick={downloadRaw}
					title="Download raw"
				>
					<Download className="size-3.5" />
				</Button>
				{showInspector ? (
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => setInspectorOpen((v) => !v)}
						title="Toggle inspector"
					>
						{inspectorOpen ? (
							<PanelRightClose className="size-3.5" />
						) : (
							<PanelRightOpen className="size-3.5" />
						)}
					</Button>
				) : null}
			</div>
		</div>
	);

	const segmentList = (
		<ScrollArea
			className="h-full min-h-0"
			viewportRef={viewportRef}
			scrollbarClassName="w-1.5"
			thumbClassName="bg-border"
			viewportClassName="[&>div]:!block [&>div]:!min-h-full"
		>
			{shouldVirtualize ? (
				<div style={{ height: total, width: "100%", position: "relative" }}>
					{items.map((virtualRow) => {
						const row = visible[virtualRow.index]!;
						return (
							<SegmentRow
								key={row.segment.index}
								row={row}
								wrap={wrap}
								selected={selectedIndex === row.segment.index}
								matched={hits.includes(row.segment.index)}
								collapsed={collapsed.has(row.segment.index)}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start}px)`,
								}}
								onSelect={() => setSelectedIndex(row.segment.index)}
								onToggle={() => toggleCollapse(row.segment.index)}
							/>
						);
					})}
				</div>
			) : (
				<div className="pb-2 font-mono text-[11px]">
					{visible.map((row) => (
						<SegmentRow
							key={row.segment.index}
							row={row}
							wrap={wrap}
							selected={selectedIndex === row.segment.index}
							matched={hits.includes(row.segment.index)}
							collapsed={collapsed.has(row.segment.index)}
							style={{ minHeight: ROW_H }}
							onSelect={() => setSelectedIndex(row.segment.index)}
							onToggle={() => toggleCollapse(row.segment.index)}
						/>
					))}
				</div>
			)}
		</ScrollArea>
	);

	const inspector = (
		<div className="flex h-full min-h-0 flex-col border-l border-border/50 bg-background/40">
			<p className="shrink-0 border-b border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
				Selection
			</p>
			<ScrollArea className="min-h-0 flex-1" scrollbarClassName="w-1.5">
				<div className="p-3 text-xs">
					{selected && selectedMeta ? (
						<div className="space-y-2">
							<p className="font-mono text-sm font-semibold">{selected.tag}</p>
							<p className="text-muted-foreground">
								{segmentDescription(selected.tag)}
							</p>
							<p className="text-[11px] text-muted-foreground">
								{selectedMeta.label} · depth {selectedMeta.depth}
							</p>
							<div className="space-y-1 border-t border-border/40 pt-2">
								{selected.elements.slice(1).map((el, i) => (
									<div key={`${selected.index}-${i}`} className="flex gap-2">
										<span className="w-8 shrink-0 tabular-nums text-muted-foreground">
											{String(i + 1).padStart(2, "0")}
										</span>
										<span className="min-w-0 break-all font-mono">
											{el || <span className="text-muted-foreground">∅</span>}
										</span>
									</div>
								))}
							</div>
						</div>
					) : (
						<p className="text-muted-foreground">
							Select a segment to inspect elements.
						</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);

	return (
		<div
			className={cn(
				"flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			{chrome}
			{showInspector && inspectorOpen ? (
				<div className="min-h-0 flex-1">
					<ResizablePanelGroup direction="horizontal" className="h-full">
						<ResizablePanel defaultSize={72} minSize={45} className="min-w-0">
							<div className="h-full min-h-0">{segmentList}</div>
						</ResizablePanel>
						<ResizableHandle withHandle />
						<ResizablePanel defaultSize={28} minSize={16} maxSize={45}>
							{inspector}
						</ResizablePanel>
					</ResizablePanelGroup>
				</div>
			) : (
				<div className="min-h-0 flex-1">{segmentList}</div>
			)}
		</div>
	);
}

function SegmentRow({
	row,
	wrap,
	selected,
	matched,
	collapsed,
	style,
	onSelect,
	onToggle,
}: {
	row: StructuredSegment;
	wrap: boolean;
	selected: boolean;
	matched: boolean;
	collapsed: boolean;
	style?: CSSProperties;
	onSelect: () => void;
	onToggle: () => void;
}) {
	const role = segmentRole(row.segment.tag);
	const pad = Math.min(row.depth, 10) * 12;
	const canCollapse = row.isCollapseRoot && row.groupEnd > row.segment.index;

	return (
		<div
			style={style}
			className={cn(
				"flex cursor-pointer items-start gap-1 border-b border-border/20 px-2 hover:bg-muted/40",
				selected && "bg-primary/10 hover:bg-primary/15",
				matched && !selected && "bg-amber-500/10"
			)}
			onClick={onSelect}
		>
			<button
				type="button"
				className="mt-1 flex size-4 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"
				disabled={!canCollapse}
				onClick={(e) => {
					e.stopPropagation();
					if (canCollapse) onToggle();
				}}
				aria-label={collapsed ? "Expand loop" : "Collapse loop"}
			>
				{canCollapse ? (
					collapsed ? (
						<ChevronRight className="size-3.5" />
					) : (
						<ChevronDown className="size-3.5" />
					)
				) : (
					<span className="size-3.5" />
				)}
			</button>
			<span
				className="mt-0.5 shrink-0 tabular-nums text-[10px] text-muted-foreground"
				style={{ width: 36 }}
			>
				{row.segment.index + 1}
			</span>
			<span
				className={cn(
					"mt-0.5 inline-flex shrink-0 rounded px-1 py-0 text-[10px] font-semibold uppercase",
					SEGMENT_ROLE_BADGE[role]
				)}
			>
				{row.segment.tag}
			</span>
			<span
				className={cn(
					"min-w-0 flex-1 py-0.5",
					SEGMENT_ROLE_CLASS[role],
					wrap ? "whitespace-pre-wrap break-all" : "truncate"
				)}
				style={{ paddingLeft: pad }}
			>
				{row.segment.elements.slice(1).join("*")}
			</span>
		</div>
	);
}

export function EdiViewerLoader({
	load,
	fileName,
	jumpTo,
	focusClaimIndex,
	className,
	compact,
	showInspector,
}: {
	load: () => Promise<string>;
	fileName?: string;
	jumpTo?: string | null;
	focusClaimIndex?: number | null;
	className?: string;
	compact?: boolean;
	showInspector?: boolean;
}) {
	const [raw, setRaw] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setRaw(null);
		setError(null);
		load()
			.then((text) => {
				if (!cancelled) setRaw(text);
			})
			.catch((err: unknown) => {
				if (!cancelled)
					setError(err instanceof Error ? err.message : "Failed to load EDI");
			});
		return () => {
			cancelled = true;
		};
	}, [load]);

	if (error) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
				{error}
			</div>
		);
	}
	if (raw == null) {
		return (
			<div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-border/50 text-sm text-muted-foreground">
				Loading EDI…
			</div>
		);
	}
	return (
		<EdiViewer
			raw={raw}
			fileName={fileName}
			jumpTo={jumpTo}
			focusClaimIndex={focusClaimIndex}
			className={className}
			compact={compact}
			showInspector={showInspector}
		/>
	);
}

export type { X12Document };
