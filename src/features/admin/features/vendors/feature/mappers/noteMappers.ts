import type { VendorNoteDto } from "@/lib/vendor-core/types";

type NoteCategory =
	| "Configuration"
	| "Operations"
	| "Mapping"
	| "General"
	| "Access";

type NotePriority = "High" | "Medium" | "Low";
type NoteStatus = "Open" | "Closed" | "Archived";

export type VendorNoteUi = {
	id: string;
	title: string;
	category: NoteCategory;
	priority: NotePriority;
	status: NoteStatus;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	updatedBy: string;
	body: string;
	starred: boolean;
	actionItem: boolean;
	attachments: { id: string; name: string; size: string }[];
	activity: { id: string; user: string; action: string; at: string }[];
};

function formatWhen(iso?: string): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function authorName(dto: VendorNoteDto): string {
	const author = dto.author;
	if (!author) return "System";
	return author.name ?? author.email ?? "System";
}

export function vendorNoteDtoToUi(dto: VendorNoteDto): VendorNoteUi {
	const createdBy = authorName(dto);
	const createdAt = formatWhen(dto.created_at);
	const updatedAt = formatWhen(dto.updated_at ?? dto.created_at);
	const body = (dto.body ?? "").trim();
	const title = body.length > 64 ? `${body.slice(0, 64)}…` : body || "Note";
	return {
		id: dto.id,
		title,
		category: "General",
		priority: dto.is_pinned ? "High" : "Medium",
		status: "Open",
		createdBy,
		createdAt,
		updatedAt,
		updatedBy: createdBy,
		body,
		starred: dto.is_pinned,
		actionItem: false,
		attachments: [],
		activity: [
			{
				id: `${dto.id}-created`,
				user: createdBy,
				action: "created this note",
				at: createdAt,
			},
		],
	};
}
