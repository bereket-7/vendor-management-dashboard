import type {
	ContractModel,
	ContractStatus,
} from "@/features/shared/vms/types";
import type { ContractDto } from "@/lib/vendor-core/types";

const CONTRACT_STATUSES = new Set<ContractStatus>([
	"draft",
	"pending_approval",
	"active",
	"expired",
	"terminated",
]);

function mapStatus(raw: string): ContractStatus {
	const value = raw.toLowerCase() as ContractStatus;
	return CONTRACT_STATUSES.has(value) ? value : "draft";
}

export function contractDtoToModel(dto: ContractDto): ContractModel {
	const value = dto.total_contract_value;
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
		slaSummary: null,
		updatedAt: dto.updated_at ?? dto.created_at ?? new Date().toISOString(),
		contractType: dto.contract_type,
		paymentTerms:
			dto.payment_terms_days != null
				? `Net ${dto.payment_terms_days}`
				: undefined,
	};
}
