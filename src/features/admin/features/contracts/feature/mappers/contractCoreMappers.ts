import type {
	ContractDocumentItem,
	ContractModel,
	ContractSlaMetric,
	ContractStatus,
	ContractTermPeriod,
	ContractTermStatus,
} from "@/features/shared/vms/types";
import type { ContractDto, ContractDetailDto, ProcurementDocumentDto } from "@/lib/vendor-core/types";

const CONTRACT_STATUSES = new Set<ContractStatus>([
	"draft",
	"pending_approval",
	"active",
	"expired",
	"terminated",
]);

const API_CONTRACT_TYPES = new Set([
	"msa",
	"sow",
	"nda",
	"amendment",
	"purchase_agreement",
	"sla",
	"dpa",
]);

const CONTRACT_TYPE_ALIASES: Record<string, string> = {
	standard: "msa",
	master: "msa",
	msa: "msa",
	sow: "sow",
	nda: "nda",
	amendment: "amendment",
	purchase_agreement: "purchase_agreement",
	purchase: "purchase_agreement",
	sla: "sla",
	dpa: "dpa",
	data_processing_agreement: "dpa",
};

const API_STATUS_ALIASES: Record<string, string> = {
	pending_approval: "in_negotiation",
};

/** Map UI/mock contract type labels → procurement API `contract_type` choices. */
export function toApiContractType(raw?: string | null): string {
	const key = (raw ?? "msa").trim().toLowerCase().replace(/[\s-]+/g, "_");
	if (API_CONTRACT_TYPES.has(key)) return key;
	return CONTRACT_TYPE_ALIASES[key] ?? "msa";
}

/** Map UI contract status → procurement API `status` choices. */
export function toApiContractStatus(raw?: string | null): string {
	if (!raw) return "draft";
	return API_STATUS_ALIASES[raw] ?? raw;
}

export const CONTRACT_TYPE_OPTIONS = [
	{ value: "msa", label: "Master service agreement" },
	{ value: "sow", label: "Statement of work" },
	{ value: "nda", label: "Non-disclosure agreement" },
	{ value: "purchase_agreement", label: "Purchase agreement" },
	{ value: "sla", label: "Service level agreement" },
	{ value: "dpa", label: "Data processing agreement" },
	{ value: "amendment", label: "Amendment" },
] as const;

function mapStatus(raw: string): ContractStatus {
	const value = raw.toLowerCase() as ContractStatus;
	return CONTRACT_STATUSES.has(value) ? value : "draft";
}

function deriveTermStatus(dto: ContractDto): ContractTermStatus {
	if (dto.status === "expired" || dto.status === "terminated") {
		return "completed";
	}
	const now = Date.now();
	const start = new Date(dto.effective_date).getTime();
	const end = dto.expiration_date
		? new Date(dto.expiration_date).getTime()
		: null;
	if (!Number.isNaN(start) && start > now) return "upcoming";
	if (end != null && !Number.isNaN(end) && end < now) return "completed";
	return "current";
}

/** List API has no `terms[]` embed — derive primary term from effective/expiration dates. */
function deriveTerms(dto: ContractDto): ContractTermPeriod[] {
	return [
		{
			id: `${dto.id}-primary`,
			label: "Primary Term",
			startDate: dto.effective_date,
			endDate: dto.expiration_date ?? dto.effective_date,
			status: deriveTermStatus(dto),
		},
	];
}

function mapApiTerms(dto: ContractDetailDto): ContractTermPeriod[] {
	if (!dto.terms?.length) return deriveTerms(dto);
	return dto.terms.map((term, index) => {
		const termDto: ContractDto = {
			...dto,
			effective_date: term.effective_date,
			expiration_date: term.expiration_date ?? term.effective_date,
		};
		const label =
			term.kind === "amendment"
				? `Amendment ${term.amendment_number ?? index + 1}`
				: term.kind === "primary"
					? "Primary Term"
					: term.kind.replace(/_/g, " ");
		return {
			id: `${dto.id}-term-${term.kind}-${term.amendment_number ?? index}`,
			label,
			startDate: term.effective_date,
			endDate: term.expiration_date ?? term.effective_date,
			status: deriveTermStatus(termDto),
		};
	});
}

function deriveRateSchedule(dto: ContractDto): ContractModel["rateSchedule"] {
	const value = dto.total_contract_value;
	const amount = value != null ? Number(value) : 0;
	if (!Number.isFinite(amount) || amount <= 0) return [];
	return [
		{
			id: `${dto.id}-total-value`,
			serviceCode: "CONTRACT",
			description: dto.title || "Total contract value",
			contractedRate: amount,
			unit: "lump sum",
		},
	];
}

function mapApiRateSchedule(dto: ContractDetailDto): ContractModel["rateSchedule"] {
	if (dto.rate_schedule?.length) {
		return dto.rate_schedule.map((line, index) => ({
			id: String(line.id ?? `${dto.id}-rate-${index}`),
			serviceCode: String(line.service_code ?? line.serviceCode ?? "—"),
			description: String(line.description ?? line.name ?? "Rate line"),
			contractedRate: Number(line.contracted_rate ?? line.contractedRate ?? line.rate ?? 0),
			unit: String(line.unit ?? "each"),
		}));
	}
	return deriveRateSchedule(dto);
}

function mapApiSlaMetrics(dto: ContractDetailDto): ContractSlaMetric[] {
	if (dto.sla_metrics?.length) {
		return dto.sla_metrics.map((metric) => ({
			id: metric.id,
			name: metric.description,
			target: metric.due_date
				? `Due ${metric.due_date}`
				: metric.status || metric.responsible_party,
		}));
	}
	const paymentTerms =
		dto.payment_terms_days != null
			? `Net ${dto.payment_terms_days}`
			: undefined;
	return paymentTerms
		? [
				{
					id: `${dto.id}-payment-terms`,
					name: "Payment terms",
					target: paymentTerms,
				},
			]
		: [];
}

function mapApiDocuments(dto: ContractDetailDto): ContractDocumentItem[] {
	if (!dto.documents?.length) return [];
	return dto.documents.map((doc) => ({
		id: doc.id,
		name: doc.title,
		type: doc.document_type.replace(/_/g, " "),
		uploadedOn: dto.updated_at ?? dto.created_at ?? new Date().toISOString(),
		fileExtension: doc.document_type.slice(0, 4),
		vendorId: dto.vendor_id,
	}));
}

export function contractDtoToModel(dto: ContractDto | ContractDetailDto): ContractModel {
	const detail = dto as ContractDetailDto;
	const value = dto.total_contract_value;
	const paymentTerms =
		dto.payment_terms_days != null
			? `Net ${dto.payment_terms_days}`
			: undefined;
	const documents = mapApiDocuments(detail);
	return {
		id: dto.id,
		number: dto.contract_number,
		title: dto.title,
		vendorId: dto.vendor_id,
		vendorName: dto.vendor_name ?? "",
		status: mapStatus(dto.status),
		value: value != null ? Number(value) : 0,
		currency: dto.currency ?? "USD",
		startDate: dto.effective_date,
		endDate: dto.expiration_date ?? dto.effective_date,
		slaSummary: paymentTerms ?? null,
		updatedAt: dto.updated_at ?? dto.created_at ?? new Date().toISOString(),
		contractType: dto.contract_type,
		paymentTerms,
		paymentModel: "Contracted Rate",
		terms: mapApiTerms(detail),
		rateSchedule: mapApiRateSchedule(detail),
		slaMetrics: mapApiSlaMetrics(detail),
		documents,
	};
}

function fileExtensionFromDocument(dto: ProcurementDocumentDto): string {
	const fromMime = dto.mime_type?.split("/")[1];
	if (fromMime) return fromMime.slice(0, 4);
	const fromKey = dto.storage_key.split(".").pop();
	return fromKey?.slice(0, 4) ?? "file";
}

export function procurementDocumentDtoToItem(
	dto: ProcurementDocumentDto
): ContractDocumentItem {
	return {
		id: dto.id,
		name: dto.title,
		type: dto.document_type.replace(/_/g, " "),
		uploadedOn: dto.created_at ?? new Date().toISOString(),
		fileExtension: fileExtensionFromDocument(dto),
		vendorId: dto.vendor_id,
	};
}
