import { message, notification, Modal } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { NotificationInstance } from "antd/es/notification/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";

/**
 * AntdStatic utility
 * This allows using context-aware message, notification, and modal
 * outside of React components while still inheriting the theme from ConfigProvider.
 */
let messageApi: MessageInstance = message;
let notificationApi: NotificationInstance = notification;
let modalApi: ModalStaticFunctions = Modal;

export const setAntdStatic = (
  msg: MessageInstance,
  notif: NotificationInstance,
  mod: ModalStaticFunctions,
) => {
  messageApi = msg;
  notificationApi = notif;
  modalApi = mod;
};

export {
  messageApi as message,
  notificationApi as notification,
  modalApi as modal,
};
