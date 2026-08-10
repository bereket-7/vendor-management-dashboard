import { toUserModel, toUserModelList } from "../service/mappers/user.mapper";

describe("user.mapper", () => {
	it("maps valid dto to UserModel", () => {
		const model = toUserModel({
			id: "1",
			email: "a@b.com",
			name: "Alice",
			roles: ["admin"],
			is_active: true,
		});
		expect(model).toEqual({
			id: "1",
			email: "a@b.com",
			name: "Alice",
			username: undefined,
			roles: ["admin"],
			isActive: true,
			phone: null,
			isStaff: false,
			isAdmin: false,
		});
	});

	it("maps vendor-core user fields", () => {
		const model = toUserModel({
			id: "14c07da3-8f5c-4244-b0cf-7e8b9a840b3e",
			username: "tilla.dev",
			email: "tilla.dev@vm.com",
			full_name: "Tilla Dev",
			is_active: true,
			is_staff: true,
			is_admin: true,
			is_superuser: true,
			phone_number: 25123456789,
		});
		expect(model?.name).toBe("Tilla Dev");
		expect(model?.roles).toEqual(["superuser", "admin", "staff"]);
		expect(model?.phone).toBe("25123456789");
	});

	it("drops invalid rows in list", () => {
		const list = toUserModelList([
			{ id: "1", email: "a@b.com", name: "A" },
			{ id: null, email: "x@y.com", name: "Bad" },
		]);
		expect(list).toHaveLength(1);
	});
});
