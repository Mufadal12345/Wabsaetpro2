import React from "react";
import { Modal } from "../pages/admin/Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "تأكيد الإجراء",
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4 text-center font-tajawal">
        <p className="text-white text-xl mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-bold"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/20 font-bold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
