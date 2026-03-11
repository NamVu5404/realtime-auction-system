import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { App } from "antd";
import React from "react";

/**
 * Custom hook to handle success and error messages globally with
 * Premium Glossy consistent styling and intelligent API error handling.
 */
export const useToast = () => {
  const { message } = App.useApp();

  const showSuccess = (msg: string) => {
    message.success({
      content: msg,
      icon: React.createElement(CheckCircleFilled, {
        style: { color: "#10B981" },
      }),
      className: "premium-toast-success",
    });
  };

  const showError = (error: any, fallbackMsg: string) => {
    let content = fallbackMsg;

    // Handle API error structure (Intelligent Message Logic)
    if (error?.response?.data) {
      const data = error.response.data;
      // Case: Hardcoded code 9999 means keep local message
      if (data.code !== 9999 && (data.message || data.error)) {
        content = data.message || data.error;
      }
    } else if (typeof error === "string") {
      content = error;
    } else if (error?.message && !error?.response) {
      // General JS error
      content = error.message;
    }

    message.error({
      content: content,
      icon: React.createElement(CloseCircleFilled, {
        style: { color: "#F43F5E" },
      }),
      className: "premium-toast-error",
    });
  };

  const showLoading = (msg: string) => {
    return message.loading({
      content: msg,
      className: "premium-toast-loading",
    });
  };

  return { showSuccess, showError, showLoading };
};

export default useToast;
