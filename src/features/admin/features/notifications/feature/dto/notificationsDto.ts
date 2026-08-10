import type { ApiNotificationsRecordDto } from "../../shared/dto/notificationsRecordDto";

export type ApiNotificationsDto = ApiNotificationsRecordDto;

export type NotificationsCreateDto = {
	name: string;
};

export type NotificationsUpdateDto = Partial<NotificationsCreateDto>;
