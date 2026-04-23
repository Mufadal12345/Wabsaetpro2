import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay fixed inset-0 z-[9999] flex justify-center items-end md:items-center bg-black/90 backdrop-blur-md animate-fade-in p-0 md:p-4 overflow-y-auto custom-scrollbar">
      <div className="glass-dark rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 md:p-10 w-full max-w-4xl mx-auto flex flex-col shadow-2xl border-t md:border border-white/10 relative h-[90vh] md:h-auto md:max-h-[85vh]">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 md:hidden flex-shrink-0" />
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <h3 className="text-2xl md:text-4xl font-bold gradient-text font-amiri">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xl md:text-2xl"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide pb-10">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
