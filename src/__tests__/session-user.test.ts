import { resolveAbacUser } from "@/lib/auth/session-user";

describe("resolveAbacUser", () => {
	const originalDevAdmin = process.env.NEXT_PUBLIC_DEV_ADMIN;
	const originalMock = process.env.NEXT_PUBLIC_USE_MOCK;

	afterEach(() => {
		process.env.NEXT_PUBLIC_DEV_ADMIN = originalDevAdmin;
		process.env.NEXT_PUBLIC_USE_MOCK = originalMock;
	});

	it("returns null without user", () => {
		expect(resolveAbacUser(null)).toBeNull();
	});

	it("maps role and roles from session user when mocks are off", () => {
		process.env.NEXT_PUBLIC_USE_MOCK = "false";
		process.env.NEXT_PUBLIC_DEV_ADMIN = "";
		const user = resolveAbacUser({
			id: "1",
			role: "editor",
			roles: ["admin"],
		});
		expect(user?.roles).toEqual(expect.arrayContaining(["editor", "admin"]));
	});

	it("grants admin when mock mode is enabled", () => {
		process.env.NEXT_PUBLIC_USE_MOCK = "true";
		const user = resolveAbacUser({ id: "1", role: "viewer" });
		expect(user?.roles).toEqual(["admin"]);
	});

	it("grants admin when NEXT_PUBLIC_DEV_ADMIN is true", () => {
		process.env.NEXT_PUBLIC_USE_MOCK = "false";
		process.env.NEXT_PUBLIC_DEV_ADMIN = "true";
		const user = resolveAbacUser({ id: "1", role: "viewer" });
		expect(user?.roles).toEqual(["admin"]);
	});
});
