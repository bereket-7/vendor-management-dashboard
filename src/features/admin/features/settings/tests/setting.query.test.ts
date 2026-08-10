import { apiClient } from "@/lib/api/client";

import { MOCK_SETTINGS } from "../service/api/setting.mock";

jest.mock("@/lib/api/client", () => ({
	apiClient: jest.fn(),
}));

const mockApiClient = jest.mocked(apiClient);

describe("settingApi.list", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.NEXT_PUBLIC_USE_MOCK = "true";
	});

	it("returns mock settings when mock flag is set", async () => {
		const { settingApi } = await import("../service/api/setting.api");
		const settings = await settingApi.list();

		expect(mockApiClient).not.toHaveBeenCalled();
		expect(settings.length).toBe(MOCK_SETTINGS.length);
	});
});
