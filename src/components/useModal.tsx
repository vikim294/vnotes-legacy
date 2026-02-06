import { createPortal } from "react-dom";
import { useCallback, useState } from "react";

interface ModalProps {
  width?: number;
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function useModal() {
  const [visible, setVisible] = useState(false);

  const Modal = ({ width, header, children, footer }: ModalProps = {}) => {
    if (!visible) return null;
    return createPortal(
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onPointerDown={closeModal}
      >
        <div
          className={`bg-surface-900 border border-surface-700 rounded-xl shadow-2xl max-w-full w-full`}
          style={{ width: width ?? 400 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {header && (
            <div className="px-6 py-4 border-b border-surface-700">
              <h3 className="text-lg font-semibold text-slate-100">{header}</h3>
            </div>
          )}
          <div className="px-6 py-4 text-slate-200">
            {children}
          </div>
          {footer && (
            <div className="px-6 py-4 bg-surface-800/50 rounded-b-xl flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  };

  const openModal = useCallback(() => setVisible(true), []);
  const closeModal = useCallback(() => setVisible(false), []);

  return {
    Modal,
    openModal,
    closeModal,
  };
}
