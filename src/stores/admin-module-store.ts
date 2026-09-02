import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AdminModuleId, ProgramFileType } from "@/types/UI/system.types";

export const MODULE_HOME_HREF: Record<AdminModuleId, string> = {
	vendor_management: "/",
	claim_encounter: "/admin/claim-encounter",
	eligibility_operations: "/admin/my-work-queue",
};

interface AdminModuleState {
	moduleId: AdminModuleId;
	fileType: ProgramFileType;
	setModuleId: (moduleId: AdminModuleId) => void;
	setFileType: (fileType: ProgramFileType) => void;
}

export const useAdminModuleStore = create<AdminModuleState>()(
	persist(
		(set) => ({
			moduleId: "eligibility_operations",
			fileType: "MDH",
			setModuleId: (moduleId) => set({ moduleId }),
			setFileType: (fileType) => set({ fileType }),
		}),
		{
			name: "adminModule:v2",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				moduleId: state.moduleId,
				fileType: state.fileType,
			}),
		}
	)
);
