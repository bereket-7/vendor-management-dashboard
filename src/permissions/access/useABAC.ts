"use client";

import { useVendorCoreSessionOptional } from "@/components/vendor-core/VendorCoreGate";
import { authClient } from "@/lib/auth-client";
import { MOCK_ADMIN_USER, isMockAuthEnabled } from "@/lib/auth/mock-auth";
import { resolveAbacUser, serverUserFromMe } from "@/lib/auth/session-user";

import { PolicyEngine } from "../abac/engine";
import type { AttributeContext, AttributeMap } from "../abac/types";

export const useABAC = () => {
	const { data: session } = authClient.useSession();
	const vendorCore = useVendorCoreSessionOptional();

	const sessionUser = isMockAuthEnabled()
		? MOCK_ADMIN_USER
		: vendorCore?.shellAuth && vendorCore.user
			? serverUserFromMe(vendorCore.user)
			: (session?.user as Parameters<typeof resolveAbacUser>[0]);

	const abacUser = resolveAbacUser(sessionUser);

	const checkAccess = (
		resourceType: string,
		action: string,
		resource?: Record<string, unknown>
	) => {
		if (!abacUser) {
			return false;
		}

		const environment = {
			time: new Date().toLocaleTimeString("en-US", { hour12: false }),
		};

		const context: AttributeContext = {
			action,
			user: {
				...abacUser,
				attributes: abacUser.attributes as AttributeMap,
			},
			resource: {
				type: resourceType,
				attributes: (resource ?? {}) as AttributeMap,
			},
			environment,
		};

		return PolicyEngine.evaluate(context);
	};

	return { checkAccess, user: abacUser };
};
