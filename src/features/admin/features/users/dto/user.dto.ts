export type ApiUserDto = {
	id?: string | number | null;
	email?: string | null;
	name?: string | null;
	username?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	full_name?: string | null;
	phone_number?: string | number | null;
	roles?: string[] | null;
	is_active?: boolean | null;
	is_staff?: boolean | null;
	is_admin?: boolean | null;
	is_superuser?: boolean | null;
};

export type ApiUserListResponseDto = {
	results?: ApiUserDto[] | null;
	count?: number | null;
};
