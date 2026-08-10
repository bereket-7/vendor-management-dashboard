import { apiClient } from "@/lib/api/client";

import { MOCK_ROLES } from "../service/api/role.mock";

jest.mock("@/lib/api/client", () => ({
	apiClient: jest.fn(),
}));

const mockApiClient = jest.mocked(apiClient);

describe("roleApi.list", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.NEXT_PUBLIC_USE_MOCK = "true";
	});

	it("returns mock roles when mock flag is set", async () => {
		const { roleApi } = await import("../service/api/role.api");
		const roles = await roleApi.list();

		expect(mockApiClient).not.toHaveBeenCalled();
		expect(roles.length).toBe(MOCK_ROLES.length);
		expect(roles[0]?.name).toBe(MOCK_ROLES[0]?.name);
	});
});
