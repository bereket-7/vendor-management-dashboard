import { apiClient } from "@/lib/api/client";

import { MOCK_USERS } from "../service/api/user.mock";

jest.mock("@/lib/api/client", () => ({
	apiClient: jest.fn(),
}));

const mockApiClient = jest.mocked(apiClient);

describe("userApi.list", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.NEXT_PUBLIC_USE_MOCK = "true";
	});

	it("returns mock users when mock flag is set", async () => {
		const { userApi } = await import("../service/api/user.api");
		const users = await userApi.list();

		expect(mockApiClient).not.toHaveBeenCalled();
		expect(users.length).toBe(MOCK_USERS.length);
		expect(users[0]?.email).toBe(MOCK_USERS[0]?.email);
	});
});
