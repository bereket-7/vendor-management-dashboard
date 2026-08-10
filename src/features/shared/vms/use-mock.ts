import { isMockEnabled } from "@/lib/mock-mode";

/** @deprecated Prefer `isMockEnabled` from `@/lib/mock-mode`. */
export function isVmsMockEnabled() {
	return isMockEnabled();
}
