export type UserModel = {
	id: string;
	email: string;
	name: string;
	username?: string;
	roles: string[];
	isActive: boolean;
	phone?: string | null;
	isStaff?: boolean;
	isAdmin?: boolean;
};
