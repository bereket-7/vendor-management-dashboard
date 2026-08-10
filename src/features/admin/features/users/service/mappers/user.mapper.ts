import type { ApiUserDto } from "../../dto/user.dto";
import type { UserModel } from "../../types/user.types";

function rolesFromDto(dto: ApiUserDto): string[] {
	if (Array.isArray(dto.roles) && dto.roles.length) {
		return dto.roles.map(String);
	}
	const roles: string[] = [];
	if (dto.is_superuser) roles.push("superuser");
	if (dto.is_admin) roles.push("admin");
	if (dto.is_staff) roles.push("staff");
	if (!roles.length) roles.push("user");
	return roles;
}

function displayName(dto: ApiUserDto): string | null {
	const full = dto.full_name?.trim();
	if (full) return full;
	const name = dto.name?.trim();
	if (name) return name;
	const parts = [dto.first_name, dto.last_name]
		.map((p) => p?.trim())
		.filter(Boolean);
	if (parts.length) return parts.join(" ");
	return dto.username?.trim() || dto.email?.trim() || null;
}

export function toUserModel(dto: ApiUserDto): UserModel | null {
	const id = dto.id != null ? String(dto.id) : null;
	const email = dto.email?.trim();
	const name = displayName(dto);
	if (!id || !email || !name) return null;

	return {
		id,
		email,
		name,
		username: dto.username?.trim() || undefined,
		roles: rolesFromDto(dto),
		isActive: dto.is_active !== false,
		phone:
			dto.phone_number != null && dto.phone_number !== ""
				? String(dto.phone_number)
				: null,
		isStaff: Boolean(dto.is_staff),
		isAdmin: Boolean(dto.is_admin || dto.is_superuser),
	};
}

export function toUserModelList(dtos: ApiUserDto[]): UserModel[] {
	return dtos
		.map((dto) => toUserModel(dto))
		.filter((model): model is UserModel => model !== null);
}
