import type {
	NotificationsCreateDto,
	NotificationsUpdateDto,
} from "../dto/notificationsDto";
import type { NotificationsModel } from "../types/notificationsModel";

export { toNotificationsModel } from "../../shared/mappers/notificationsMappers";

export function toNotificationsCreateDto(
	model: Pick<NotificationsModel, "name">
): NotificationsCreateDto {
	return { name: model.name };
}

export function toNotificationsUpdateDto(
	model: Partial<Pick<NotificationsModel, "name">>
): NotificationsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}
